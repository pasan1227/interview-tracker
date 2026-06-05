// Report type contracts shared between client report components and
// the report server actions in actions/reports.ts. These are pure type
// declarations — no runtime, no Prisma imports, safe to pull into
// client bundles.

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  positionId?: string;
  source?: string;
  minInterviews?: number;
}

export interface CandidateStatusData {
  status: string;
  count: number;
}

export interface CandidateStatusReport {
  data: CandidateStatusData[];
  totalCandidates: number;
}

export interface SourceData {
  source: string;
  count: number;
}

export interface SourceReport {
  data: SourceData[];
  totalCandidates: number;
}

export interface PositionData {
  position: string;
  count: number;
}

export interface PositionReport {
  data: PositionData[];
  totalCandidates: number;
}

export interface PositionAverage {
  position: string;
  avgDays: number;
  count: number;
}

export interface TimeToHireReport {
  avgTimeToHire: number;
  positionAverages: PositionAverage[];
  totalHires: number;
}

export interface OutcomeData {
  recommendation: string;
  count: number;
}

export interface InterviewOutcomeReport {
  data: OutcomeData[];
  totalFeedback: number;
  totalInterviews: number;
  interviewsWithFeedback: number;
}

export interface MonthlyHireData {
  month: string;
  count: number;
}

export interface MonthlyHiresReport {
  data: MonthlyHireData[];
  totalHires: number;
}
