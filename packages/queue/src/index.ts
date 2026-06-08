// packages/queue/src/index.ts

export { getRedis, closeRedis } from './redis';
export {
  enqueue,
  enqueueEmail,
  enqueueWebhookDelivery,
  closeAllQueues,
} from './queue';
export { registerWorker } from './worker';
export { QUEUE_NAMES } from './queues/index';
export type {
  QueueName,
  EmailOutJob,
  ResumeParseJob,
  EmbeddingsJob,
  MatchScoreJob,
  AssessmentGradeJob,
  AiInterviewJob,
  WebhookDeliveryJob,
  AnyJobPayload,
} from './queues/index';
export type { EnqueueOptions } from './queue';
export type { WorkerOptions } from './worker';
