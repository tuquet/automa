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
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
  table?: WorkflowTableColumn[];
  variables?: Record<string, unknown> | WorkflowVariable[];
  settings?: WorkflowSettings;
  createdAt?: number;
  updatedAt?: number;
  isTesting?: boolean;
}
