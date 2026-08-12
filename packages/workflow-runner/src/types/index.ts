export interface TableColumn {
  id: string;
  name: string;
  type: string;
  index?: number;
  [key: string]: any;
}

export interface Variables {
  [key: string]: any;
}

export interface ReferenceData {
  variables: Record<string, any>;
  table: any[];
  secrets: Record<string, any>;
  loopData: Record<string, any>;
  workflow: Record<string, any>;
  globalData: Record<string, any>;
  [key: string]: any;
}

export interface BlockData {
  settings?: Record<string, any>;
  description?: string;
  [key: string]: any;
}

export interface WorkflowNode {
  id: string;
  label?: string;
  type?: string;
  data: BlockData;
  position?: { x: number; y: number };
  [key: string]: any;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  [key: string]: any;
}

export interface WorkflowSettings {
  onError?: string;
  restartTimes?: number;
  notification?: boolean;
  debugMode?: boolean;
  [key: string]: any;
}

export interface WorkflowGlobalData {
  [key: string]: any;
}

export interface Workflow {
  id?: string;
  name?: string;
  description?: string;
  version?: string;
  drawflow?: any;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
  settings?: WorkflowSettings;
  globalData?: WorkflowGlobalData;
  table?: TableColumn[];
  [key: string]: any;
}

export type Node = WorkflowNode;
export type Edge = WorkflowEdge;

export interface BlockConnection {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  [key: string]: any;
}

export interface EngineState {
  currentBlock?: WorkflowNode | null;
  referenceData: ReferenceData;
  columns: TableColumn[];
  columnsId: Record<string, string>;
  connectionsMap: Record<string, any>;
  blocks: Record<string, WorkflowNode>;
  isDestroyed?: boolean;
  isPaused?: boolean;
  [key: string]: any;
}

export interface LogData {
  type: 'info' | 'error' | 'warning' | 'success';
  message: string;
  blockId?: string;
  timestamp?: number;
  detail?: any;
  [key: string]: any;
}

export interface LogOptions {
  type?: 'info' | 'error' | 'warning' | 'success';
  blockId?: string;
  timestamp?: number;
  [key: string]: any;
}
