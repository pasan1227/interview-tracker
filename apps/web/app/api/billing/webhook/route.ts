// apps/web/app/api/billing/webhook/route.ts
//
// POST /api/billing/webhook
//
// Stripe webhook endpoint. We MUST read the raw body (not parse JSON)
// because Stripe signature verification hashes the exact bytes.
// `runtime = 'nodejs'` keeps this off the edge runtime where stripe's
// crypto path can fail.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { handleWebhookEvent, verifyWebhook } from '@hiring-os/billing';

export async function POST(req: Request) {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }
  let event;
  try {
    const rawBody = await req.text();
    event = verifyWebhook({ rawBody, signature });
  } catch (err) {
    console.error('[stripe-webhook] signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
  try {
    await handleWebhookEvent(event);
  } catch (err) {
    // Return 500 — Stripe will retry. Don't ACK on failure.
    console.error('[stripe-webhook] handler failed:', err);
    return NextResponse.json({ error: 'Handler error' }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
