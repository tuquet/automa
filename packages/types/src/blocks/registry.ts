import type {
  AiWorkflowBlockData,
  BlocksGroupBlockData,
  ClipboardBlockData,
  DelayBlockData,
  ExecuteWorkflowBlockData,
  ExportDataBlockData,
  NoteBlockData,
  NotificationBlockData,
  ParameterPromptBlockData,
  TriggerBlockData,
  WaitConnectionsBlockData,
  WebhookBlockData,
  WorkflowStateBlockData,
} from './general.js';

import type {
  ActiveTabBlockData,
  BrowserEventBlockData,
  CloseTabBlockData,
  CookieBlockData,
  ForwardPageBlockData,
  GoBackBlockData,
  HandleDialogBlockData,
  HandleDownloadBlockData,
  NewTabBlockData,
  NewWindowBlockData,
  ProxyBlockData,
  ReloadTabBlockData,
  SwitchTabBlockData,
  TabUrlBlockData,
  TakeScreenshotBlockData,
} from './browser.js';

import type {
  AttributeValueBlockData,
  CreateElementBlockData,
  ElementScrollBlockData,
  EventClickBlockData,
  FormsBlockData,
  GetTextBlockData,
  HoverElementBlockData,
  JavascriptCodeBlockData,
  LinkBlockData,
  PressKeyBlockData,
  SaveAssetsBlockData,
  SwitchToBlockData,
  TriggerEventBlockData,
  UploadFileBlockData,
} from './interaction.js';

import type {
  ConditionsBlockData,
  ElementExistsBlockData,
  LoopBreakpointBlockData,
  LoopDataBlockData,
  LoopElementsBlockData,
  RepeatTaskBlockData,
  WhileLoopBlockData,
} from './conditions.js';

import type {
  DataMappingBlockData,
  DeleteDataBlockData,
  IncreaseVariableBlockData,
  InsertDataBlockData,
  LogDataBlockData,
  RegexVariableBlockData,
  SliceVariableBlockData,
  SortDataBlockData,
} from './data.js';

import type {
  BlockPackageBlockData,
  GoogleDriveBlockData,
  GoogleSheetsBlockData,
  GoogleSheetsDriveBlockData,
} from './onlineServices.js';

export interface BlockDataMap {
  // General
  trigger: TriggerBlockData;
  'ai-workflow': AiWorkflowBlockData;
  'execute-workflow': ExecuteWorkflowBlockData;
  delay: DelayBlockData;
  'export-data': ExportDataBlockData;
  webhook: WebhookBlockData;
  'blocks-group': BlocksGroupBlockData;
  clipboard: ClipboardBlockData;
  'wait-connections': WaitConnectionsBlockData;
  notification: NotificationBlockData;
  note: NoteBlockData;
  'workflow-state': WorkflowStateBlockData;
  'parameter-prompt': ParameterPromptBlockData;

  // Browser
  'active-tab': ActiveTabBlockData;
  'new-tab': NewTabBlockData;
  'switch-tab': SwitchTabBlockData;
  'new-window': NewWindowBlockData;
  proxy: ProxyBlockData;
  'go-back': GoBackBlockData;
  'forward-page': ForwardPageBlockData;
  'close-tab': CloseTabBlockData;
  'take-screenshot': TakeScreenshotBlockData;
  'browser-event': BrowserEventBlockData;
  'handle-dialog': HandleDialogBlockData;
  'handle-download': HandleDownloadBlockData;
  'reload-tab': ReloadTabBlockData;
  'tab-url': TabUrlBlockData;
  cookie: CookieBlockData;

  // Interaction
  'event-click': EventClickBlockData;
  'get-text': GetTextBlockData;
  'element-scroll': ElementScrollBlockData;
  link: LinkBlockData;
  'attribute-value': AttributeValueBlockData;
  forms: FormsBlockData;
  'javascript-code': JavascriptCodeBlockData;
  'trigger-event': TriggerEventBlockData;
  'switch-to': SwitchToBlockData;
  'upload-file': UploadFileBlockData;
  'hover-element': HoverElementBlockData;
  'save-assets': SaveAssetsBlockData;
  'press-key': PressKeyBlockData;
  'create-element': CreateElementBlockData;

