import { Resend } from 'resend';
import { env } from './env';
import { formatDateTime } from './utils';

const resend = new Resend(env.RESEND_API_KEY);

const domain = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ---------- HTML safety ----------
//
// Email bodies are built by string interpolation, so any candidate name,
// interview title, location, etc. that ends up in an email is an HTML
// injection vector unless escaped. Templates use the `html` tagged literal
// below; it escapes every interpolation. Use `raw()` for fragments that
// have already been escaped (e.g. notes after \n -> <br> conversion).

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

class Raw {
  constructor(public readonly value: string) {}
}
const raw = (value: string) => new Raw(value);

function html(strings: TemplateStringsArray, ...values: unknown[]): string {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    out += (v instanceof Raw ? v.value : escapeHtml(v)) + strings[i + 1];
  }
  return out;
}

// Email Subject is a header field — bare CRLFs let an attacker append
// extra headers (Bcc:, Cc:, etc.). Collapse any newline runs to a space.
const headerSafe = (value: string) => value.replace(/[\r\n]+/g, ' ');

// In production every email must come from a domain we control. Falling back
// to the shared `onboarding@resend.dev` lands real production mail in spam
// and prevents DMARC alignment. In development we still allow the fallback
// so contributors can run the app without setting up Resend.
function fromAddress(): string {
  if (env.EMAIL_FROM) return env.EMAIL_FROM;
  if (env.NODE_ENV === 'production') {
    throw new Error('EMAIL_FROM env var is required in production.');
  }
  return 'Acme <onboarding@resend.dev>';
}

// ---------- Senders ----------

