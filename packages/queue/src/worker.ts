// packages/queue/src/worker.ts
//
// Worker-side helper. Workers register themselves with registerWorker()
// — that wires up BullMQ, per-tenant concurrency, BackgroundJob status
// updates, and observability.
//
// Lifecycle of a job from this layer's POV:
//
//   QUEUED ──► RUNNING ──► SUCCEEDED        (on completion)
//                       └► FAILED            (attempts < limit, will retry)
//                       └► DEAD              (attempts exhausted)
//
// The BackgroundJob row is updated optimistically — if Redis loses the
// job (rare; usually OOM), the row sits at RUNNING. apps/workers ships
// a sweeper that flips orphans back to QUEUED after 15 minutes.

import { Worker, type Processor } from 'bullmq';
import { db } from '@hiring-os/db';
import { getRedis } from './redis';
import type { QueueName } from './queues/index';

export type WorkerOptions = {
  // Per-tenant concurrency cap. Default 4 ensures one tenant can't
  // monopolise the worker process.
  groupConcurrency?: number;
  // Process-wide concurrency cap. Default 16. A worker process with
  // higher CPU/RAM can raise this from env.
  concurrency?: number;
};

export function registerWorker<P extends { organizationId: string | null }, R>(
  queueName: QueueName,
  processor: (
    payload: P,
    ctx: { jobId: string; attempt: number }
  ) => Promise<R>,
  opts: WorkerOptions = {}
): Worker {
  const inner: Processor = async (job) => {
    const externalId = job.id!;
    const payload = job.data as P;

    // Optimistic RUNNING. Best-effort — if the row's missing (rare),
    // we just don't write status updates.
    await db.backgroundJob
      .updateMany({
        where: { externalId },
        data: { status: 'RUNNING', startedAt: new Date(), attempts: job.attemptsMade },
      })
      .catch(() => {});

    try {
      const result = await processor(payload, {
        jobId: externalId,
        attempt: job.attemptsMade + 1,
      });
      await db.backgroundJob
        .updateMany({
          where: { externalId },
          data: { status: 'SUCCEEDED', finishedAt: new Date() },
        })
        .catch(() => {});
      return result;
    } catch (err) {
      const isLast = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
      await db.backgroundJob
        .updateMany({
          where: { externalId },
          data: {
            status: isLast ? 'DEAD' : 'FAILED',
            finishedAt: isLast ? new Date() : null,
            error: err instanceof Error ? err.message : String(err),
            attempts: job.attemptsMade + 1,
          },
        })
        .catch(() => {});
      throw err;
    }
  };

  const worker = new Worker(queueName, inner, {
    connection: getRedis(),
    concurrency: opts.concurrency ?? 16,
    group: { concurrency: opts.groupConcurrency ?? 4 },
  });

  worker.on('failed', (job, err) => {
    console.error(`[worker:${queueName}] job ${job?.id} failed:`, err.message);
  });

  return worker;
}
