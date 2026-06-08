// packages/email/src/index.ts
//
// Thin Resend wrapper used by the EMAIL_OUT worker (and direct callers
// when a sync send is fine — e.g. password reset). Templates stay in
// apps/web/lib/mail.ts for now; this package owns the transport.

import { Resend } from 'resend';

let _resend: Resend | null = null;

function getResend(): Resend {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('[hiring-os/email] RESEND_API_KEY is required');
  _resend = new Resend(key);
  return _resend;
}

export type SendArgs = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
};

export async function send(args: SendArgs): Promise<{ id: string }> {
  const result = await getResend().emails.send({
    from: args.from ?? process.env.EMAIL_FROM ?? 'Hiring OS <no-reply@hiring.os>',
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
  });
  if (result.error) {
    throw new Error(`[hiring-os/email] send failed: ${result.error.message}`);
  }
  return { id: result.data?.id ?? '' };
}
