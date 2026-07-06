# Handoff Report - Automa CLI Design & Codebase Investigation

## 1. Observation

During the read-only investigation of the `automa` codebase, the following files, line numbers, and code structures were observed:

### A. Workflow Triggering and Message Listeners Call Chain (Chrome / MV3)
1. **Background Script Entry Point**: In `automa/src/background/index.js` (lines 155-165, 1104), the extension registers a message listener:
   ```javascript
   message.on('workflow:execute', async (workflowData, sender) => {
     ...
     BackgroundWorkflowUtils.instance.executeWorkflow(
       workflowData,
       workflowData?.options || {}
     );
   });
   ...
   browser.runtime.onMessage.addListener(message.listener);
   ```
2. **Background Workflow Delegation**: In `automa/src/background/BackgroundWorkflowUtils.js` (lines 124-137), under Chrome (where `IS_FIREFOX` is false), the background script delegates execution to the offscreen document:
   ```javascript
   async executeWorkflow(workflowData, options) {
     if (workflowData.isDisabled) return;
     if (IS_FIREFOX) { ... }
     await BackgroundOffscreen.instance.sendMessage('workflow:execute', {
       workflow: workflowData,
       options,
     });
   }
   ```
3. **Offscreen Lifecycle Management**: In `automa/src/background/BackgroundOffscreen.js` (lines 44-52), the offscreen document is opened programmatically before sending messages:
   ```javascript
   await chrome.offscreen.createDocument({
     url: OFFSCREEN_URL,
     reasons: [
       chrome.offscreen.Reason.BLOBS,
       chrome.offscreen.Reason.CLIPBOARD,
       chrome.offscreen.Reason.IFRAME_SCRIPTING,
     ],
     justification: 'For running the workflow',
   });
   ```
4. **Offscreen Message Listener**: In `automa/src/offscreen/message-listener.js` (lines 9-11), the offscreen document listens for `'workflow:execute'` and invokes the `WorkflowManager`:
   ```javascript
   messageListener.on('workflow:execute', ({ workflow, options }) => {
     WorkflowManager.instance.execute(workflow, options);
   });
   ```
5. **Workflow Manager Execution**: In `automa/src/workflowEngine/WorkflowManager.js` (lines 50-63), the manager converts workflow data and instantiates `WorkflowEngine`:
   ```javascript
   const convertedWorkflow = convertWorkflowData(workflowData);
   const engine = new WorkflowEngine(convertedWorkflow, {
     options,
     states: this.#state,
     logger: this.#logger,
     blocksHandler: blocksHandler(),
   });
   engine.init();
   ```

### B. Execution State Storage and Tracking
1. **Live State Persistence**: In `automa/src/workflowEngine/WorkflowState.js` (lines 21-30), the state is saved to `chrome.storage.local` under the key `workflowStates` (defined in `WorkflowManager.js` lines 12-23) throttled by a 1000ms timeout:
   ```javascript
   _saveToStorage() {
     if (this.storageTimeout) return;
     this.storageTimeout = setTimeout(() => {
       this.storageTimeout = null;
       const states = Object.fromEntries(this.states);
       this.storage.set(this.key, states);
     }, 1000);
   }
   ```
2. **State Payload Structure**: In `automa/src/workflowEngine/WorkflowEngine.js` (lines 630-650), the running state object contains real-time worker block details, active tab IDs, and execution logs:
   ```javascript
   const state = {
     ...data,
     tabIds: [],
     currentBlock: [],
     name: this.workflow.name,
     logs: this.history,
     ctxData: {
       ctxData: this.historyCtxData,
       dataSnapshot: this.refDataSnapshots,
     },
     startedTimestamp: this.startedTimestamp,
   };
   this.workers.forEach((worker) => {
     const { id, label, startedAt } = worker.currentBlock;
     state.currentBlock.push({ id, name: label, startedAt });
     state.tabIds.push(worker.activeTab.id);
   });
   await this.states.update(this.id, { state });
   ```
3. **Execution Completion and Logging**: In `automa/src/workflowEngine/WorkflowEngine.js` (lines 582-605), upon workflow completion, results are logged using `WorkflowLogger`:
   ```javascript
   await this.logger.add({
     detail: {
       name,
       status,
       id: this.id, // the unique execution ID
       workflowId: id,
       endedAt: endedTimestamp,
       startedAt: this.startedTimestamp,
       ...
     },
     history: {
       logId: this.id,
       data: this.saveLog ? this.history : [],
     },
     ctxData: { ... }
   });
   ```
   Dexie IndexedDB database schemas are defined in `automa/src/db/logs.js` (lines 3-9):
   ```javascript
   const dbLogs = new Dexie('logs');
   dbLogs.version(1).stores({
     ctxData: '++id, logId',
     logsData: '++id, logId',
     histories: '++id, logId',
     items: '++id, name, endedAt, workflowId, status, collectionId',
   });
   ```

---

## 2. Logic Chain

Based on the direct codebase observations above, we deduce the following logic chain for designing `automa-cli` using Puppeteer:

1. **Service Worker and Execution Lifecycles**:
   - *Observation*: Chrome MV3 runs workflows inside the offscreen document (opened by `BackgroundOffscreen` during execution), but messages must transit through the Service Worker background script (`index.js`).
   - *Inference*: If Chrome is controlled headlessly by Puppeteer, inactivity can cause the Service Worker to go to sleep, which severs communication and stalls the offscreen document or listeners.
   - *Technical Solution*:
     - **Persistent Tab**: Open a persistent tab pointing to an extension page (e.g. `chrome-extension://<id>/newtab.html`). Tab pages have a persistent JS/DOM context that never sleeps.
     - **Service Worker Heartbeat**: Execute a periodic ping from the Puppeteer script (e.g., `chrome.runtime.sendMessage({ name: 'background--get:sender' })` or a lightweight `chrome` API call) every 20-25 seconds to reset Chrome's SW idle timer.
     - **Persistent Connection Port**: Open a runtime Connection Port (`chrome.runtime.connect`) between the persistent page and the Service Worker and transmit heartbeat packets.

2. **Puppeteer Default Browser Tab & Automa Content Scripts**:
   - *Observation*: Puppeteer opens a blank page (`about:blank`) on launch. Also, Automa opens `newtab.html#/welcome` in a maximized window on its first run.
   - *Inference*: Chrome security prohibits injection of content scripts (which handle webpage blocks in `automa/src/content/index.js`) into `about:blank` or `chrome://` URLs.
   - *Technical Solution*:
     - **Cleanup Window Proliferation**: Query and close the welcome window/tab programmatically upon launch.
     - **Pre-navigation to Injectable URLs**: Ensure the default tab navigates to a valid injectable HTTP/HTTPS URL (e.g. `https://example.com` or a local server) before initiating the workflow.
     - **Explicit Tab Routing**: Pass the Puppeteer-controlled active tab's Chrome ID (`tabId`) in the options argument of `executeWorkflow` to ensure Automa uses it rather than falling back to restricted default tabs.

3. **Background Script Initialization Latency**:
   - *Observation*: The extension background script must initialize storage and listeners on startup, which is asynchronous.
   - *Inference*: Sending a message to trigger a workflow immediately after launching Puppeteer will throw "Could not establish connection. Receiving end does not exist".
   - *Technical Solution*:
     - **Handshake Pattern**: Implement a polling retry loop inside the CLI. Send a ping message (like `background--get:sender`) every 100ms for up to 10 seconds. Proceed only once a successful response is received.

4. **Bypassing UI Popups (popup.html and params.html)**:
   - *Observation*:
     - `WorkflowEngine.js` (lines 158-161, 228-235) opens `params.html` in a popup window if the trigger block defines parameters and `options.checkParams` is true.
     - `handlerParameterPrompt.js` (lines 80-87, 119) opens `params.html` during execution when a Parameter Prompt block is encountered and awaits storage changes on `chrome.storage.local`.
   - *Inference*:
     - We can disable the initial parameters prompt by setting `checkParams: false` and providing parameters directly.
     - We can automate mid-execution Parameter Prompt blocks by monitoring the creation of `/params.html` pages and programmatically resolving the storage variables.
   - *Technical Solution*:
     - **Startup Parameters**: Call `executeWorkflow(workflow, { checkParams: false, data: { variables: { ...params } } })` to inject variables and skip the initial popup entirely.
     - **Runtime Prompts**: Use Puppeteer to listen for new targets (`targetcreated`). If a target contains `params.html`, attach to it, listen for the `workflow:params-block` runtime message (which contains the `promptId` and parameters), write the user-supplied values to `chrome.storage.local` with the key `${promptId}`, and close the tab.

---

## 3. Caveats

- **Network Constraints**: The investigation was conducted strictly in CODE_ONLY mode, so no external Puppeteer implementation libraries were downloaded or tested.
- **Chrome/MV3 Version Drift**: The SW lifetime policies are subject to Chromium updates. While the persistent tab and heartbeat methods work on current versions, future Chromium versions might enforce stricter limits.
- **Headless Mode Support**: Since Chrome 112+, standard headless mode supports extensions via `--headless=new` or `headless: true`. However, older Chrome versions will fail to load extensions in headless mode.

---

## 4. Conclusion

Designing an `automa-cli` package using Puppeteer is highly feasible without modifying the extension source code.
1. Workflows can be triggered by invoking `browser.runtime.sendMessage` with the `'background--workflow:execute'` message name.
2. Execution state can be monitored in real-time by polling `chrome.storage.local` for the `workflowStates` key.
3. Upon completion, full execution reports can be retrieved by executing a query on the Dexie IndexedDB `logs` database inside any extension page context.
4. The 4 identified risks are fully addressable through clean, external Puppeteer orchestration (SW heartbeats, target pre-navigation, ready handshakes, and storage-based parameter injections).

---

## 5. Verification Method

To verify these observations and suggestions:
1. **Source Code Inspection**: Inspect `automa/src/background/index.js` (line 155), `automa/src/workflowEngine/WorkflowEngine.js` (line 158), and `automa/src/workflowEngine/blocksHandler/handlerParameterPrompt.js` (line 119) to confirm the message events and storage listeners.
2. **Database Verification**: Check `automa/src/db/logs.js` to verify the IndexedDB store layout.
3. **Execution State Polling**: Verify that running `await chrome.storage.local.get('workflowStates')` returns the active state Map.