  // Conditions
  'repeat-task': RepeatTaskBlockData;
  conditions: ConditionsBlockData;
  'element-exists': ElementExistsBlockData;
  'while-loop': WhileLoopBlockData;
  'loop-data': LoopDataBlockData;
  'loop-elements': LoopElementsBlockData;
  'loop-breakpoint': LoopBreakpointBlockData;

  // Data
  'insert-data': InsertDataBlockData;
  'delete-data': DeleteDataBlockData;
  'log-data': LogDataBlockData;
  'slice-variable': SliceVariableBlockData;
  'increase-variable': IncreaseVariableBlockData;
  'regex-variable': RegexVariableBlockData;
  'data-mapping': DataMappingBlockData;
  'sort-data': SortDataBlockData;

  // Online Services & Package
  'google-sheets': GoogleSheetsBlockData;
  'google-sheets-drive': GoogleSheetsDriveBlockData;
  'google-drive': GoogleDriveBlockData;
  'block-package': BlockPackageBlockData;
}

export type BlockType = keyof BlockDataMap;

/**
 * Discriminated union of all Automa block nodes.
 * Narrowing by node.label automatically gives the exact type of node.data!
 */
export type AutomaBlockNode = {
  [K in BlockType]: {
    id: string;
    label: K;
    type?: string;
    data: BlockDataMap[K];
    position?: {
      x: number;
      y: number;
    };
    dimensions?: {
      width: number;
      height: number;
    };
  };
}[BlockType];

/**
 * Default data values for all Automa block types, matching Automa's engine specifications.
 */