export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${domain}/new-verification?token=${encodeURIComponent(token)}`;
  await resend.emails.send({
    from: fromAddress(),
    to: email,
    subject: 'Confirm your email',
    html: html`<p>Click <a href="${confirmLink}">here</a> to confirm email.</p>`,
  });
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${domain}/new-password?token=${encodeURIComponent(token)}`;
  await resend.emails.send({
    from: fromAddress(),
    to: email,
    subject: 'Reset Your password',
    html: html`<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
  });
};

export const sendTwoFactorTokenEmail = async (email: string, token: string) => {
  await resend.emails.send({
    from: fromAddress(),
    to: email,
    subject: '2FA Code',
    html: html`<p>Your 2FA code: ${token}</p>`,
  });
};

export const sendInvitationEmail = async ({
  email,
  token,
  orgName,
  inviterName,
  role,
}: {
  email: string;
  token: string;
  orgName: string;
  inviterName: string;
  role: string;
}) => {
  const acceptLink = `${domain}/invitations/accept?token=${encodeURIComponent(token)}`;
  await resend.emails.send({
    from: fromAddress(),
    to: email,
    subject: headerSafe(`[${orgName}] You've been invited to InterviewPro`),
    html: html`
      <div style="font-family: Arial, sans-serif; max-width: 520px; padding: 24px;">
        <h2 style="margin: 0 0 12px;">You're invited to ${orgName}</h2>
        <p style="margin: 0 0 8px;">
          ${inviterName} invited you to join <strong>${orgName}</strong>
          on InterviewPro as <strong>${role.toLowerCase()}</strong>.
        </p>
        <p style="margin: 16px 0;">
          <a
            href="${acceptLink}"
            style="background:#1f2937;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;"
          >Accept invitation</a>
        </p>
        <p style="margin: 0; font-size: 12px; color:#6b7280;">
          This invitation expires in 7 days. If you weren't expecting
          this, you can safely ignore the email.
        </p>
      </div>
    `,
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
  orgName,
}: {
  to: string;
  candidateName: string;
  interviewTitle: string;
  interviewDateTime: Date;
  interviewerNames: string[];
  location?: string;
  notes?: string;
  actionUrl?: string;
  orgName?: string;
}) {
  const formattedDateTime = formatDateTime(interviewDateTime);
  const interviewers = interviewerNames.join(', ');
  // Multi-tenant subject prefix so a user who belongs to several orgs
  // can tell which one a notification came from. Skipped silently when
  // not provided (call sites that haven't been migrated to PR 8).
  const prefix = orgName ? `[${orgName}] ` : '';
  const subject = headerSafe(
    `${prefix}Interview Scheduled: ${interviewTitle} with ${candidateName}`
  );

  const linkUrl =
    actionUrl ||
    `${env.NEXT_PUBLIC_APP_URL || 'https://yourapp.com'}/interviews`;

  // notes preserves user line breaks via <br>. Escape first, then convert
  // newlines, then mark the result raw so the html tag doesn't re-escape it.
  const notesHtml = notes
    ? raw(escapeHtml(notes).replace(/\n/g, '<br>'))
    : null;

  const body = html`
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
            ? raw(html`
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Location:</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${location}</td>
        </tr>
        `)
            : ''
        }
      </table>

      ${
        notesHtml
          ? raw(html`
      <h3 style="color: #555; font-size: 16px;">Additional Notes:</h3>
      <p style="background-color: #f9f9f9; padding: 10px; border-radius: 4px;">${notesHtml}</p>
      `)
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
      from: fromAddress(),
      to: [to],
      subject,
      html: body,
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
  orgName,
}: {
  to: string;
  interviewerName: string;
  candidateName: string;
  interviewTitle: string;
  interviewDateTime: Date;
  interviewId?: string;
  orgName?: string;
}) {
  const formattedDateTime = formatDateTime(interviewDateTime);
  const prefix = orgName ? `[${orgName}] ` : '';
  const subject = headerSafe(
    `${prefix}Feedback Reminder: ${interviewTitle} with ${candidateName}`
  );

  const feedbackLink = interviewId
    ? `${env.NEXT_PUBLIC_APP_URL || 'https://yourapp.com'}/interviews/${interviewId}/feedback/new`
    : `${env.NEXT_PUBLIC_APP_URL || 'https://yourapp.com'}/interviews`;

  const body = html`
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
      from: fromAddress(),
      to: [to],
      subject,
      html: body,
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

interface InterviewForNotification {
  id: string;
  title: string;
  startTime: Date;
  location: string | null;
  notes: string | null;
  candidate: { name: string; email: string };
  interviewers: { name: string | null; email: string | null }[];
  // Organization fan-out adds the [Acme] subject-line prefix so users
  // in multiple orgs can tell where a notification came from. Optional
  // for compatibility with call sites that haven't been migrated yet.
  organization?: { name: string } | null;
}

/**
 * Sends notification emails when a new interview is created.
 *
 * The previous implementation read `interviewer.firstName` / `lastName`
 * and `candidate.firstName` / `lastName` — but the Prisma schema only
 * carries a single `name` field on User and Candidate. So every
 * notification this function sent contained the literal string
 * "undefined undefined" in place of every name. Fixed; sends in
 * parallel; both emails go out even if one interviewer doesn't have
 * an address.
 */
export async function sendNewInterviewNotifications(
  interview: InterviewForNotification
) {
  try {
    const interviewerNames = interview.interviewers
      .map((i) => i.name?.trim())
      .filter((n): n is string => Boolean(n));
    const candidateName = interview.candidate.name;
    const detailUrl = `${env.NEXT_PUBLIC_APP_URL || 'https://yourapp.com'}/interviews/${interview.id}`;

    const sharedArgs = {
      candidateName,
      interviewTitle: interview.title,
      interviewDateTime: interview.startTime,
      interviewerNames,
      location: interview.location ?? undefined,
      notes: interview.notes ?? undefined,
      actionUrl: detailUrl,
      orgName: interview.organization?.name,
    };

    const recipients: string[] = [
      ...interview.interviewers
        .map((i) => i.email)
        .filter((email): email is string => Boolean(email)),
      ...(interview.candidate.email ? [interview.candidate.email] : []),
    ];

    await Promise.all(
      recipients.map((to) =>
        sendInterviewScheduleEmail({ ...sharedArgs, to })
      )
    );

    return true;
  } catch (error) {
    console.error('Error sending new interview notifications:', error);
    return false;
  }
}
