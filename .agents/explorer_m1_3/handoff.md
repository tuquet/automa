# Analysis and Proposed Design for `automa-cli` using Puppeteer

This report outlines the analysis of the Automa background architecture, offscreen document handling, message listeners, execution state tracking, and logs. It provides technical solutions for the four key risks and details the package design for `automa-cli`.

---

## 1. Observation

Our investigation of the `automa` codebase yielded the following observations:

1. **Workflow execution delegation**:
   * File path: `automa/src/background/BackgroundWorkflowUtils.js` (lines 124–137)
     ```javascript
     async executeWorkflow(workflowData, options) {
       if (workflowData.isDisabled) return;

       if (IS_FIREFOX) {
         await this.#ensureWorkflowManager();
         this.#workflowManager.execute(workflowData, options);
         return;
       }

       await BackgroundOffscreen.instance.sendMessage('workflow:execute', {
         workflow: workflowData,
         options,
       });
     }
     ```
   * *In Chromium MV3, the background Service Worker delegates workflow execution to the Offscreen Document to avoid worker termination due to inactivity.*

2. **Offscreen routing**:
   * File path: `automa/src/offscreen/message-listener.js` (lines 9–11)
     ```javascript
     messageListener.on('workflow:execute', ({ workflow, options }) => {
       WorkflowManager.instance.execute(workflow, options);
     });
     ```
   * *The Offscreen Document captures `'workflow:execute'` and triggers `WorkflowManager.instance.execute()`.*

3. **Execution State Persistence**:
   * File path: `automa/src/workflowEngine/WorkflowState.js` (lines 74–78, 21–30)
     ```javascript
     async add(id, data = {}) {
       this.states.set(id, data);
       this._updateBadge();
       this._saveToStorage(this.key);
     }
     ```
     *State data is persisted to `chrome.storage.local` under the key `'workflowStates'`.*

4. **Workflow Completion & Log persistence**:
   * File path: `automa/src/workflowEngine/WorkflowEngine.js` (lines 522, 585–620)
     ```javascript
     await this.states.delete(this.id);
     // ...
     await this.logger.add({
       detail: { ... },
       history: { ... },
       ctxData: { ... },
       data: {
         logId: this.id,
         data: {
           table: [...this.referenceData.table],
           variables: { ...this.referenceData.variables },
         },
       },
     });
     ```
     *Upon completion or failure, the state is deleted from `chrome.storage.local`, and execution logs, collected tables, and final variables are written to the IndexedDB database.*

5. **Log Database Schema**:
   * File path: `automa/src/db/logs.js` (lines 3–9)
     ```javascript
     const dbLogs = new Dexie('logs');
     dbLogs.version(1).stores({
       ctxData: '++id, logId',
       logsData: '++id, logId',
       histories: '++id, logId',
       items: '++id, name, endedAt, workflowId, status, collectionId',
     });
     ```
     *Outputs are saved under the `logs` IndexedDB.*

---

## 2. Logic Chain

Based on these observations, the core mechanism of `automa-cli` should be:
1. Launch Chromium via Puppeteer with the Automa extension loaded.
2. Retrieve the Extension ID dynamically.
3. Open an extension page (e.g., `chrome-extension://<id>/newtab.html`) to access `chrome.runtime` APIs and IndexedDB.
4. Execute `chrome.runtime.sendMessage` to trigger the `'workflow:execute'` message listener.
5. Poll `chrome.storage.local` for execution completeness.
6. Retrieve execution results (variables, table data, success status) directly from Dexie IndexedDB `'logs'`.

---

## 3. Caveats

- We assume Puppeteer runs on a machine with a GUI or configured virtual framebuffer (xvfb on Linux) since extensions are not supported in Puppeteer's native headless mode (`headless: true` before v112) and require `headless: 'new'` or `headless: false`.
- The CLI depends on Chrome Extension APIs. Bypassing them entirely is not feasible, so Puppeteer is the optimal mechanism.

---

## 4. The 4 Risks & Technical Solutions

### Risk 1: MV3 Service Worker sleep issue
* **Problem**: MV3 background service workers go to sleep after 30 seconds of inactivity. If a workflow runs long-running blocks (e.g., delays or HTTP requests), the worker shuts down, potentially disconnecting message routing.
* **Solution**: Keep the Automa dashboard (`chrome-extension://<extension-id>/newtab.html`) open as an active tab in the Puppeteer browser. The presence of an open extension page tab keeps the extension process alive and prevents the Service Worker from sleeping.

### Risk 2: Default tab behavior of Chrome under Puppeteer
* **Problem**: Puppeteer starts with a default blank tab (`about:blank` or `chrome://newtab/`). Automa requires a valid active tab with a `tabId` to run content scripts and interact. Executing scripting blocks on `chrome://` or `about:blank` throws access errors.
* **Solution**: Before executing the workflow, open a valid web page (e.g. `https://example.com` or `http://localhost`) in a new tab. Query `chrome.tabs.query({ active: true })` inside the extension dashboard context to retrieve its `tabId`, and pass it explicitly in the execution options: `{ options: { tabId } }`.

### Risk 3: Initialization latency of background listeners
* **Problem**: When the browser launches, the extension's background script takes up to a few hundred milliseconds to fully initialize and register its `browser.runtime.onMessage` listeners. Messages sent instantly will fail.
* **Solution**: Implement a retry-backoff connection wrapper. The CLI will repeatedly send a ping message (like `{ type: 'get:sender' }`) every 100ms and proceed only after receiving a successful response.

