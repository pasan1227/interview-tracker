// packages/billing/src/client.ts
//
// Stripe SDK singleton. The secret key is required even in dev — set
// it to a Stripe TEST mode key. The package fails loudly if absent so
// the dev who ran `yarn dev` for the first time isn't silently doing
// nothing on customer creation.

import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      '[hiring-os/billing] STRIPE_SECRET_KEY is required. Use a Stripe TEST key in dev.'
    );
  }
  _stripe = new Stripe(key, {
    // No explicit apiVersion — the SDK uses the account's pinned
    // version (set in the Stripe dashboard → Developers → API version).
    // Pinning here would override the account's version and silently
    // break when Stripe rolls a new one. Phase 5 will revisit this
    // when we wire actual subscription syncing.
    appInfo: {
      name: 'Hiring OS',
      version: '0.1.0',
    },
    telemetry: false,
  });
  return _stripe;
}
