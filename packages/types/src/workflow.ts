import type {
  AutomaBlockNode,
  BlockPackageBlockData,
  PackageIO,
  PackageParameter,
  PackageSettings,
} from './blocks/index.js';

export interface BlockPackageNode {
  id: string;
  label: 'block-package';
  type?: string;
  position?: { x: number; y: number };
  data: BlockPackageBlockData;
}


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

/**
 * Official Automa Package (`.automa-pkg` / `savedBlocks`) JSON structure.
 * Matches `AutomaApp/automa` (`src/stores/package.js` & `BlockPackage.vue`).
 */
export interface AutomaPackage {
  id: string;
  name: string;
  icon: string;
  description: string;
  content?: string;
  author?: string;
  extVersion?: string;
  isExternal?: boolean;
  createdAt: number;
  updatedAt?: number;
  inputs: PackageIO[];
  outputs: PackageIO[];
  parameters?: PackageParameter[];
  settings: PackageSettings;
  data: {
    nodes: Array<WorkflowNode | AutomaBlockNode>;
    edges: WorkflowEdge[];
  };
}

export interface DefinePackageOptions {
  id?: string;
  name: string;
  icon?: string;
  description?: string;
  content?: string;
  author?: string;
  asBlock?: boolean;
  inputs?: PackageIO[];
  outputs?: PackageIO[];
  parameters?: PackageParameter[];
  nodes: Array<AutomaBlockNode | WorkflowNode>;
  edges?: WorkflowEdge[];
}

const EXCLUDED_PACKAGE_BLOCKS = new Set([
  'block-package',
  'trigger',
  'execute-workflow',
]);

export function definePackage(options: DefinePackageOptions): AutomaPackage {
  const filteredNodes = options.nodes.filter(
    (node) => !EXCLUDED_PACKAGE_BLOCKS.has(node.label),
  );
  const now = Date.now();
  return {
    id: options.id || `pkg-${Math.random().toString(36).substring(2, 9)}`,
    name: options.name,
    icon: options.icon || 'mdiPackageVariantClosed',
    description: options.description || '',
    content: options.content || '',
    author: options.author,
    isExternal: false,
    createdAt: now,
    updatedAt: now,
    inputs: options.inputs || [],
    outputs: options.outputs || [],
    parameters: options.parameters || [],
    settings: {
      asBlock: options.asBlock ?? true,
    },
    data: {
      nodes: filteredNodes,
      edges: options.edges || [],
    },
  };
}

export function packageToBlockNode(
  pkg: AutomaPackage,
  options?: { id?: string; position?: { x: number; y: number } },
): BlockPackageNode {
  return {
    id: options?.id || `node-${Math.random().toString(36).substring(2, 9)}`,
    label: 'block-package',
    type: 'BlockPackage',
    position: options?.position || { x: 0, y: 0 },
    data: {
      ...pkg,
      packageId: pkg.id,
      packageName: pkg.name,
    },
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

