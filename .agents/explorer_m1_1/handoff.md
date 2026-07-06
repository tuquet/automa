# Handoff Report: Automa Codebase Investigation & CLI Design

## 1. Observation

During the read-only investigation of the Automa codebase (`c:\Repository\automa-ecosystem\automa`), the following behaviors, file paths, and code snippets were observed:

### A. Workflow Triggering and Execution Delegation
* **Message Listeners in Service Worker**: In `src/background/index.js`, the background service worker handles messages through a custom `MessageListener` class. At lines 155-165, the `'workflow:execute'` message is handled:
  ```javascript
  message.on('workflow:execute', async (workflowData, sender) => {
    if (workflowData.includeTabId) {
      if (!workflowData.options) workflowData.options = {};
      workflowData.options.tabId = sender.tab.id;
    }

    BackgroundWorkflowUtils.instance.executeWorkflow(
      workflowData,
      workflowData?.options || {}
    );
  });
  ```
* **Offscreen Document Redirection**: In `src/background/BackgroundWorkflowUtils.js`, execution is redirected to an offscreen document on Chrome (MV3):
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
* **Offscreen Setup**: In `src/background/BackgroundOffscreen.js` (lines 44-52), the offscreen document is registered:
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
* **Offscreen Receiver**: In `src/offscreen/message-listener.js` (lines 9-11), the message runs the workflow:
  ```javascript
  messageListener.on('workflow:execute', ({ workflow, options }) => {
    WorkflowManager.instance.execute(workflow, options);
  });
  ```

### B. Execution State Storage & Logging
* **State Storage**: In `src/workflowEngine/WorkflowManager.js`, `WorkflowState` uses `chrome.storage.local` to store states under the `'workflowStates'` key:
  ```javascript
  const workflowStateStorage = {
    get() {
      return BrowserAPIService.storage.local
        .get('workflowStates')
        .then(({ workflowStates }) => workflowStates || []);
    },
    set(key, value) {
      const states = Object.values(value);

      return BrowserAPIService.storage.local.set({ workflowStates: states });
    },
  };
  ```
* **State Add/Delete**:
  * In `src/workflowEngine/WorkflowEngine.js` line 336: `await this.states.add(this.id, { ... })` is called when execution begins.
  * In `src/workflowEngine/WorkflowEngine.js` line 522: `await this.states.delete(this.id)` is called when execution finishes or fails.
* **Logs & Data**: When the workflow completes, `WorkflowLogger` (defined in `src/workflowEngine/WorkflowLogger.js`) writes details to Dexie IndexedDB databases. In `src/db/logs.js` (lines 3-9):
  ```javascript
  const dbLogs = new Dexie('logs');
  dbLogs.version(1).stores({
    ctxData: '++id, logId',
    logsData: '++id, logId',
    histories: '++id, logId',
    items: '++id, name, endedAt, workflowId, status, collectionId',
  });
  ```

### C. Parameter Popup (`params.html`) Triggering
* In `src/workflowEngine/WorkflowEngine.js` lines 158-161, parameter popup conditions are checked:
  ```javascript
  const checkParams = this.options?.checkParams ?? true;
  const hasParams =
    checkParams && triggerBlock.data?.parameters?.length > 0;
  if (hasParams) { ... }
  ```
  If `hasParams` is true, the engine creates a popup window showing `params.html`.

### D. Welcome Page Tab
* In `src/background/BackgroundEventsListeners.js` lines 135-151, a popup is created showing `newtab.html#/welcome` upon fresh extension installation:
  ```javascript
  if (reason === 'install') {
    await browser.storage.local.set({
      logs: [],
      shortcuts: {},
      workflows: [],
      collections: [],
      workflowState: {},
      isFirstTime: true,
      visitWebTriggers: [],
    });
    await browser.windows.create({
      type: 'popup',
      state: 'maximized',
      url: browser.runtime.getURL('newtab.html#/welcome'),
    });
    return;
  }
  ```

---

## 2. Logic Chain

From these observations, we establish the following logic:

1. **MV3 Service Worker Sleep**:
   * *Observation*: Chrome terminates extension service workers after 30 seconds of inactivity.
   * *Logic*: An extension page running in a tab has a persistent DOM window context and does not sleep. If we open the Automa dashboard/newtab page (`chrome-extension://<id>/newtab.html`) in a browser tab immediately upon Puppeteer launch, and keep it open, the extension context remains active and keeps the Service Worker awake or easily responsive.
2. **Default Tab**:
   * *Observation*: Puppeteer opens a default blank page (`about:blank`) on launch.
   * *Logic*: The CLI can capture this default tab using `await browser.pages()`, navigate it to the Automa dashboard page, and reuse it for establishing a keep-alive connection, extracting the extension ID, and evaluating messages.
3. **Initialization Latency**:
   * *Observation*: The service worker takes time to boot up and register `browser.runtime.onMessage.addListener`.
   * *Logic*: We can implement a handshake in the CLI by sending a lightweight message (such as `{ name: 'background--get:sender', data: {} }`) in a retry loop (every 100ms) to the background script. A successful response confirms the listener is fully initialized.
4. **Bypassing params.html and popup/welcome screens**:
   * *Observation*: If `checkParams` in `options` is false, `hasParams` is false, and the parameter popup window is bypassed. If `reason === 'install'`, `newtab.html#/welcome` is opened in a popup window.
   * *Logic*: We can pass `checkParams: false` inside the execution options. To feed the parameters, we pass them as variables inside `options.data.variables`. To handle the welcome popup, we can either set `isFirstTime: false` in `chrome.storage.local` prior to launch, or use Puppeteer's `targetcreated` event listener to catch and close any tab/window navigating to `newtab.html#/welcome`.

