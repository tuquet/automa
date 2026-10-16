import { BLOCK_DEFAULT_DATA, type BlockType } from '@automa/types';

export type BlockCategoryKey =
  | 'general'
  | 'browser'
  | 'interaction'
  | 'conditions'
  | 'data'
  | 'onlineServices';

export type CanvasBlockComponentName =
  | 'BlockBasic'
  | 'BlockBasicWithFallback'
  | 'BlockConditions'
  | 'BlockDelay'
  | 'BlockElementExists'
  | 'BlockGroup'
  | 'BlockLoopBreakpoint'
  | 'BlockNote'
  | 'BlockPackage'
  | 'BlockRepeatTask';

export interface BlockCategoryMeta {
  id: BlockCategoryKey;
  name: string;
  badgeClass: string;
}

export interface AutomaBlockMeta {
  id: BlockType;
  name: string;
  description: string;
  category: BlockCategoryKey;
  icon: string;
  component: CanvasBlockComponentName;
  disableInPackage?: boolean;
  defaultData: Record<string, unknown>;
}

export const BLOCK_CATEGORIES: Record<BlockCategoryKey, BlockCategoryMeta> = {
  general: {
    id: 'general',
    name: 'General',
    badgeClass: 'bg-primary/10 text-primary border-primary/20',
  },
  browser: {
    id: 'browser',
    name: 'Browser',
    badgeClass: 'bg-accent text-accent-foreground border-border',
  },
  interaction: {
    id: 'interaction',
    name: 'Web Interaction',
    badgeClass: 'bg-secondary text-secondary-foreground border-border',
  },
  conditions: {
    id: 'conditions',
    name: 'Control Flow & Loops',
    badgeClass: 'bg-primary/15 text-primary border-primary/30',
  },
  data: {
    id: 'data',
    name: 'Data & Variables',
    badgeClass: 'bg-muted text-foreground border-border',
  },
  onlineServices: {
    id: 'onlineServices',
    name: 'Packages & Integrations',
    badgeClass: 'bg-accent text-accent-foreground border-border',
  },
};

export const EXCLUDED_PACKAGE_BLOCK_IDS = new Set<string>([
  'trigger',
  'block-package',
  'execute-workflow',
]);

export function isExcludedInPackage(blockId: string): boolean {
  return EXCLUDED_PACKAGE_BLOCK_IDS.has(blockId);
}

