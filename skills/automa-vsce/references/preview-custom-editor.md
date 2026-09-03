# `automa-vsce:preview` — Preview & Custom Editor Architecture

Comprehensive architectural guide, document synchronization patterns, preview/source toggle mechanisms, and live debugging standards for **Previews and Custom Editors** in `automa-vsce`.

---

## 1. 🎯 Definition & Mental Model

In `automa-vsce`, a **Preview / Custom Editor** is a document-bound visual editor (`vscode.CustomTextEditorProvider`) that replaces or augments raw JSON scenario files with a visual WYSIWYG canvas, forms, and interactive execution surfaces.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                   AUTOMA-VSCE PREVIEW & CUSTOM EDITORS                   │
├──────────────────────────┬─────────────────────────┬─────────────────────┤
│ 1. Workflow Editor       │ 2. Campaign Editor      │ 3. Browser / Logs   │
│ (*.workflow.json)        │ (*.campaign.json)       │ (*.browser.json,    │
│                          │                         │  *.automa-log.json) │
├──────────────────────────┼─────────────────────────┼─────────────────────┤
│ • VueFlow Visual Canvas  │ • Matrix Fleet Matrix   │ • Profile Settings  │
│ • Node Parameters & Form │ • Browser Slot Binder   │ • Live SSE Log View │
│ • Live Debugger & WS     │ • Task Sequencer        │ • Historical Trace  │
└──────────────────────────┴─────────────────────────┴─────────────────────┘
```

---

## 2. 📁 File Type Mappings & Providers

| File Pattern | Custom Editor `viewType` | Provider Class | Primary Presentation Surface |
| :--- | :--- | :--- | :--- |
| `*.workflow.json`, `*.package.json`, `*.automa.json` | `automa.workflowEditor` | `WorkflowEditorProvider` | **Embedded Web Studio (`automa-webe:studio` at `http://127.0.0.1:8765/studio`)** + Parameters + 60fps Virtual Output Logs |
| `*.campaign.json`, `*.campaigns.json` | `automa.campaignEditor` | `CampaignEditorProvider` | Multi-Browser Fleet Matrix Scheduler + Task Allocator |
| `*.browser.json` | `automa.browserEditor` | `BrowserEditorProvider` | Anti-Detect Profile Form, Fingerprints & Proxy Config |
| `*.automa-log.json` | `automa.logEditor` | `LogEditorProvider` | Execution Audit Trail & Step Timing Breakdown |

> [!IMPORTANT]
> **Zero Canvas Duplication Invariant**: `WorkflowEditorProvider` does NOT maintain a separate VueFlow graph canvas. It reuses the exact same build artifact `automa-webe:studio` served by the Automa Core Rust Daemon at `http://127.0.0.1:8765/studio` via an embedded Iframe and 2-way postMessage Host Bridge.

---

## 3. 🔄 Bidirectional Document Synchronization Pattern

The `TextDocument` buffer in VS Code is the **Single Source of Truth** for scenario files. The Custom Editor provides a reactive bridge between the disk/buffer and the Vue Webview.

```
                        ┌───────────────────────────────┐
                        │   vscode.TextDocument (RAM)   │
                        │    [Single Source of Truth]   │
                        └───────┬───────────────▲───────┘
          Text Change Event     │               │  WorkspaceEdit
  (External edit / format/ Git) │               │  (User edits on Canvas)
                                ▼               │
                        ┌───────────────────────┴───────┐
                        │    WorkflowEditorProvider     │
                        │   (Extension Host Provider)   │
                        └───────┬───────────────▲───────┘
              postMessage()     │               │  onDidReceiveMessage()
              { type: 'init' }  │               │  { type: 'documentChange' }
                                ▼               │
                        ┌───────────────────────┴───────┐
                        │    Vue 3.5 Webview Canvas     │
                        │  (VueFlow Graph / Visual UI)  │
                        └───────────────────────────────┘
```

### Flow A: Disk / Text Document $\rightarrow$ Webview (External Updates)
1. VS Code triggers `vscode.workspace.onDidChangeTextDocument(e)`.
2. Provider verifies `e.document.uri.toString() === document.uri.toString()`.
3. Provider sends `postMessage({ type: 'updateDocument', data: parsedJson })` to Webview.
4. Vue Webview updates graph state **reactively** without resetting user viewport pan/zoom coordinates.

### Flow B: Webview $\rightarrow$ Text Document (User Canvas Edits)
1. User adds/moves a node, updates an edge, or modifies a parameter in the Webview.
2. Webview emits IPC message:
   ```typescript
   vscode.postMessage({
     type: "documentChange",
     data: updatedWorkflowAst
   });
   ```