---

## 3. Caveats

* **Chrome Headless Mode**: Modern Chrome Extensions require either headful execution (`headless: false`) or Chrome's new headless mode (`headless: 'new'` or `--headless=new` in newer Chrome versions). Traditional headless mode (`headless: true`) blocks extensions entirely.
* **Sandbox & Worker Context**: Since the workflow executes inside the offscreen document and IndexedDB logs are sandboxed to the extension origin, Puppeteer cannot query the Dexie IndexedDB databases directly from the Node.js context. Instead, the CLI must execute queries *inside* the extension page context (e.g. evaluating Dexie database scripts in the `newtab.html` tab).

---

## 4. Conclusion: Proposed `automa-cli` Architecture

The proposed design for the `automa-cli` package is structured as follows:

```
automa-cli/
├── bin/
│   └── cli.js            # CLI Entrypoint (yargs or commander)
├── lib/
│   ├── runner.js         # Core Puppeteer launcher and orchestrator
│   └── db-helper.js      # Scripts evaluated in page context to extract Dexie logs
├── package.json
└── README.md
```

### CLI Command Options
```bash
automa-cli run <workflow-path> --variables <variables-json-path> --headless <boolean> --output <output-path>
```

### Sequence Flow of execution:
1. **Initialize CLI**: Load workflow JSON and input variables.
2. **Launch Puppeteer**:
   ```javascript
   const browser = await puppeteer.launch({
     headless: headlessOpt ? 'new' : false,
     args: [
       `--disable-extensions-except=${pathToAutomaExtension}`,
       `--load-extension=${pathToAutomaExtension}`,
     ],
   });
   ```
3. **Intercept and Close Welcome Popups**:
   ```javascript
   browser.on('targetcreated', async (target) => {
     if (target.url().includes('newtab.html#/welcome')) {
       const page = await target.page();
       if (page) await page.close();
     }
   });
   ```
4. **Get Default Tab & Keep-Alive**:
   * Retrieve the first default tab: `const [extensionTab] = await browser.pages();`
   * Navigate it to: `chrome-extension://<id>/newtab.html`. The extension ID can be retrieved by looking at the extension targets.
   * Keep this tab open throughout the run.
5. **Handshake Verification**:
   * Evaluate runtime message polling in `extensionTab` until `background--get:sender` succeeds:
     ```javascript
     async function waitReady() {
       while (true) {
         try {
           const res = await chrome.runtime.sendMessage({ name: 'background--get:sender', data: {} });
           if (res) break;
         } catch (e) {
           await new Promise(r => setTimeout(r, 100));
         }
       }
     }
     ```
6. **Trigger Execution (Bypassing params.html)**:
   * Evaluate a trigger script in the extension page:
     ```javascript
     chrome.runtime.sendMessage({
       name: 'background--workflow:execute',
       data: {
         ...workflowData,
         options: {
           checkParams: false,
           data: {
             variables: customVariables
           }
         }
       }
     });
     ```
7. **Monitor State**:
   * Periodically check `chrome.storage.local.get('workflowStates')` to extract the active run.
   * Identify our run's `stateId`.
   * Monitor its state. Wait until the `stateId` disappears from `workflowStates`.
8. **Extract Results & Output**:
   * Once execution terminates, evaluate a query in the `extensionTab` context to retrieve logs and output from the Dexie IndexedDB `logs` database:
     ```javascript
     const results = await extensionTab.evaluate(async (stateId) => {
       return new Promise((resolve) => {
         const request = indexedDB.open('logs');
         request.onsuccess = (e) => {
           const db = e.target.result;
           const tx = db.transaction(['items', 'logsData'], 'readonly');
           tx.objectStore('items').get(stateId).onsuccess = (itemEvent) => {
             const item = itemEvent.target.result;
             tx.objectStore('logsData').get(stateId).onsuccess = (dataEvent) => {
               const data = dataEvent.target.result;
               resolve({ status: item.status, message: item.message, output: data.data });
             };
           };
         };
       });
     }, stateId);
     ```
   * Save outputs/variables to the specified path and output success/error status to stdout.
9. **Teardown**: Close browser safely.

---

## 5. Verification Method

To verify the proposed design points and referenced code paths:

1. **Verify Offscreen Delegation**:
   * Inspect `automa/src/background/BackgroundWorkflowUtils.js` lines 124-137. Confirm it uses `BackgroundOffscreen.instance.sendMessage` when browser is Chrome.
   * Inspect `automa/src/offscreen/message-listener.js` lines 9-11. Confirm it triggers `WorkflowManager.instance.execute`.
2. **Verify Parameter Bypass**:
   * Inspect `automa/src/workflowEngine/WorkflowEngine.js` line 158. Confirm that `checkParams` is loaded from `this.options?.checkParams` and determines if `hasParams` is true.
3. **Verify Welcome Page Trigger**:
   * Inspect `automa/src/background/BackgroundEventsListeners.js` line 135. Confirm that `onRuntimeInstalled` triggers popup opening when `reason === 'install'`.
4. **Verify Storage and Logs Database**:
   * Inspect `automa/src/workflowEngine/WorkflowManager.js` lines 12-23 to verify the `'workflowStates'` storage getter/setter.
   * Inspect `automa/src/db/logs.js` to verify database schemas for logs.
