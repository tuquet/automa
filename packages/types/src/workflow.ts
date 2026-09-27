import type { AutomaBlockNode } from './blocks/index.js';

export interface WorkflowVariable {
  name: string;
  value: unknown;
  type?: 'string' | 'number' | 'boolean' | 'json' | 'secret';
}

export interface WorkflowTableColumn {
  id: string;
  name: string;
  type: string;
}

export interface WorkflowNodeData {
  description?: string;
  label?: string;
  [key: string]: unknown;
}

export interface WorkflowNode {
  id: string;
  label: string;
  type?: string;
  data: WorkflowNodeData;
  position?: {
    x: number;
    y: number;
  };
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface WorkflowSettings {
  debugMode?: boolean;
  restartOnError?: boolean;
  notification?: boolean;
  reuseLastState?: boolean;
  execContext?: string;
  events?: Array<{
    action: string;
    events: string[];
  }>;
  [key: string]: unknown;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  version?: string;
  drawflow?: {
    nodes: Array<WorkflowNode | AutomaBlockNode>;
    edges: WorkflowEdge[];
  };
  nodes?: Array<WorkflowNode | AutomaBlockNode>;
  edges?: WorkflowEdge[];
  table?: WorkflowTableColumn[];
  variables?: Record<string, unknown> | WorkflowVariable[];
  settings?: WorkflowSettings;
  createdAt?: number;
  updatedAt?: number;
  isTesting?: boolean;
}

export interface DefineWorkflowOptions {
  name: string;
  description?: string;
  icon?: string;
  nodes: Array<AutomaBlockNode | WorkflowNode>;
  edges?: WorkflowEdge[];
  variables?: Record<string, unknown>;
  settings?: WorkflowSettings;
}

export function defineWorkflow(options: DefineWorkflowOptions): Workflow {
  return {
    id: `wf-${Math.random().toString(36).substring(2, 9)}`,
    name: options.name,
    description: options.description || '',
    icon: options.icon || 'ri-global-line',
    drawflow: {
      nodes: options.nodes,
      edges: options.edges || [],
    },
    variables: options.variables || {},
    settings: options.settings || { debugMode: false },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export type { TriggerParameter } from './blocks/index.js';

export interface WorkflowUpdatePayload
  extends Omit<Partial<Workflow>, 'table' | 'settings'> {
  triggerParams?: Record<string, unknown>;
  extVersion?: string;
  globalData?: unknown;
  includedWorkflows?: unknown;
  settings?: unknown;
  table?: unknown;
}
