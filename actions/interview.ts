'use server';

import { auth } from '@/auth';
import {
  createInterview as createInterviewData,
  deleteInterview as deleteInterviewData,
  getInterviewById,
  updateInterview as updateInterviewData,
} from '@/data/interview';
import { InterviewStatus } from '@/lib/generated/prisma/browser';
import {
  sendFeedbackReminderEmail,
  sendInterviewScheduleEmail,
  sendNewInterviewNotifications,
} from '@/lib/mail';
import { revalidatePath } from 'next/cache';

export async function createInterview(data: any) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Format dates if they are provided as strings
  if (typeof data.startTime === 'string') {
    data.startTime = new Date(data.startTime);
  }

  if (typeof data.endTime === 'string') {
    data.endTime = new Date(data.endTime);
  }

  // Add creator info
  const interviewData = {
    ...data,
    createdById: session.user.id,
    interviewers: {
      connect: data.interviewerIds?.map((id: string) => ({ id })) || [
        { id: session.user.id },
      ],
    },
  };

  // Remove interviewerIds as we've processed it
  delete interviewData.interviewerIds;

  const interview = await createInterviewData(interviewData);

  // Fetch the complete interview with related data for emails
  const completeInterview = await getInterviewById(interview.id);

  // Send email notifications if we have the complete data
  if (completeInterview) {
    await sendNewInterviewNotifications(completeInterview);
  }

  revalidatePath('/dashboard/interviews');
  revalidatePath(`/dashboard/candidates/${data.candidateId}`);
  return interview;
}

export async function updateInterview(id: string, data: any) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Get the current interview to check for status changes
  const currentInterview = await getInterviewById(id);

  if (!currentInterview) {
    throw new Error('Interview not found');
  }

  // Format dates if they are provided as strings
  if (typeof data.startTime === 'string') {
    data.startTime = new Date(data.startTime);
  }

  if (typeof data.endTime === 'string') {
    data.endTime = new Date(data.endTime);
  }

  // Process interviewers if provided
  const updateData: any = { ...data };

  if (data.interviewerIds) {
    updateData.interviewers = {
      set: data.interviewerIds.map((id: string) => ({ id })),
    };
    delete updateData.interviewerIds;
  }

  const interview = await updateInterviewData(id, updateData);

  // Check if the status changed
  const statusChanged = data.status && data.status !== currentInterview.status;

  // If status changed, handle email notifications
  if (statusChanged) {
    await handleStatusChangeEmails(id, data.status, currentInterview);
  }

  revalidatePath(`/dashboard/interviews/${id}`);
  revalidatePath('/dashboard/interviews');
  if (interview.candidateId) {
    revalidatePath(`/dashboard/candidates/${interview.candidateId}`);
  }
  return interview;
}

export async function deleteInterview(id: string, candidateId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  await deleteInterviewData(id);

  revalidatePath('/dashboard/interviews');
  revalidatePath(`/dashboard/candidates/${candidateId}`);
  return true;
}

export async function updateInterviewStatus(id: string, status: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Get the current interview before updating
  const currentInterview = await getInterviewById(id);

  if (!currentInterview) {
    throw new Error('Interview not found');
  }

  const interview = await updateInterviewData(id, { status });

  // Handle email notifications based on new status
  await handleStatusChangeEmails(id, status, currentInterview);

  revalidatePath(`/dashboard/interviews/${id}`);
  revalidatePath('/dashboard/interviews');
  if (interview.candidateId) {
    revalidatePath(`/dashboard/candidates/${interview.candidateId}`);
  }
  return interview;
}

/**
 * Helper function to handle email notifications when status changes
 */
async function handleStatusChangeEmails(
  interviewId: string,
  newStatus: string,
  currentInterview: any
) {
  try {
    // If status is changed to COMPLETED, send feedback reminders
    if (newStatus === InterviewStatus.COMPLETED) {
      // Send feedback reminder emails to all interviewers
      for (const interviewer of currentInterview.interviewers) {
        if (interviewer.email) {
          await sendFeedbackReminderEmail({
            to: interviewer.email,
            interviewerName:
              `${interviewer.firstName} ${interviewer.lastName}`.trim(),
            candidateName:
              `${currentInterview.candidate.firstName} ${currentInterview.candidate.lastName}`.trim(),
            interviewTitle: currentInterview.title,
            interviewDateTime: currentInterview.startTime,
            interviewId: interviewId,
          });
        }
      }
    }
    // If status is changed to SCHEDULED (e.g. from CANCELED back to SCHEDULED)
    else if (newStatus === InterviewStatus.SCHEDULED) {
      const interviewerNames = currentInterview.interviewers.map(
        (interviewer: any) =>
          `${interviewer.firstName} ${interviewer.lastName}`.trim()
      );

      // Send scheduling emails to interviewers and candidate
      for (const interviewer of currentInterview.interviewers) {
        if (interviewer.email) {
          await sendInterviewScheduleEmail({
            to: interviewer.email,
            candidateName:
              `${currentInterview.candidate.firstName} ${currentInterview.candidate.lastName}`.trim(),
            interviewTitle: currentInterview.title,
            interviewDateTime: currentInterview.startTime,
            interviewerNames,
            location: currentInterview.location || undefined,
            notes: currentInterview.notes || undefined,
          });
        }
      }

      // Send to candidate if they have an email
      if (currentInterview.candidate.email) {
        await sendInterviewScheduleEmail({
          to: currentInterview.candidate.email,
          candidateName:
            `${currentInterview.candidate.firstName} ${currentInterview.candidate.lastName}`.trim(),
          interviewTitle: currentInterview.title,
          interviewDateTime: currentInterview.startTime,
          interviewerNames,
          location: currentInterview.location || undefined,
          notes: currentInterview.notes || undefined,
        });
      }
    }
  } catch (error) {
    console.error('Error sending status change emails:', error);
    // Don't throw the error - we don't want to fail the status update if emails fail
  }
}

/**
 * Server action for marking an interview as completed via form submission
 */
export async function markInterviewAsCompleted(formData: FormData) {
  const interviewId = formData.get('interviewId') as string;

  if (!interviewId) {
    throw new Error('Interview ID is required');
  }

  await updateInterviewStatus(interviewId, InterviewStatus.COMPLETED);

  return { success: true };
}

/**
 * Server action for marking an interview as canceled via form submission
 */
export async function markInterviewAsCanceled(formData: FormData) {
  const interviewId = formData.get('interviewId') as string;

  if (!interviewId) {
    throw new Error('Interview ID is required');
  }

  await updateInterviewStatus(interviewId, InterviewStatus.CANCELED);

  return { success: true };
}

/**
 * Server action for marking an interview as no-show via form submission
 */
export async function markInterviewAsNoShow(formData: FormData) {
  const interviewId = formData.get('interviewId') as string;

  if (!interviewId) {
    throw new Error('Interview ID is required');
  }

  await updateInterviewStatus(interviewId, InterviewStatus.NO_SHOW);

  return { success: true };
}