3. Provider consumes message via `WorkflowSaveService` and applies a `vscode.WorkspaceEdit`:
   ```typescript
   const edit = new vscode.WorkspaceEdit();
   const fullRange = new vscode.Range(
     document.positionAt(0),
     document.positionAt(document.getText().length)
   );
   edit.replace(document.uri, fullRange, JSON.stringify(sanitizedData, null, 2));
   await vscode.workspace.applyEdit(edit);
   ```
4. **Key Benefits**:
   - Native Undo/Redo (`Ctrl+Z`, `Ctrl+Y`) is automatically preserved in VS Code history.
   - Dirty indicator dot (`●`) appears in the tab header until saved.
   - Native Save (`Ctrl+S`) writes the file to disk safely.

---

## 4. 🔀 Source $\leftrightarrow$ Preview Toggle Mechanism

Developers can seamlessly toggle between the Visual Custom Editor and the Raw JSON Text Editor, or view them side-by-side.

### Registered Title & Context Commands (`package.json`)
```json
{
  "editor/title": [
    {
      "command": "automa.showWorkflowSource",
      "when": "activeCustomEditorId == 'automa.workflowEditor'",
      "group": "navigation"
    },
    {
      "command": "automa.showWorkflowPreview",
      "when": "resourceFilename =~ /.*\\.(workflow|package|automa)\\.json$/ && activeCustomEditorId != 'automa.workflowEditor'",
      "group": "navigation"
    }
  ]
}
```

### Side-by-Side Split View Pattern
```typescript
// Open Visual Preview beside Raw JSON Editor
export async function showWorkflowPreviewCommand(uri?: vscode.Uri) {
  const targetUri = uri || vscode.window.activeTextEditor?.document.uri;
  if (!targetUri) return;

  await vscode.commands.executeCommand(
    "vscode.openWith",
    targetUri,
    "automa.workflowEditor",
    vscode.ViewColumn.Beside
  );
}

// Open Raw JSON Source from Visual Preview
export async function showWorkflowSourceCommand(uri?: vscode.Uri) {
  const targetUri = uri || vscode.window.activeTextEditor?.document.uri;
  if (!targetUri) return;

  await vscode.commands.executeCommand(
    "vscode.openWith",
    targetUri,
    "default",
    vscode.ViewColumn.Active
  );
}
```

---

## 5. 🛑 2-Way Live Breakpoint & Debugging Bridge

Previews in `automa-vsce` act as an active debugging interface during workflow runs.

```
                    ┌───────────────────────────────┐
                    │    Workflow Preview Webview   │
                    │ [Pause] [Resume] [Kill] Step  │
                    └───────┬───────────────▲───────┘
      Command (e.g. PAUSE)  │               │ Live Step Highlight / State
                            ▼               │
                    ┌───────────────────────┴───────┐
                    │   WebSocketService (/api/ws)  │
                    │   Automa Core Rust Daemon     │
                    └───────────────────────────────┘
```

1. **Live Breakpoints & Controls**:
   - Webview sends `pauseJob`, `resumeJob`, `killJob` via IPC.
   - Extension Host routes commands via `WebSocketService.getInstance().send({ type: "PAUSE_JOB", jobId })`.
2. **Active Step Highlighting**:
   - When Automa Core reaches a breakpoint or finishes a node, it broadcasts WS event `NODE_EXECUTION_STATE`.
   - Webview highlights the active VueFlow node in pulsing yellow/green border in real-time.
3. **Integrated Output Console**:
   - Telemetry logs streamed from `/api/v1/events` (SSE) are delivered to the Webview Output tab via `task:log` IPC messages.

---

## 6. 🛡️ Invariants & Rules for Previews

1. **Zero Data Loss & Defensive Sanitization**:
   - Before applying edits to `TextDocument`, all workflow ASTs MUST pass through `WorkflowSanitizer`.
   - Must guarantee modern nodes array structure (`nodes: []`, `edges: []`), repair missing IDs, and preserve custom block metadata.
2. **Zero Direct File System Overwrites**:
   - Never use `fs.writeFileSync()` on an open document. Always use `vscode.WorkspaceEdit` to integrate with the VS Code document lifecycle and undo stack.
3. **No Dual Serialization Conflict**:
   - Debounce incoming document change events from the Webview (minimum 150ms) to avoid race conditions during rapid typing or canvas dragging.
4. **Testability & Test IDs**:
   - All editor action buttons (`Run Workflow`, `Pause`, `Resume`, `Kill`, `Save`, `Zoom In`, `Zoom Out`, `Fit View`) MUST include `data-testid`.
