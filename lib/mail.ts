import { Resend } from 'resend';
import { env } from './env';
import { formatDateTime } from './utils';

const resend = new Resend(env.RESEND_API_KEY);

const domain = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${domain}/new-verification?token=${encodeURIComponent(token)}`;

  await resend.emails.send({
    from: env.EMAIL_FROM || 'Acme <onboarding@resend.dev>',
    to: email,
    subject: 'Confirm your email',
    html: `<p>Click <a href=${confirmLink}>here</a> to confirm email.</p>`,
  });
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${domain}/new-password?token=${encodeURIComponent(token)}`;

  await resend.emails.send({
    from: env.EMAIL_FROM || 'Acme <onboarding@resend.dev>',
    to: email,
    subject: 'Reset Your password',
    html: `<p>Click <a href=${resetLink}>here</a> to reset your password.</p>`,
  });
};

export const sendTwoFactorTokenEmail = async (email: string, token: string) => {
  await resend.emails.send({
    from: env.EMAIL_FROM || 'Acme <onboarding@resend.dev>',
    to: email,
    subject: '2FA Code',
    html: `<p>Your 2FA code: ${token}</p>`,
  });
};

/**
 * Sends an email notification for an interview schedule
 * Used when interviews are created or status changes to SCHEDULED
 */
export async function sendInterviewScheduleEmail({
  to,
  candidateName,
  interviewTitle,
  interviewDateTime,
  interviewerNames,
  location,
  notes,
  actionUrl = '',
}: {
  to: string;
  candidateName: string;
  interviewTitle: string;
  interviewDateTime: Date;
  interviewerNames: string[];
  location?: string;
  notes?: string;
  actionUrl?: string;
}) {
  const formattedDateTime = formatDateTime(interviewDateTime);
  const interviewers = interviewerNames.join(', ');
  const subject = `Interview Scheduled: ${interviewTitle} with ${candidateName}`;

  // If no actionUrl is provided, default to the dashboard
  const linkUrl =
    actionUrl ||
    `${env.NEXT_PUBLIC_APP_URL || 'https://yourapp.com'}/dashboard/interviews`;

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
      <h2 style="color: #333;">Interview Scheduled</h2>
      <p>An interview has been scheduled:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Title:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${interviewTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Candidate:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${candidateName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Date and Time:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formattedDateTime}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Interviewer(s):</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${interviewers}</td>
        </tr>
        ${
          location
            ? `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Location:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${location}</td>
        </tr>
        `
            : ''
        }
      </table>
      
      ${
        notes
          ? `
      <h3 style="color: #555; font-size: 16px;">Additional Notes:</h3>
      <p style="background-color: #f9f9f9; padding: 10px; border-radius: 4px;">${notes.replace(/\n/g, '<br>')}</p>
      `
          : ''
      }
      
      <div style="margin-top: 20px; text-align: center;">
        <a href="${linkUrl}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">View Details</a>
      </div>
      
      <div style="margin-top: 40px; color: #777; font-size: 12px;">
        <p>Best regards,<br>Interview Tracking System</p>
      </div>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM || 'Interview Tracking <no-reply@yourcompany.com>',
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error('Error sending interview schedule email:', error);
      return false;
    }

    console.log(`Schedule email sent to ${to}, ID: ${data?.id}`);
    return true;
  } catch (error) {
    console.error('Error sending interview schedule email:', error);
    return false;
  }
}

/**
 * Sends a reminder email to interviewers to submit feedback
 * Used when interview status changes to COMPLETED
 */
export async function sendFeedbackReminderEmail({
  to,
  interviewerName,
  candidateName,
  interviewTitle,
  interviewDateTime,
  interviewId = '',
}: {
  to: string;
  interviewerName: string;
  candidateName: string;
  interviewTitle: string;
  interviewDateTime: Date;
  interviewId?: string;
}) {
  const formattedDateTime = formatDateTime(interviewDateTime);
  const subject = `Feedback Reminder: ${interviewTitle} with ${candidateName}`;

  // Create a direct link to the feedback form if an ID is provided
  const feedbackLink = interviewId
    ? `${env.NEXT_PUBLIC_APP_URL || 'https://yourapp.com'}/dashboard/interviews/${interviewId}/feedback/new`
    : `${env.NEXT_PUBLIC_APP_URL || 'https://yourapp.com'}/dashboard/interviews`;

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
      <h2 style="color: #333;">Feedback Reminder</h2>
      <p>Hello ${interviewerName},</p>
      <p>This is a reminder to submit your feedback for the recent interview:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Title:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${interviewTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Candidate:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${candidateName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Date and Time:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formattedDateTime}</td>
        </tr>
      </table>
      
      <div style="margin-top: 20px; text-align: center;">
        <a href="${feedbackLink}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Submit Feedback</a>
      </div>
      
      <div style="margin-top: 40px; color: #777; font-size: 12px;">
        <p>Best regards,<br>Interview Tracking System</p>
      </div>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM || 'Interview Tracking <no-reply@yourcompany.com>',
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error('Error sending feedback reminder email:', error);
      return false;
    }

    console.log(`Feedback reminder email sent to ${to}, ID: ${data?.id}`);
    return true;
  } catch (error) {
    console.error('Error sending feedback reminder email:', error);
    return false;
  }
}

/**
 * Sends notification emails when a new interview is created
 * @param interview The interview data with related entities
 */
export async function sendNewInterviewNotifications(interview: any) {
  try {
    const interviewerNames = interview.interviewers.map((interviewer: any) =>
      `${interviewer.firstName} ${interviewer.lastName}`.trim()
    );

    const candidateName =
      `${interview.candidate.firstName} ${interview.candidate.lastName}`.trim();
    const detailUrl = `${env.NEXT_PUBLIC_APP_URL || 'https://yourapp.com'}/dashboard/interviews/${interview.id}`;

    // Send to each interviewer
    for (const interviewer of interview.interviewers) {
      if (interviewer.email) {
        await sendInterviewScheduleEmail({
          to: interviewer.email,
          candidateName,
          interviewTitle: interview.title,
          interviewDateTime: interview.startTime,
          interviewerNames,
          location: interview.location || undefined,
          notes: interview.notes || undefined,
          actionUrl: detailUrl,
        });
      }
    }

    // Send to candidate if they have an email
    if (interview.candidate.email) {
      await sendInterviewScheduleEmail({
        to: interview.candidate.email,
        candidateName,
        interviewTitle: interview.title,
        interviewDateTime: interview.startTime,
        interviewerNames,
        location: interview.location || undefined,
        notes: interview.notes || undefined,
        actionUrl: detailUrl,
      });
    }

    return true;
  } catch (error) {
    console.error('Error sending new interview notifications:', error);
    return false;
  }
}
