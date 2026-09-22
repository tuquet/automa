/**
 * Host Bridge & Adapters for Automa Studio
 * Handles IPC and state synchronization across VS Code Webview, Iframe, and Standalone browser.
 */

export const defaultWorkflow = {
  extVersion: '1.30.02',
  name: 'new-workflow',
  icon: 'riGlobalLine',
  table: [],
  version: '1.30.02',
  drawflow: {
    edges: [],
    zoom: 1.3,
    nodes: [
      {
        position: { x: 100, y: 504.5 },
        id: 'trigger',
        label: 'trigger',
        data: {
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
          observeElement: {
            selector: '',
            baseSelector: '',
            matchPattern: '',
            targetOptions: {
              subtree: false,
              childList: true,
              attributes: false,
              attributeFilter: [],
              characterData: false,
            },
            baseElOptions: {
              subtree: false,
              childList: true,
              attributes: false,
              attributeFilter: [],
              characterData: false,
            },
          },
        },
        type: 'BlockBasic',
      },
    ],
  },
  settings: {
    publicId: '',
    aipowerToken: '',
    blockDelay: 0,
    saveLog: true,
    debugMode: false,
    restartTimes: 3,
    notification: true,
    execContext: 'popup',
    reuseLastState: false,
    inputAutocomplete: true,
    onError: 'stop-workflow',
    executedBlockOnWeb: false,
    insertDefaultColumn: false,
    defaultColumnName: 'column',
  },
  globalData: '{\n\t"key": "value"\n}',
  description: '',
  includedWorkflows: {},
};

export const sampleWorkflow = defaultWorkflow;

export const getInitialWorkflow = () => {
  if (typeof window !== 'undefined' && window.__AUTOMA_WORKFLOW__) {
    const raw = window.__AUTOMA_WORKFLOW__;
    if (raw && typeof raw === 'object') {
      if (
        raw.data &&
        typeof raw.data === 'object' &&
        (raw.data.drawflow || raw.data.name)
      ) {
        return structuredClone(raw.data);
      }
      return structuredClone(raw);
    }
  }
  return structuredClone(defaultWorkflow);
};

let vsCodeApiInstance = null;
function getVsCodeApi() {
  if (
    !vsCodeApiInstance &&
    typeof window !== 'undefined' &&
    typeof window.acquireVsCodeApi === 'function'
  ) {
    try {
      vsCodeApiInstance = window.acquireVsCodeApi();
    } catch (err) {
      vsCodeApiInstance = null;
    }
  }
  return vsCodeApiInstance;
}

export function emitIpcMessage(type, payload = null) {
  if (typeof window === 'undefined') return;
  let safePayload = null;
  if (payload) {
    try {
      safePayload = structuredClone(payload);
    } catch {
      try {
        safePayload = JSON.parse(JSON.stringify(payload));
      } catch {
        safePayload = null;
      }
    }
  }
  const messageType = type.startsWith('automa:') ? type : `automa:${type}`;
  const message = { type: messageType, data: safePayload };

  const vscode = getVsCodeApi();
  if (vscode) vscode.postMessage(message);

  if (window.parent && window.parent !== window)
    window.parent.postMessage(message, '*');

  try {
    window.dispatchEvent(new CustomEvent(messageType, { detail: safePayload }));
  } catch (err) {
    // Non-fatal error broadcasting event in detached environment
  }
}

export function setupHostBridgeReceiver(store) {
  if (typeof window !== 'undefined') {
    window.setAutomaWorkflow = (newWorkflow) => {
      if (newWorkflow) store.setWorkflow(structuredClone(newWorkflow));
    };
    window.getAutomaWorkflow = () => {
      return structuredClone(store.currentWorkflow);
    };
  }
}
