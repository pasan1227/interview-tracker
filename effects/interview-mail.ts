// Side-effect module for interview lifecycle emails.
//
// `enqueueInterviewEffect` returns synchronously; the email work runs
// via `after()` from next/server so serverless instances keep the
// function alive past the response. Errors are caught + logged inside
// the task — they shouldn't reach the action.
//
// Tomorrow's drop-in: replace the body with a QStash / Inngest / SQS
// publish. The action call sites don't change.

import { getInterviewForEmails } from '@/data/interview';
import { InterviewStatus } from '@/lib/generated/prisma/browser';
import {
  sendFeedbackReminderEmail,
  sendInterviewScheduleEmail,
  sendNewInterviewNotifications,
} from '@/lib/mail';
import { rateLimit } from '@/lib/rate-limit';
import { after } from 'next/server';

export type InterviewEffect =
  | { type: 'created'; interviewId: string }
  | {
      type: 'status-changed';
      interviewId: string;
      newStatus: InterviewStatus;
    };

// Cap on simultaneous SMTP requests per fan-out. Resend's per-second
// rate limit is the real backstop; 50-interviewer interviews used to
// hammer it unbounded.
const EMAIL_FANOUT_CONCURRENCY = 4;

// Cool-down after a fan-out for a given (interviewId, newStatus) pair.
// S8 (round 5) blocked no-op writes; round-6 S1 closes the toggle-
// spam case where a malicious user could flip a status back-and-forth
// to re-fire the fan-out each time.
const STATUS_EMAIL_COOLDOWN_MS = 5 * 60 * 1000;

// Returns synchronously to the caller. `after()` keeps the function
// instance alive long enough to drain the SMTP work on serverless.
export function enqueueInterviewEffect(effect: InterviewEffect): void {
  after(async () => {
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
      console.error('[interview-effect] failed', {
        type: effect.type,
        interviewId: effect.interviewId,
        error,
      });
    }
  });
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
  // Per (interview, status) cool-down. A short-window single-bucket
  // gate is enough — first transition opens the window, any repeat
  // within ~5 min is dropped silently so the candidate / interviewers
  // aren't spammed when an interviewer flips the status back and forth.
  const gate = await rateLimit(
    `interview-status-email:${interviewId}:${newStatus}`,
    { limit: 1, windowMs: STATUS_EMAIL_COOLDOWN_MS }
  );
  if (!gate.ok) {
    console.warn('[interview-effect] suppressed status-email — within cool-down', {
      interviewId,
      newStatus,
    });
    return;
  }

  const interview = await getInterviewForEmails(interviewId);
  if (!interview) return;

  if (newStatus === InterviewStatus.COMPLETED) {
    const recipients = interview.interviewers
      .filter((i) => i.email)
      .map((interviewer) => () =>
        sendFeedbackReminderEmail({
          to: interviewer.email!,
          interviewerName: interviewer.name ?? '',
          candidateName: interview.candidate.name,
          interviewTitle: interview.title,
          interviewDateTime: interview.startTime,
          interviewId,
        })
      );
    await runWithConcurrency(recipients, EMAIL_FANOUT_CONCURRENCY);
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
    ].map((to) => () => sendInterviewScheduleEmail({ to, ...scheduleArgs }));
    await runWithConcurrency(recipients, EMAIL_FANOUT_CONCURRENCY);
  }
}

// Tiny p-limit replacement. Pulls one task at a time per worker;
// works for the 1-50 element ranges we see here without taking a dep.
async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number
): Promise<void> {
  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, async () => {
    while (tasks.length > 0) {
      const next = tasks.shift();
      if (!next) return;
      try {
        await next();
      } catch (error) {
        console.error('[interview-effect] recipient failed', error);
      }
    }
  });
  await Promise.all(workers);
}
