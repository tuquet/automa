export interface CampaignSchedule {
  cron: string;
  enabled: boolean;
  timezone?: string;
}

export interface CampaignWorkflowRef {
  id: string;
  name?: string;
  path?: string;
  order?: number;
  parameters?: Record<string, unknown>;
}

export interface CampaignBrowserRef {
  id: string;
  profileId?: string;
  name?: string;
}

export interface CampaignMatrix {
  workflowIds: string[];
  browserIds: string[];
  matrixStatus?: Record<string, 'pending' | 'running' | 'success' | 'failed' | 'skipped'>;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  version?: string;
  schedule?: CampaignSchedule;
  workflows?: CampaignWorkflowRef[];
  browsers?: CampaignBrowserRef[];
  matrix?: CampaignMatrix;
  createdAt?: number;
  updatedAt?: number;
}

export interface CampaignSummary {
  name: string;
  version: string;
  description: string;
  fsPath: string;
  fileName: string;
  browsersCount: number;
  membersCount?: number;
  cron?: string;
  cronEnabled?: boolean;
  nextRun?: string;
  concurrencyMode: string;
}

export interface DashboardMetrics {
  totalCampaigns: number;
  totalRuns: number;
  successRate: string;
  activeRuns: number;
}

export interface CronJobItem {
  id: string;
  campaignPath: string;
  campaignName: string;
  cronExpr: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}
