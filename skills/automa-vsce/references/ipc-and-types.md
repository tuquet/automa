# `automa-vsce` — IPC Protocol & Types Contracts

Comprehensive reference for IPC message routing, type safety standards, and package contracts in `automa-vsce`.

---

## 1. 📦 Canonical Types Packages

All code in `automa-vsce` MUST strictly consume types from these 3 canonical packages:

| Package | Path | Usage Scope |
| :--- | :--- | :--- |
| `@automa/types` | `packages/automa-types/src/index.ts` | Domain models (`Workflow`, `Campaign`, `BrowserProfile`, `StorageItem`, `Job`) |
| `@automa/types/api` | `packages/automa-types/src/api/index.ts` | Generated OpenAPI SDK client & DTOs (`submitJob()`, `getJobStatus()`, `getBrowsers()`) |
| `@automa/types/ws` | `packages/automa-types/src/ws.ts` | 2-way WebSocket control commands & telemetry events (`AutomaWsCommand`, `AutomaWsEvent`) |

> [!CAUTION]
> Loose type casting (`as any`, `Record<string, unknown>`) or declaring local duplicate type interfaces is strictly FORBIDDEN.

---

## 2. 🔌 IPC Communication Protocol

### Architecture Overview
The Extension Host communicates with the Webview (Vue 3.5 app) via asynchronous JSON messages.

```
┌───────────────────────────┐                      ┌───────────────────────────┐
│      Extension Host       │                      │     Webview (Vue 3.5)     │
├───────────────────────────┤                      ├───────────────────────────┤
│ panel.webview.postMessage │ ───────────────────> │ window.addEventListener   │
│                           │                      │   ('message', handler)    │
│ panel.webview             │ <─────────────────── │ vscode.postMessage(msg)   │
│   .onDidReceiveMessage    │                      │                           │
└───────────────────────────┘                      └───────────────────────────┘
```

---

## 3. 📝 Standard IPC Message Contracts

### A. Extension Host $\rightarrow$ Webview Messages
```typescript
export type ExtensionToWebviewMessage =
  | { type: "initData"; viewType: string; payload: unknown }
  | { type: "updateDocument"; data: Record<string, unknown> }
  | { type: "task:log"; data: { timestamp: string; level: "info" | "warn" | "error"; message: string } }
  | { type: "task:status"; status: "running" | "completed" | "failed" | "stopped"; jobId?: string }
  | { type: "ws:event"; event: AutomaWsEvent }
  | { type: "tableRowsData"; data: Array<Record<string, unknown>> };
```

### B. Webview $\rightarrow$ Extension Host Messages
```typescript
export type WebviewToExtensionMessage =
  | { type: "documentChange"; data: Record<string, unknown> }
  | { type: "saveDocument"; data: Record<string, unknown> }
  | { type: "runWorkflow"; options?: { browserId?: string; headless?: boolean; variables?: Record<string, unknown> } }
  | { type: "pauseJob"; jobId: string }
  | { type: "resumeJob"; jobId: string }
  | { type: "killJob"; jobId: string }
  | { type: "getTableRows"; query?: string }
  | { type: "addTableRow"; data: Record<string, unknown> }
  | { type: "showNotification"; message: string; severity?: "info" | "warning" | "error" };
```

---

## 4. 🛠️ Frontend Vue Bridge Composable (`useVsCodeBridge.ts`)

In `webview-ui/src/composables/useVsCodeBridge.ts`, use a centralized typed composable to send and receive messages.

```typescript
declare function acquireVsCodeApi(): {
  postMessage: (msg: unknown) => void;
  getState: () => unknown;
  setState: (state: unknown) => void;
};

const vscode = typeof acquireVsCodeApi === "function" ? acquireVsCodeApi() : null;

export function useVsCodeBridge() {
  const postMessage = (msg: WebviewToExtensionMessage) => {
    if (vscode) {
      vscode.postMessage(msg);
    } else {
      console.log("[Mock VsCode Bridge Post]", msg);
    }
  };

  const onMessage = (handler: (msg: ExtensionToWebviewMessage) => void) => {
    const listener = (event: MessageEvent) => {
      if (event.data) handler(event.data);
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  };

  return {
    postMessage,
    onMessage,
  };
}
```

---

## 5. 🛡️ IPC Error Handling Guidelines

1. **Defensive Payloads**: Always check `if (!message || typeof message !== 'object') return;` at the top of every `onDidReceiveMessage` listener.
2. **Command Alias Normalization**: Normalize incoming message command fields: `const cmd = message.type || message.command || message.action;`.
3. **Try/Catch Boundary**: Wrap all IPC command handlers in a `try/catch` block and report errors via `vscode.window.showErrorMessage(...)`. Never let an IPC error unhandle and crash the Extension Host.
