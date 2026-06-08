// packages/queue/src/queues/index.ts
//
// Queue registry. Adding a new queue is three lines here plus a
// handler in apps/workers. The string keys are stable contract — they
// become Redis keys, BullMQ Bull Board labels, and BackgroundJob.queue
// column values. Don't rename casually.

export const QUEUE_NAMES = {
  EMAIL_OUT: 'email-out',
  // Phase 3+
  RESUME_PARSE: 'resume-parse',
  EMBEDDINGS: 'embeddings',
  MATCH_SCORE: 'match-score',
  // Phase 4
  ASSESSMENT_GRADE: 'assessment-grade',
  AI_INTERVIEW: 'ai-interview',
  // Phase 5
  USAGE_ROLLUP: 'usage-rollup',
  // Phase 6
  WEBHOOK_DELIVERY: 'webhook-delivery',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// Job payloads — discriminated by queue. Define ONE per queue here so
// producer and consumer share the contract via TypeScript.

export type EmailOutJob = {
  to: string;
  template:
    | 'verification'
    | 'password-reset'
    | 'two-factor'
    | 'interview-scheduled'
    | 'feedback-reminder'
    | 'invitation'
    | 'generic';
  // Free-form template-specific variables.
  variables: Record<string, unknown>;
  // Tenant — required for fairness routing + audit.
  organizationId: string | null;
};

export type ResumeParseJob = {
  organizationId: string;
  candidateId: string;
  resumeId: string;
  storageKey: string;
};

export type EmbeddingsJob = {
  organizationId: string;
  // Discriminated by `kind`.
  kind: 'candidate' | 'job';
  id: string;
};

export type MatchScoreJob = {
  organizationId: string;
  applicationId: string;
};

export type AssessmentGradeJob = {
  organizationId: string;
  submissionId: string;
};

export type AiInterviewJob = {
  organizationId: string;
  sessionId: string;
};

export type WebhookDeliveryJob = {
  organizationId: string;
  deliveryId: string;
};

// Union for the BackgroundJob audit row. Workers should narrow.
export type AnyJobPayload =
  | EmailOutJob
  | ResumeParseJob
  | EmbeddingsJob
  | MatchScoreJob
  | AssessmentGradeJob
  | AiInterviewJob
  | WebhookDeliveryJob;
