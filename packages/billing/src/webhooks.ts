// packages/billing/src/webhooks.ts
//
// Stripe webhook signature verification + event handler skeleton.
// Phase 1 only verifies + acknowledges — actual subscription syncing
// lands in Phase 5 when we wire the plan SKUs and entitlements. Keep
// the route alive now so we don't drop events during the gap.
//
// CRITICAL: the raw request body MUST be passed in unchanged. Next.js
// route handlers use Request.text() — do NOT use Request.json() (it
// re-stringifies and breaks signature).

import type Stripe from 'stripe';
import { getStripe } from './client';

export type VerifyArgs = {
  rawBody: string;
  signature: string;
};

export function verifyWebhook(args: VerifyArgs): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('[hiring-os/billing] STRIPE_WEBHOOK_SECRET is required');
  }
  return getStripe().webhooks.constructEvent(
    args.rawBody,
    args.signature,
    secret
  );
}

// Phase 1 handler stub. Returns OK for every recognised event so
// Stripe stops retrying. Phase 5 implements:
//   * customer.subscription.created / updated / deleted → Subscription row
//   * invoice.paid / invoice.payment_failed → Subscription.status
//   * usage_record.created → reconcile UsageRecord.reportedToStripeAt
export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'customer.created':
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
    case 'invoice.paid':
    case 'invoice.payment_failed':
      // TODO(phase-5): sync Subscription + Entitlement rows.
      return;
    default:
      return;
  }
}
