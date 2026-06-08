// packages/queue/src/queue.ts
//
// Producer-side helpers. Anyone (server action, API handler, worker
// chaining) calls enqueue() — they never touch BullMQ directly.
//
// Two non-obvious behaviours:
//
// 1. PER-TENANT FAIRNESS GROUPS. BullMQ "groups" let one heavy
//    tenant occupy at most N concurrent workers — the rest stay free
//    for other tenants. We pass the organizationId as the group key
//    on every job. apps/workers configures per-group concurrency.
//
// 2. IDEMPOTENCY. Every job declares a stable `jobId` derived from
//    its payload. Re-enqueueing the same logical work is a no-op.
//    A caller that depends on idempotency MUST provide explicit
//    `idempotencyKey` in opts; otherwise the queue's own dedupe is
//    best-effort only.

import { Queue, type JobsOptions } from 'bullmq';
import { db } from '@hiring-os/db';
import { getRedis } from './redis';
import { QUEUE_NAMES, type QueueName } from './queues/index';

const queues = new Map<QueueName, Queue>();

function getQueue(name: QueueName): Queue {
  let q = queues.get(name);
  if (!q) {
    q = new Queue(name, {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 1500 },
        removeOnComplete: { age: 60 * 60 * 24, count: 1000 }, // 24h
        removeOnFail: { age: 60 * 60 * 24 * 7 }, // 7d
      },
    });
    queues.set(name, q);
  }
  return q;
}

export type EnqueueOptions = {
  // Stable dedupe key. Two enqueues with the same key skip a duplicate
  // job — caller is responsible for choosing a key that maps 1:1 to
  // the logical work.
  idempotencyKey?: string;
  // Delay execution. Useful for retries chained from outside BullMQ.
  delayMs?: number;
  // Override default priority (lower = higher).
  priority?: number;
  // Override default attempts for this job (rare).
  attempts?: number;
};

export async function enqueue<P extends { organizationId: string | null }>(
  queueName: QueueName,
  name: string,
  payload: P,
  opts: EnqueueOptions = {}
): Promise<{ jobId: string }> {
  const q = getQueue(queueName);
  const jobsOptions: JobsOptions = {
    jobId: opts.idempotencyKey,
    delay: opts.delayMs,
    priority: opts.priority,
    attempts: opts.attempts,
    // BullMQ groups — one queue slot per tenant. Falls back to a
    // 'platform' bucket for null-org jobs (cron, housekeeping).
    group: { id: payload.organizationId ?? 'platform' },
  };
  const job = await q.add(name, payload, jobsOptions);

  // Mirror into BackgroundJob for audit / cross-process visibility.
  // Best-effort: a failed insert here does NOT roll back the queue
  // insert (no XA across systems). Most cases the row exists; if it
  // doesn't, the worker still processes and inserts on completion.
  try {
    await db.backgroundJob.create({
      data: {
        organizationId: payload.organizationId,
        queue: queueName,
        name,
        externalId: job.id ?? null,
        payload: payload as never,
        status: 'QUEUED',
      },
    });
  } catch {
    // swallow — see comment above
  }

  return { jobId: job.id! };
}

// Convenience facades — type-safe per queue.
export async function enqueueEmail(
  payload: import('./queues/index.js').EmailOutJob,
  opts?: EnqueueOptions
) {
  return enqueue(QUEUE_NAMES.EMAIL_OUT, 'send', payload, opts);
}

export async function enqueueWebhookDelivery(
  payload: import('./queues/index.js').WebhookDeliveryJob,
  opts?: EnqueueOptions
) {
  return enqueue(QUEUE_NAMES.WEBHOOK_DELIVERY, 'deliver', payload, opts);
}

export async function closeAllQueues(): Promise<void> {
  await Promise.all([...queues.values()].map((q) => q.close()));
  queues.clear();
}