const RAW_BLOCK_META: Array<Omit<AutomaBlockMeta, 'defaultData'>> = [
  // General
  {
    id: 'trigger',
    name: 'Trigger',
    description: 'Entry point that starts workflow execution',
    category: 'general',
    icon: 'Play',
    component: 'BlockBasic',
    disableInPackage: true,
  },
  {
    id: 'delay',
    name: 'Delay',
    description: 'Pause execution for a specified duration in ms',
    category: 'general',
    icon: 'Clock',
    component: 'BlockDelay',
  },
  {
    id: 'execute-workflow',
    name: 'Execute Workflow',
    description: 'Trigger another workflow synchronously',
    category: 'general',
    icon: 'GitBranch',
    component: 'BlockBasic',
    disableInPackage: true,
  },
  {
    id: 'export-data',
    name: 'Export Data',
    description: 'Export workflow table or variables to JSON/CSV',
    category: 'general',
    icon: 'Download',
    component: 'BlockBasic',
  },
  {
    id: 'webhook',
    name: 'HTTP / Webhook',
    description: 'Send HTTP request with custom headers and payload',
    category: 'general',
    icon: 'Globe',
    component: 'BlockBasicWithFallback',
  },
  {
    id: 'blocks-group',
    name: 'Blocks Group',
    description: 'Group multiple sequential blocks into a single node',
    category: 'general',
    icon: 'FolderKanban',
    component: 'BlockGroup',
  },
  {
    id: 'clipboard',
    name: 'Clipboard',
    description: 'Read or write system clipboard text',
    category: 'general',
    icon: 'Clipboard',
    component: 'BlockBasic',
  },
  {
    id: 'wait-connections',
    name: 'Wait Connections',
    description: 'Wait for multiple incoming branches before continuing',
    category: 'general',
    icon: 'GitMerge',
    component: 'BlockBasic',
  },
  {
    id: 'notification',
    name: 'Notification',
    description: 'Send a desktop or system notification',
    category: 'general',
    icon: 'Bell',
    component: 'BlockBasic',
  },
  {
    id: 'note',
    name: 'Sticky Note',
    description: 'Add documentation or annotations on the canvas',
    category: 'general',
    icon: 'StickyNote',
    component: 'BlockNote',
  },
  {
    id: 'workflow-state',
    name: 'Workflow State',
    description: 'Stop or control running workflow state',
    category: 'general',
    icon: 'Square',
    component: 'BlockBasic',
  },
  {
    id: 'parameter-prompt',
    name: 'Parameter Prompt',
    description: 'Prompt for runtime parameters before execution',
    category: 'general',
    icon: 'SlidersHorizontal',
    component: 'BlockBasic',
  },

  // Browser
  {
    id: 'new-tab',
    name: 'New Tab / Open URL',
    description: 'Open or navigate to a target URL',
    category: 'browser',
    icon: 'ExternalLink',
    component: 'BlockBasic',
  },
  {
    id: 'active-tab',
    name: 'Active Tab',
    description: 'Set the currently active tab as execution target',
    category: 'browser',
    icon: 'AppWindow',
    component: 'BlockBasic',
  },
  {
    id: 'switch-tab',
    name: 'Switch Tab',
    description: 'Switch active tab by URL pattern or index',
    category: 'browser',
    icon: 'ArrowLeftRight',
    component: 'BlockBasic',
  },
  {
    id: 'new-window',
    name: 'New Window',
    description: 'Open a new browser window',
    category: 'browser',
    icon: 'LayoutGrid',
    component: 'BlockBasic',
  },
  {
    id: 'proxy',
    name: 'Proxy',
    description: 'Configure browser proxy settings',
    category: 'browser',
    icon: 'Shield',
    component: 'BlockBasic',
  },
  {
    id: 'go-back',
    name: 'Go Back',
    description: 'Navigate back in browser history',
    category: 'browser',
    icon: 'ArrowLeft',
    component: 'BlockBasic',
  },
  {
    id: 'forward-page',
    name: 'Go Forward',
    description: 'Navigate forward in browser history',
    category: 'browser',
    icon: 'ArrowRight',
    component: 'BlockBasic',
  },
  {
    id: 'close-tab',
    name: 'Close Tab',
    description: 'Close the active or matched browser tab',
    category: 'browser',
    icon: 'XCircle',
    component: 'BlockBasic',
  },
  {
    id: 'take-screenshot',
    name: 'Take Screenshot',
    description: 'Capture PNG/JPEG screenshot via CDP',
    category: 'browser',
    icon: 'Camera',
    component: 'BlockBasic',
  },
  {
    id: 'browser-event',
    name: 'Browser Event',
    description: 'Wait for page load or navigation event',
    category: 'browser',
    icon: 'Radio',
    component: 'BlockBasic',
  },
  {
    id: 'handle-dialog',
    name: 'Handle Dialog',
    description: 'Accept or dismiss alert/confirm/prompt dialogs',
    category: 'browser',
    icon: 'MessageSquareWarning',
    component: 'BlockBasic',
  },
  {
    id: 'handle-download',
    name: 'Handle Download',
    description: 'Wait for and manage downloaded file path',
    category: 'browser',
    icon: 'FileDown',
    component: 'BlockBasic',
  },
  {
    id: 'reload-tab',
    name: 'Reload Tab',
    description: 'Reload the current page',
    category: 'browser',
    icon: 'RotateCw',
    component: 'BlockBasic',
  },
  {
    id: 'tab-url',
    name: 'Get Tab URL',
    description: 'Read current tab URL into variable or table',
    category: 'browser',
    icon: 'Link2',
    component: 'BlockBasic',
  },
  {
    id: 'cookie',
    name: 'Cookies',
    description: 'Get, set, or clear browser cookies via CDP',
    category: 'browser',
    icon: 'Cookie',
    component: 'BlockBasic',
  },

  // Interaction
  {
    id: 'event-click',
    name: 'Click Element',
    description: 'Hardware-level human mouse click on CSS/XPath selector',
    category: 'interaction',
    icon: 'MousePointerClick',
    component: 'BlockBasic',
  },
  {
    id: 'get-text',
    name: 'Get Text',
    description: 'Extract textContent from matched DOM elements',
    category: 'interaction',
    icon: 'Type',
    component: 'BlockBasic',
  },
  {
    id: 'element-scroll',
    name: 'Scroll Element',
    description: 'Scroll element into view or by offset',
    category: 'interaction',
    icon: 'MoveVertical',
    component: 'BlockBasic',
  },
  {
    id: 'link',
    name: 'Open Link',
    description: 'Follow href attribute of a link element',
    category: 'interaction',
    icon: 'ExternalLink',
    component: 'BlockBasic',
  },
  {
    id: 'attribute-value',
    name: 'Attribute Value',
    description: 'Extract HTML attribute value from matched element',
    category: 'interaction',
    icon: 'Code2',
    component: 'BlockBasic',
  },
  {
    id: 'forms',
    name: 'Forms / Input Text',
    description: 'Type text, select option, or toggle checkbox/radio',
    category: 'interaction',
    icon: 'FormInput',
    component: 'BlockBasic',
  },
  {
    id: 'javascript-code',
    name: 'JavaScript Code',
    description: 'Execute JS inside stealth isolated world',
    category: 'interaction',
    icon: 'Terminal',
    component: 'BlockBasic',
  },
  {
    id: 'trigger-event',
    name: 'Trigger DOM Event',
    description: 'Dispatch DOM event on matched element',
    category: 'interaction',
    icon: 'Zap',
    component: 'BlockBasic',
  },
  {
    id: 'switch-to',
    name: 'Switch Iframe',
    description: 'Switch execution context between main window and iframe',
    category: 'interaction',
    icon: 'Frame',
    component: 'BlockBasic',
  },
  {
    id: 'upload-file',
    name: 'Upload File',
    description: 'Attach local files to file input element',
    category: 'interaction',
    icon: 'Upload',
    component: 'BlockBasic',
  },
  {
    id: 'hover-element',
    name: 'Hover Element',
    description: 'Move cursor over matched element along Bezier curve',
    category: 'interaction',
    icon: 'MousePointer',
    component: 'BlockBasic',
  },
  {
    id: 'save-assets',
    name: 'Save Media Assets',
    description: 'Download images/audio/video from element src',
    category: 'interaction',
    icon: 'ImageDown',
    component: 'BlockBasic',
  },
  {
    id: 'press-key',
    name: 'Press Key',
    description: 'Dispatch native keyboard key press or shortcut',
    category: 'interaction',
    icon: 'Keyboard',
    component: 'BlockBasic',
  },
  {
    id: 'create-element',
    name: 'Create Element',
    description: 'Inject custom HTML/CSS into target page',
    category: 'interaction',
    icon: 'FilePlus2',
    component: 'BlockBasic',
  },

  // Conditions & Control Flow
  {
    id: 'conditions',
    name: 'Conditions',
    description: 'Branch execution flow based on dynamic rules',
    category: 'conditions',
    icon: 'GitFork',
    component: 'BlockConditions',
  },
  {
    id: 'element-exists',
    name: 'Element Exists',
    description: 'Check if selector exists; routes to output-1 or fallback',
    category: 'conditions',
    icon: 'SearchCheck',
    component: 'BlockElementExists',
  },
  {
    id: 'while-loop',
    name: 'While Loop',
    description: 'Repeat loop body while condition remains true',
    category: 'conditions',
    icon: 'Repeat',
    component: 'BlockBasicWithFallback',
  },
  {
    id: 'loop-data',
    name: 'Loop Data',
    description: 'Iterate through array, table, or number range',
    category: 'conditions',
    icon: 'Repeat1',
    component: 'BlockBasic',
  },
  {
    id: 'loop-elements',
    name: 'Loop Elements',
    description: 'Iterate over matched DOM elements by index',
    category: 'conditions',
    icon: 'ListOrdered',
    component: 'BlockBasic',
  },
  {
    id: 'loop-breakpoint',
    name: 'Loop Breakpoint',
    description: 'Marks the end of a loop iteration body',
    category: 'conditions',
    icon: 'CornerUpLeft',
    component: 'BlockLoopBreakpoint',
  },
  {
    id: 'repeat-task',
    name: 'Repeat Task',
    description: 'Repeat connected steps N times',
    category: 'conditions',
    icon: 'RefreshCw',
    component: 'BlockRepeatTask',
  },

  // Data
  {
    id: 'insert-data',
    name: 'Insert Data / Variable',
    description: 'Set workflow variables or append table rows',
    category: 'data',
    icon: 'Database',
    component: 'BlockBasic',
  },
  {
    id: 'delete-data',
    name: 'Delete Data',
    description: 'Clear variables or table columns',
    category: 'data',
    icon: 'Trash2',
    component: 'BlockBasic',
  },
  {
    id: 'log-data',
    name: 'Log Data',
    description: 'Output variable or step data to execution logs',
    category: 'data',
    icon: 'ScrollText',
    component: 'BlockBasic',
  },
  {
    id: 'slice-variable',
    name: 'Slice Variable',
    description: 'Extract a slice of a string or array variable',
    category: 'data',
    icon: 'Scissors',
    component: 'BlockBasic',
  },
  {
    id: 'increase-variable',
    name: 'Increase Variable',
    description: 'Increment a numeric variable by N',
    category: 'data',
    icon: 'PlusCircle',
    component: 'BlockBasic',
  },
  {
    id: 'regex-variable',
    name: 'Regex Variable',
    description: 'Transform variable value with regular expression',
    category: 'data',
    icon: 'Regex',
    component: 'BlockBasic',
  },
  {
    id: 'data-mapping',
    name: 'Data Mapping',
    description: 'Map and transform object/array properties',
    category: 'data',
    icon: 'Network',
    component: 'BlockBasic',
  },
  {
    id: 'sort-data',
    name: 'Sort Data',
    description: 'Sort array or table rows by property',
    category: 'data',
    icon: 'ArrowUpDown',
    component: 'BlockBasic',
  },

  // Online Services & Packages
  {
    id: 'block-package',
    name: 'Package Block',
    description: 'Reusable encapsulated sub-workflow with custom I/O handles',
    category: 'onlineServices',
    icon: 'Package',
    component: 'BlockPackage',
    disableInPackage: true,
  },
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    description: 'Read, append, or update Google Sheets ranges',
    category: 'onlineServices',
    icon: 'Table2',
    component: 'BlockBasic',
  },
  {
    id: 'google-sheets-drive',
    name: 'Google Sheets (Drive)',
    description: 'Manage spreadsheets via Google Drive integration',
    category: 'onlineServices',
    icon: 'FileSpreadsheet',
    component: 'BlockBasic',
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Upload or download files from Google Drive',
    category: 'onlineServices',
    icon: 'HardDrive',
    component: 'BlockBasic',
  },
];

