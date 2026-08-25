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