export const BLOCK_DEFAULT_DATA: { [K in BlockType]: BlockDataMap[K] } = {
  // General
  trigger: {
    disableBlock: false,
    description: '',
    type: 'manual',
    interval: 60,
    delay: 5,
    date: '',
    time: '00:00',
    url: '',
    shortcut: '',
    activeInInput: false,
    isUrlRegex: false,
    days: [],
    contextMenuName: '',
    contextTypes: [],
    parameters: [],
    preferParamsInTab: false,
  },
  'ai-workflow': {
    disableBlock: false,
    flowUuid: '',
    flowLabel: '',
    description: '',
    inputs: [],
    outputs: [],
    assignVariable: false,
    variableName: '',
    saveData: false,
    dataColumn: '',
  },
  'execute-workflow': {
    disableBlock: false,
    executeId: '',
    workflowId: '',
    globalData: '',
    description: '',
    insertAllVars: false,
    insertAllGlobalData: false,
  },
  delay: {
    disableBlock: false,
    description: '',
    time: 500,
  },
  'export-data': {
    disableBlock: false,
    name: '',
    refKey: '',
    type: 'json',
    description: '',
    variableName: '',
    csvDelimiter: ',',
    addBOMHeader: true,
    onConflict: 'uniquify',
    dataToExport: 'data-columns',
  },
  webhook: {
    disableBlock: false,
    description: '',
    url: '',
    body: '{}',
    headers: [],
    method: 'POST',
    timeout: 10000,
    dataPath: '',
    contentType: 'json',
    variableName: '',
    assignVariable: false,
    saveData: false,
    dataColumn: '',
    responseType: 'json',
  },
  'blocks-group': {
    disableBlock: false,
    name: '',
    blocks: [],
  },
  clipboard: {
    disableBlock: false,
    description: '',
    type: 'get',
    assignVariable: false,
    variableName: '',
    saveData: true,
    dataColumn: '',
    dataToCopy: '',
    copySelectedText: false,
  },
  'wait-connections': {
    disableBlock: false,
    description: '',
    timeout: 10000,
    specificFlow: false,
    flowBlockId: '',
  },
  notification: {
    disableBlock: false,
    description: '',
    message: '',
    iconUrl: '',
    imageUrl: '',
    title: 'Hello world!',
  },
  note: {
    disableBlock: false,
    note: '',
    drawing: false,
    width: 280,
    height: 168,
    color: 'white',
    fontSize: 'regular',
  },
  'workflow-state': {
    disableBlock: false,
    description: '',
    type: 'stop-current',
    exceptCurrent: false,
    workflowsToStop: [],
    throwError: false,
    errorMessage: '',
  },
  'parameter-prompt': {
    disableBlock: false,
    description: '',
    timeout: 60000,
    parameters: [],
  },

  // Browser
  'active-tab': {
    disableBlock: false,
  },
  'new-tab': {
    disableBlock: false,
    description: '',
    url: '',
    userAgent: '',
    active: true,
    tabZoom: 1,
    inGroup: false,
    waitTabLoaded: false,
    updatePrevTab: false,
    customUserAgent: false,
  },
  'switch-tab': {
    disableBlock: false,
    description: '',
    url: '',
    tabIndex: 0,
    tabTitle: '',
    matchPattern: '',
    activeTab: true,
    createIfNoMatch: false,
    findTabBy: 'match-patterns',
  },
  'new-window': {
    disableBlock: false,
    description: '',
    top: 0,
    left: 0,
    width: 0,
    url: '',
    height: 0,
    type: 'normal',
    incognito: false,
    windowState: 'normal',
  },
  proxy: {
    description: '',
    disableBlock: false,
    scheme: 'https',
    host: '',
    port: 443,
    bypassList: '',
    clearProxy: false,
  },
  'go-back': {
    disableBlock: false,
  },
  'forward-page': {
    disableBlock: false,
  },
  'close-tab': {
    disableBlock: false,
    url: '',
    description: '',
    activeTab: true,
    closeType: 'tab',
    allWindows: false,
  },
  'take-screenshot': {
    description: '',
    disableBlock: false,
    fileName: '',
    ext: 'png',
    quality: 100,
    dataColumn: '',
    variableName: '',
    selector: '',
    fullPage: false,
    saveToColumn: false,
    saveToComputer: true,
    assignVariable: false,
    captureActiveTab: true,
  },
  'browser-event': {
    disableBlock: false,
    description: '',
    timeout: 10000,
    eventName: 'tab:loaded',
    setAsActiveTab: true,
    activeTabLoaded: true,
    tabLoadedUrl: '',
    tabUrl: '',
    fileQuery: '',
  },
  'handle-dialog': {
    disableBlock: false,
    description: '',
    accept: true,
    promptText: '',
  },
  'handle-download': {
    disableBlock: false,
    description: '',
    filename: '',
    timeout: 20000,
    onConflict: 'uniquify',
    waitForDownload: true,
    dataColumn: '',
    saveData: true,
    assignVariable: false,
    variableName: '',
    downloadId: '',
  },
  'reload-tab': {
    disableBlock: false,
  },
  'tab-url': {
    disableBlock: false,
    description: '',
    type: 'active-tab',
    dataColumn: '',
    saveData: true,
    assignVariable: false,
    variableName: '',
    qTitle: '',
    qMatchPatterns: '',
  },
  cookie: {
    disableBlock: false,
    description: '',
    type: 'get',
    jsonCode: '{\n\n}',
    useJson: false,
    getAll: false,
    domain: '',
    expirationDate: '',
    path: '',
    sameSite: '',
    name: '',
    url: '',
    value: '',
    httpOnly: false,
    secure: false,
    session: false,
    assignVariable: false,
    variableName: '',
    saveData: true,
    dataColumn: '',
  },

  // Interaction
  'event-click': {
    disableBlock: false,
    description: '',
    findBy: 'cssSelector',
    waitForSelector: false,
    waitSelectorTimeout: 5000,
    selector: '',
    markEl: false,
    multiple: false,
  },
  'get-text': {
    disableBlock: false,
    description: '',
    findBy: 'cssSelector',
    waitForSelector: false,
    waitSelectorTimeout: 5000,
    selector: '',
    markEl: false,
    multiple: false,
    regex: '',
    prefixText: '',
    suffixText: '',
    regexExp: [],
    dataColumn: '',
    saveData: true,
    includeTags: false,
    addExtraRow: false,
    assignVariable: false,
    useTextContent: false,
    variableName: '',
    extraRowValue: '',
    extraRowDataColumn: '',
  },
  'element-scroll': {
    disableBlock: false,
    description: '',
    findBy: 'cssSelector',
    waitForSelector: false,
    waitSelectorTimeout: 5000,
    selector: 'html',
    markEl: false,
    multiple: false,
    scrollY: 0,
    scrollX: 0,
    incX: false,
    incY: false,
    smooth: false,
    scrollIntoView: false,
  },
  link: {
    disableBlock: false,
    description: '',
    findBy: 'cssSelector',
    waitForSelector: false,
    waitSelectorTimeout: 5000,
    selector: '',
    markEl: false,
    disableMultiple: true,
    openInNewTab: false,
  },
  'attribute-value': {
    disableBlock: false,
    description: '',
    findBy: 'cssSelector',
    waitForSelector: false,
    waitSelectorTimeout: 5000,
    selector: '',
    markEl: false,
    multiple: false,
    attributeValue: '',
    attributeName: '',
    assignVariable: false,
    variableName: '',
    dataColumn: '',
    saveData: true,
    action: 'get',
    addExtraRow: false,
    extraRowValue: '',
    extraRowDataColumn: '',
  },
  forms: {
    disableBlock: false,
    description: '',
    findBy: 'cssSelector',
    waitForSelector: false,
    waitSelectorTimeout: 5000,
    selector: '',
    markEl: false,
    multiple: false,
    selected: true,
    clearValue: true,
    getValue: false,
    saveData: false,
    dataColumn: '',
    selectOptionBy: 'value',
    optionPosition: '1',
    assignVariable: false,
    variableName: '',
    type: 'text-field',
    value: '',
    delay: 0,
    events: [],
  },
  'javascript-code': {
    disableBlock: false,
    description: '',
    timeout: 20000,
    context: 'website',
    code: 'console.log("Hello world!");\nautomaNextBlock()',
    preloadScripts: [],
    everyNewTab: false,
    runBeforeLoad: false,
  },
  'trigger-event': {
    disableBlock: false,
    description: '',
    findBy: 'cssSelector',
    waitForSelector: false,
    waitSelectorTimeout: 5000,
    selector: 'html',
    markEl: false,
    multiple: false,
    eventName: '',
    eventType: '',
    eventParams: { bubbles: true, cancelable: false },
  },
  'switch-to': {
    disableBlock: false,
    findBy: 'cssSelector',
    selector: '',
    windowType: 'main-window',
  },
  'upload-file': {
    disableBlock: false,
    findBy: 'cssSelector',
    waitForSelector: false,
    waitSelectorTimeout: 5000,
    selector: '',
    filePaths: [],
  },
  'hover-element': {
    disableBlock: false,
    description: '',
    findBy: 'cssSelector',
    waitForSelector: false,
    waitSelectorTimeout: 5000,
    selector: '',
    markEl: false,
    multiple: false,
  },
  'save-assets': {
    disableBlock: false,
    description: '',
    findBy: 'cssSelector',
    waitForSelector: false,
    waitSelectorTimeout: 5000,
    selector: '',
    markEl: false,
    multiple: false,
    type: 'element',
    url: '',
    filename: '',
    saveDownloadIds: false,
    onConflict: 'uniquify',
    dataColumn: '',
    saveData: true,
    assignVariable: false,
    variableName: '',
    saveToGDrive: false,
  },
  'press-key': {
    disableBlock: false,
    keys: '',
    selector: '',
    pressTime: '0',
    description: '',
    keysToPress: '',
    action: 'press-key',
  },
  'create-element': {
    disableBlock: false,
    description: '',
    javascript: '',
    html: '',
    css: '',
    preloadScripts: [],
    findBy: 'cssSelector',
    insertAt: 'after',
    runBeforeLoad: false,
    waitForSelector: false,
    waitSelectorTimeout: 5000,
    selector: 'body',
  },

  // Conditions
  'repeat-task': {
    disableBlock: false,
    repeatFor: '1',
  },
  conditions: {
    description: '',
    disableBlock: false,
    conditions: [],
    retryConditions: false,
    retryCount: 10,
    retryTimeout: 1000,
  },
  'element-exists': {
    disableBlock: false,
    description: '',
    findBy: 'cssSelector',
    selector: '',
    tryCount: 1,
    timeout: 500,
    markEl: false,
    throwError: false,
  },
  'while-loop': {
    disableBlock: false,
    description: '',
    conditions: null,
  },
  'loop-data': {
    disableBlock: false,
    loopId: '',
    maxLoop: 0,
    toNumber: 10,
    fromNumber: 1,
    startIndex: 0,
    loopData: '[]',
    description: '',
    variableName: '',
    referenceKey: '',
    reverseLoop: false,
    elementSelector: '',
    waitForSelector: false,
    waitSelectorTimeout: 5000,
    resumeLastWorkflow: false,
    loopThrough: 'data-columns',
  },
  'loop-elements': {
    disableBlock: false,
    loopId: '',
    selector: '',
    maxLoop: '0',
    description: '',
    reverseLoop: false,
    actionElSelector: '',
    findBy: 'cssSelector',
    actionElMaxWaitTime: 5,
    actionPageMaxWaitTime: 10,
    loadMoreAction: 'none',
    scrollToBottom: true,
    waitForSelector: false,
    waitSelectorTimeout: 5000,
  },
  'loop-breakpoint': {
    disableBlock: false,
    loopId: '',
    clearLoop: false,
  },

  // Data
  'insert-data': {
    disableBlock: false,
    description: '',
    dataList: [],
  },
  'delete-data': {
    disableBlock: false,
    description: '',
    deleteList: [],
  },
  'log-data': {
    disableBlock: false,
    description: '',
    workflowId: '',
    dataColumn: '',
    saveData: true,
    assignVariable: false,
    variableName: '',
  },
  'slice-variable': {
    disableBlock: false,
    description: '',
    endIdxEnabled: false,
    startIdxEnabled: true,
    endIndex: 0,
    startIndex: 0,
    variableName: '',
  },
  'increase-variable': {
    disableBlock: false,
    description: '',
    increaseBy: 1,
    variableName: '',
  },
  'regex-variable': {
    disableBlock: false,
    method: 'match',
    replaceVal: '',
    description: '',
    expression: '',
    flag: [],
  },
  'data-mapping': {
    disableBlock: false,
    description: '',
    dataSource: 'table',
    sources: [],
    varSourceName: '',
    dataColumn: '',
    saveData: false,
    assignVariable: false,
    variableName: '',
  },
  'sort-data': {
    disableBlock: false,
    description: '',
    sortByProperty: false,
    itemProperties: [],
    dataSource: 'table',
    varSourceName: '',
    dataColumn: '',
    saveData: false,
    assignVariable: false,
    variableName: '',
  },

  // Online Services & Package
  'google-sheets': {
    disableBlock: false,
    range: '',
    refKey: '',
    type: 'get',
    customData: '',
    description: '',
    spreadsheetId: '',
    dataColumn: '',
    saveData: true,
    assignVariable: false,
    variableName: '',
    firstRowAsKey: false,
    keysAsFirstRow: true,
    valueInputOption: 'RAW',
    InsertDataOption: 'INSERT_ROWS',
    dataFrom: 'data-columns',
  },
  'google-sheets-drive': {
    disableBlock: false,
    range: '',
    refKey: '',
    type: 'get',
    customData: '',
    description: '',
    spreadsheetId: '',
    dataColumn: '',
    inputSpreadsheetId: 'connected',
    saveData: true,
    sheetName: '',
    assignVariable: false,
    variableName: '',
    firstRowAsKey: false,
    keysAsFirstRow: true,
    valueInputOption: 'RAW',
    InsertDataOption: 'INSERT_ROWS',
    dataFrom: 'data-columns',
  },
  'google-drive': {
    disableBlock: false,
    action: 'upload',
    filePaths: [],
  },
  'block-package': {
    disableBlock: false,
  },
};

/**
 * Type-guard to check if an arbitrary string is a valid Automa BlockType.
 */
export function isBlockType(type: string): type is BlockType {
  return type in BLOCK_DEFAULT_DATA;
}

/**
 * Type-safe Factory to create a fully initialized Automa Block Node with merged defaults.
 *
 * @param type The Automa block type (e.g. 'trigger', 'new-tab', 'javascript-code')
 * @param partialData Custom data properties overriding default values
 * @param options Optional id and visual position
 * @returns A strictly typed AutomaBlockNode guaranteed to conform to the engine schema
 */
export function createBlockNode<T extends BlockType>(
  type: T,
  partialData?: Partial<BlockDataMap[T]>,
  options?: {
    id?: string;
    position?: { x: number; y: number };
  }
): AutomaBlockNode {
  const defaultData = BLOCK_DEFAULT_DATA[type];
  const mergedData = {
    ...defaultData,
    ...(partialData || {}),
  } as BlockDataMap[T];

  const id = options?.id || `node-${type}-${Math.random().toString(36).substring(2, 9)}`;

  return {
    id,
    label: type,
    type,
    data: mergedData,
    ...(options?.position ? { position: options.position } : {}),
  } as AutomaBlockNode;
}
