// apps/workers/src/index.ts
//
// Entry point for the BullMQ worker process. Boots observability
// first (so future imports get instrumented), then registers all
// queue workers, then starts the health server, then waits.
//
// Graceful shutdown order — workers MUST drain BEFORE we close Redis,
// otherwise in-flight jobs die mid-processing and BullMQ retries
// them on next start.

import {
  initNodeObservability,
  shutdownNodeObservability,
  baseLogger,
} from '@hiring-os/observability';
import { closeAllQueues, closeRedis } from '@hiring-os/queue';
import type { Worker } from 'bullmq';
import { startEmailOutWorker } from './queues/email-out';
import { startHealthServer } from './health';

const log = baseLogger.child({ component: 'workers' });

async function main() {
  initNodeObservability({
    serviceName: 'hiring-os-workers',
    release: process.env.RELEASE,
  });

  log.info('booting workers');

  const workers: Worker[] = [
    startEmailOutWorker(),
    // Phase 3+ — add as queues come online:
    // startResumeParseWorker(),
    // startEmbeddingsWorker(),
    // startMatchScoreWorker(),
    // startAssessmentGradeWorker(),
    // startAiInterviewWorker(),
    // startWebhookDeliveryWorker(),
  ];

  const port = Number(process.env.WORKER_PORT ?? 4002);
  const server = startHealthServer(port);

  const shutdown = async (signal: NodeJS.Signals) => {
    log.info({ signal }, 'shutting down');
    server.close();
    // Stop accepting new jobs; let in-flight ones complete.
    await Promise.all(workers.map((w) => w.close()));
    await closeAllQueues();
    await closeRedis();
    await shutdownNodeObservability();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  log.info(`workers booted (${workers.length} queues)`);
}

main().catch((err) => {
  baseLogger.fatal({ err }, 'worker boot failed');
  process.exit(1);
});
