export type JobStatus = 'pending' | 'running' | 'completed' | 'success' | 'failed' | 'error' | 'stopped';

export interface StepLog {
  id: string;
  name: string;
  blockId?: string;
  type: 'success' | 'error' | 'info' | 'warn';
  duration?: number;
  timestamp?: number;
  message?: string;
  description?: string;
  [key: string]: unknown;
}

export interface JobExecutionOptions {
  browserId?: string;
  headless?: boolean;
  closeBrowserOnFinish?: boolean;
  variables?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface Job {
  id: string;
  workflowId: string;
  name?: string;
  status: JobStatus;
  startedAt: number;
  endedAt?: number;
  duration?: number;
  options?: JobExecutionOptions;
  logs?: StepLog[];
  results?: {
    table?: unknown[];
    variables?: Record<string, unknown>;
  };
  errorMessage?: string;
}
