// Side-effect module for interview lifecycle emails.
//
// Today's implementation: fire-and-forget after the mutation commits
// (queued onto the microtask queue via `void`, awaited inside the
// action only to surface logs). Failures don't block the mutation —
// the action has already returned by the time the SMTP roundtrip
// resolves.
//
// Tomorrow's drop-in: replace the body of `enqueueInterviewEffect`
// with a QStash / Inngest / SQS publish. The action call sites don't
// change. That's the whole point of forcing them through this
// function — actions stop knowing about email mechanics, just intent.

import { getInterviewForEmails } from '@/data/interview';
import { InterviewStatus } from '@/lib/generated/prisma/browser';
import {
  sendFeedbackReminderEmail,
  sendInterviewScheduleEmail,
  sendNewInterviewNotifications,
} from '@/lib/mail';

export type InterviewEffect =
  | { type: 'created'; interviewId: string }
  | {
      type: 'status-changed';
      interviewId: string;
      newStatus: InterviewStatus;
    };

// Returns synchronously; the email work runs in a detached task so the
// caller's await chain isn't held by SMTP. Errors are caught and
// logged inside the task — they shouldn't escape to the action.
export function enqueueInterviewEffect(effect: InterviewEffect): void {
  void runEffect(effect);
}

async function runEffect(effect: InterviewEffect): Promise<void> {
  try {
    switch (effect.type) {
      case 'created':
        await onCreated(effect.interviewId);
        return;
      case 'status-changed':
        await onStatusChanged(effect.interviewId, effect.newStatus);
        return;
    }
  } catch (error) {
    console.error(`Interview effect ${effect.type} failed:`, error);
  }
}

async function onCreated(interviewId: string): Promise<void> {
  const interview = await getInterviewForEmails(interviewId);
  if (!interview) return;
  await sendNewInterviewNotifications(interview);
}

async function onStatusChanged(
  interviewId: string,
  newStatus: InterviewStatus
): Promise<void> {
  const interview = await getInterviewForEmails(interviewId);
  if (!interview) return;

  if (newStatus === InterviewStatus.COMPLETED) {
    await Promise.all(
      interview.interviewers
        .filter((i) => i.email)
        .map((interviewer) =>
          sendFeedbackReminderEmail({
            to: interviewer.email!,
            interviewerName: interviewer.name ?? '',
            candidateName: interview.candidate.name,
            interviewTitle: interview.title,
            interviewDateTime: interview.startTime,
            interviewId,
          })
        )
    );
    return;
  }

  if (newStatus === InterviewStatus.SCHEDULED) {
    const interviewerNames = interview.interviewers.map((i) => i.name ?? '');
    const scheduleArgs = {
      candidateName: interview.candidate.name,
      interviewTitle: interview.title,
      interviewDateTime: interview.startTime,
      interviewerNames,
      location: interview.location ?? undefined,
      notes: interview.notes ?? undefined,
    };
    const recipients = [
      ...interview.interviewers.filter((i) => i.email).map((i) => i.email!),
      ...(interview.candidate.email ? [interview.candidate.email] : []),
    ];
    await Promise.all(
      recipients.map((to) =>
        sendInterviewScheduleEmail({ to, ...scheduleArgs })
      )
    );
  }
}
