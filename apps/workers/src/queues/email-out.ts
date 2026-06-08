// apps/workers/src/queues/email-out.ts
//
// Reference worker for the EMAIL_OUT queue. Every queue worker lives
// in its own file and self-registers from src/index.ts. This pattern
// keeps Phase 3+ additions (resume-parse, embeddings, etc.) ergonomic
// — one file per queue, predictable shape.

import { registerWorker, QUEUE_NAMES, type EmailOutJob } from '@hiring-os/queue';
import { send } from '@hiring-os/email';
import { tenantLogger } from '@hiring-os/observability';

export function startEmailOutWorker() {
  return registerWorker<EmailOutJob, void>(
    QUEUE_NAMES.EMAIL_OUT,
    async (payload, { jobId }) => {
      const log = tenantLogger({
        organizationId: payload.organizationId,
        requestId: jobId,
      });
      log.info({ template: payload.template }, 'sending email');

      // Phase 1 just routes to Resend with a generic template
      // wrapper. The pretty templates currently live in
      // apps/web/lib/mail.ts; they'll move into packages/email in a
      // Phase 1 follow-up so this worker can render them too. For now
      // the worker is best-suited to the `generic` kind — direct
      // password-reset / 2FA still ship via the Next route layer
      // synchronously since they're on the critical path.
      const html =
        typeof payload.variables.html === 'string'
          ? (payload.variables.html as string)
          : `<p>Hiring OS notification: ${payload.template}</p>`;
      const subject =
        typeof payload.variables.subject === 'string'
          ? (payload.variables.subject as string)
          : 'Notification from Hiring OS';

      await send({
        to: payload.to,
        subject,
        html,
      });
      log.info('email sent');
    },
    { groupConcurrency: 4, concurrency: 16 }
  );
}