export const BLOCK_REGISTRY: Record<string, AutomaBlockMeta> = Object.fromEntries(
  RAW_BLOCK_META.map((item) => [
    item.id,
    {
      ...item,
      defaultData: structuredClone(
        (BLOCK_DEFAULT_DATA[item.id] as Record<string, unknown>) || {
          disableBlock: false,
          description: '',
        },
      ),
    },
  ]),
);

export function getBlockMeta(blockId: string): AutomaBlockMeta {
  return (
    BLOCK_REGISTRY[blockId] ?? {
      id: blockId as BlockType,
      name: blockId,
      description: '',
      category: 'general',
      icon: 'Box',
      component: 'BlockBasic',
      defaultData: { disableBlock: false, description: '' },
    }
  );
}

export function getBlocksByCategory(options?: {
  isPackage?: boolean;
  search?: string;
}): Record<BlockCategoryKey, AutomaBlockMeta[]> {
  const query = (options?.search || '').trim().toLowerCase();
  const grouped: Record<BlockCategoryKey, AutomaBlockMeta[]> = {
    general: [],
    browser: [],
    interaction: [],
    conditions: [],
    data: [],
    onlineServices: [],
  };

  for (const meta of Object.values(BLOCK_REGISTRY)) {
    if (options?.isPackage && meta.disableInPackage) continue;
    if (meta.id === 'block-package') continue; // Dropped from Packages tab
    if (
      query &&
      !meta.name.toLowerCase().includes(query) &&
      !meta.id.toLowerCase().includes(query) &&
      !meta.description.toLowerCase().includes(query)
    ) {
      continue;
    }
    grouped[meta.category].push(meta);
  }

  return grouped;
}