### Risk 4: Bypassing/blocking popup.html and params.html
* **Problem**: Workflows with parameters automatically open `params.html` in a popup window to ask for user input. Also, starting workflows via browser actions opens `popup.html`.
* **Solution**:
  1. Trigger `'workflow:execute'` directly via `chrome.runtime.sendMessage` from the dashboard tab, bypassing `popup.html` completely.
  2. Pass `checkParams: false` inside the execution options to prevent the engine from creating the `params.html` popup.
  3. Inject runtime parameter values programmatically via `options.variables` and `options.data.variables`.

---

## 5. Proposed Design for `automa-cli`

### CLI Usage Interface
```bash
automa-cli run <workflow-path.json> \
  --variables '{"username": "admin", "password": "123"}' \
  --url "https://example.com" \
  --headless \
  --output ./output.json
```

### Core Execution Logic (Pseudo-code)

```javascript
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function runWorkflow(workflowPath, options) {
  const extensionPath = path.resolve(options.extensionPath);
  const workflowData = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

  // 1. Launch Puppeteer with extension
  const browser = await puppeteer.launch({
    headless: options.headless ? 'new' : false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
    ]
  });

  try {
    // 2. Find Extension ID
    const targets = await browser.targets();
    const extensionTarget = targets.find(t => t.url().startsWith('chrome-extension://'));
    if (!extensionTarget) throw new Error("Extension not loaded.");
    const extensionId = extensionTarget.url().split('/')[2];

    // 3. Open dashboard tab (prevents service worker sleep and acts as extension context)
    const dashboardPage = await browser.newPage();
    await dashboardPage.goto(`chrome-extension://${extensionId}/newtab.html`);

    // 4. Open target webpage for the workflow
    const targetPage = await browser.newPage();
    await targetPage.goto(options.url || 'https://example.com');

    // Close any default blank pages
    const pages = await browser.pages();
    for (const page of pages) {
      if (page.url() === 'about:blank') await page.close();
    }

    // 5. Initialize and trigger workflow from extension dashboard page context
    const stateId = await dashboardPage.evaluate(async (workflow, variables, targetUrl) => {
      // Retry-backoff for initialization
      const waitForExtension = async () => {
        for (let i = 0; i < 50; i++) {
          try {
            await chrome.runtime.sendMessage({ type: 'get:sender' });
            return;
          } catch {
            await new Promise(r => setTimeout(r, 100));
          }
        }
        throw new Error("Automa background script failed to respond.");
      };
      await waitForExtension();

      // Retrieve Tab ID of our target web page
      const tabs = await chrome.tabs.query({ url: targetUrl });
      const tabId = tabs[0]?.id || null;

      // Prepare execution options to bypass params.html
      const execOptions = {
        tabId,
        checkParams: false,
        variables: variables,
        data: {
          variables: variables
        }
      };

      const beforeKeys = Object.keys(await chrome.storage.local.get('workflowStates') || {});

      // Execute
      chrome.runtime.sendMessage({
        type: 'workflow:execute',
        data: workflow,
        options: execOptions
      });

      // Retrieve stateId of execution
      for (let i = 0; i < 50; i++) {
        const { workflowStates } = await chrome.storage.local.get('workflowStates') || {};
        const activeStates = workflowStates || [];
        const newState = activeStates.find(s => !beforeKeys.includes(s.id) && s.workflowId === workflow.id);
        if (newState) return newState.id;
        await new Promise(r => setTimeout(r, 100));
      }
      throw new Error("Workflow failed to register execution state.");
    }, workflowData, options.variables || {}, targetPage.url());

    // 6. Poll for completion
    let completed = false;
    while (!completed) {
      completed = await dashboardPage.evaluate(async (id) => {
        const { workflowStates } = await chrome.storage.local.get('workflowStates') || {};
        const activeStates = workflowStates || [];
        return !activeStates.some(s => s.id === id);
      }, stateId);
      if (!completed) await new Promise(r => setTimeout(r, 1000));
    }

    // 7. Extract execution logs, variables and collected tables from Dexie IndexedDB
    const output = await dashboardPage.evaluate(async (id) => {
      const db = new Dexie('logs');
      db.version(1).stores({
        ctxData: '++id, logId',
        logsData: '++id, logId',
        histories: '++id, logId',
        items: '++id, name, endedAt, workflowId, status, collectionId',
      });
      const logItem = await db.items.get(id);
      const logData = await db.logsData.where('logId').equals(id).first();
      return {
        status: logItem?.status || 'unknown',
        error: logItem?.message || null,
        duration: logItem ? (logItem.endedAt - logItem.startedAt) : 0,
        table: logData?.data?.table || [],
        variables: logData?.data?.variables || {},
      };
    }, stateId);

    // 8. Output results
    if (options.outputPath) {
      fs.writeFileSync(options.outputPath, JSON.stringify(output, null, 2));
    }
    return output;

  } finally {
    await browser.close();
  }
}
```

---

## 6. Verification Method

To verify the proposed implementation details:
1. **Offscreen routing**: Open `automa/src/background/BackgroundWorkflowUtils.js` and trace the `executeWorkflow()` function. Observe that it sends a `'workflow:execute'` message on line 133 to `BackgroundOffscreen.instance`.
2. **State Storage**: Run any workflow, open DevTools on the extension dashboard (`newtab.html`), go to the Application tab -> Local Storage, and observe the `workflowStates` key while the workflow is running.
3. **Logs/Dexie**: Open DevTools on `newtab.html`, go to Console, and run:
   ```javascript
   const db = new Dexie('logs');
   db.version(1).stores({
     ctxData: '++id, logId',
     logsData: '++id, logId',
     histories: '++id, logId',
     items: '++id, name, endedAt, workflowId, status, collectionId',
   });
   db.items.toArray().then(console.log);
   ```
   Confirm that all workflow logs, table rows, and final variables are successfully retrieved.
