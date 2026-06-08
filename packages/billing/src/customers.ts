// packages/billing/src/customers.ts
//
// ensureCustomer(org) — get or create the Stripe Customer for an org.
// Idempotent: if Organization.stripeCustomerId is set, return that
// customer; otherwise create a new one and persist.
//
// Called automatically by the Organization.create hook (see
// withStripeCustomer below) and from the billing portal action when
// the user clicks "Manage billing" for the first time.

import { db } from '@hiring-os/db';
import { writeAudit, AUDIT_ACTIONS } from '@hiring-os/audit';
import { getStripe } from './client';

export type OrgForCustomer = {
  id: string;
  name: string;
  billingEmail: string;
  stripeCustomerId: string | null;
};

export async function ensureCustomer(
  org: OrgForCustomer
): Promise<{ stripeCustomerId: string }> {
  if (org.stripeCustomerId) {
    return { stripeCustomerId: org.stripeCustomerId };
  }
  const stripe = getStripe();
  const customer = await stripe.customers.create({
    name: org.name,
    email: org.billingEmail,
    metadata: {
      organizationId: org.id,
    },
  });

  await db.organization.update({
    where: { id: org.id },
    data: { stripeCustomerId: customer.id },
  });

  await writeAudit(
    { organizationId: org.id, actor: { kind: 'system' } },
    {
      action: AUDIT_ACTIONS.SUBSCRIPTION_CREATED,
      targetType: 'Organization',
      targetId: org.id,
      diff: { stripeCustomerId: { from: null, to: customer.id } },
    }
  );

  return { stripeCustomerId: customer.id };
}

// Convenience: pass an orgId, the function loads + ensures.
export async function ensureCustomerById(
  orgId: string
): Promise<{ stripeCustomerId: string }> {
  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: {
      id: true,
      name: true,
      billingEmail: true,
      stripeCustomerId: true,
    },
  });
  if (!org) throw new Error(`ensureCustomerById: org ${orgId} not found`);
  return ensureCustomer(org);
}
