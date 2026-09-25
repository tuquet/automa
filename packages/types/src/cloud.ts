/**
 * Canonical Cloud Sync & Supabase Contract Types
 * Defines data structures and synchronization interfaces bridging
 * tuquet-automa (local client/daemon) with tuquet-cloud (Supabase BaaS hub).
 */

import type { Workflow, WorkflowNode, WorkflowEdge, WorkflowSettings } from './workflow.js';

export type CloudWorkflowStatus = 'draft' | 'published' | 'archived';

export type CloudRunnerStatus = 'offline' | 'idle' | 'running' | 'busy' | 'disconnected' | 'maintenance';

export type CloudCampaignStatus = 'pending' | 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

export type CloudLogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Cloud Workflow Entity stored in Supabase automa.workflows
 */
export interface CloudWorkflow {
  id: string;
  tenant_id: string;
  name: string;
  description?: string | null;
  version: string;
  status: CloudWorkflowStatus;
  graph_data: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };
  variables: Record<string, unknown>;
  settings: WorkflowSettings;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

/**
 * Cloud Runner Node Entity stored in Supabase automa.runners
 */
export interface CloudRunner {
  id: string;
  tenant_id: string;
  name: string;
  machine_fingerprint: string;
  status: CloudRunnerStatus;
  version: string;
  os_info?: string | null;
  ip_address?: string | null;
  max_concurrency: number;
  active_tasks: number;
  capabilities: string[];
  last_heartbeat_at?: string | null;
  registered_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

/**
 * Cloud Campaign Run Entity stored in Supabase automa.campaign_runs
 */
export interface CloudCampaignRun {
  id: string;
  tenant_id: string;
  workflow_id?: string | null;
  runner_id?: string | null;
  name: string;
  status: CloudCampaignStatus;
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  parameters?: Record<string, unknown>;
  result_summary?: Record<string, unknown>;
  error_message?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  triggered_by?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Cloud Telemetry Log Entity stored in Supabase automa.execution_logs
 */
export interface CloudExecutionLog {
  id: number;
  tenant_id: string;
  campaign_run_id: string;
  node_id?: string | null;
  step_name?: string | null;
  level: CloudLogLevel;
  message: string;
  payload?: Record<string, unknown>;
  logged_at: string;
}

/**
 * Cloud Schedule Entity stored in Supabase automa.schedules
 */
export interface CloudSchedule {
  id: string;
  tenant_id: string;
  workflow_id: string;
  name: string;
  cron_expression: string;
  timezone: string;
  is_active: boolean;
  last_run_at?: string | null;
  next_run_at?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Client-side Cloud Sync Configuration
 */
export interface CloudSyncConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  tenantId: string;
  accessToken?: string;
  autoSyncWorkflows?: boolean;
  heartbeatIntervalSeconds?: number;
}

/**
 * Generic Sync Operation Result
 */
export interface SyncResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Helper to convert a local Workflow into a CloudWorkflow payload
 */
export function toCloudWorkflowPayload(
  local: Workflow,
  tenantId: string,
  userId?: string,
  status: CloudWorkflowStatus = 'draft'
): Omit<CloudWorkflow, 'created_at' | 'updated_at'> {
  const nodes = local.nodes || local.drawflow?.nodes || [];
  const edges = local.edges || local.drawflow?.edges || [];
  const variables = (Array.isArray(local.variables)
    ? Object.fromEntries(local.variables.map(v => [v.name, v.value]))
    : local.variables) || {};

  return {
    id: local.id,
    tenant_id: tenantId,
    name: local.name,
    description: local.description,
    version: local.version || '1.0.0',
    status,
    graph_data: { nodes, edges },
    variables,
    settings: local.settings || {},
    created_by: userId,
  };
}

/**
 * Helper to convert a CloudWorkflow entity into a local Workflow
 */
export function fromCloudWorkflow(cloud: CloudWorkflow): Workflow {
  return {
    id: cloud.id,
    name: cloud.name,
    description: cloud.description || undefined,
    version: cloud.version,
    nodes: cloud.graph_data?.nodes || [],
    edges: cloud.graph_data?.edges || [],
    variables: cloud.variables || {},
    settings: cloud.settings || {},
    createdAt: new Date(cloud.created_at).getTime(),
    updatedAt: new Date(cloud.updated_at).getTime(),
  };
}
