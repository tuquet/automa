const path = require('path');
const fs = require('fs');
const os = require('os');
const puppeteer = require('puppeteer');

/**
 * Runs an Automa workflow using Puppeteer and the Automa extension.
 * 
 * @param {string} workflowPath - Path to the workflow JSON file.
 * @param {object} options - Options for running the workflow.
 * @param {string} [options.extensionPath] - Path to the Automa extension build.
 * @param {object} [options.variables] - Variables to inject into the workflow.
 * @param {number} [options.timeout=60000] - Execution timeout in ms.
 * @param {object} [options.puppeteerOptions] - Extra options for Puppeteer launch.
 * @param {function} [options.onBrowserCreated] - Callback invoked with the browser instance right after launch.
 * @returns {Promise<object>} The execution logs retrieved from IndexedDB.
 */
async function runWorkflow(workflowPath, options = {}) {
  const extensionPath = options.extensionPath || path.resolve(__dirname, '../../automa/build');
  const variables = options.variables || {};
  const timeout = options.timeout || 60000;
  const puppeteerOptions = options.puppeteerOptions || {};

  if (!fs.existsSync(extensionPath)) {
    throw new Error(`Automa extension build directory not found at: ${extensionPath}`);
  }
  if (!fs.existsSync(workflowPath)) {
    throw new Error(`Workflow JSON file not found at: ${workflowPath}`);
  }

  const workflowData = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

  // Ensure workflow has an ID
  if (!workflowData.id) {
    workflowData.id = 'cli-workflow-' + Date.now();
  }
  const workflowId = workflowData.id;

  // Auto-detect browser path on Windows if not specified in puppeteerOptions (prioritize Edge then Chrome)
  let executablePath = puppeteerOptions.executablePath;
  if (!executablePath && process.platform === 'win32') {
    const commonPaths = [
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    ];
    for (const p of commonPaths) {
      if (fs.existsSync(p)) {
        executablePath = p;
        break;
      }
    }
  }

  // Create temporary profile directory for Chrome isolation
  const tempUserDir = fs.mkdtempSync(path.join(os.tmpdir(), 'automa-profile-'));

  console.log(`Launching Puppeteer browser with Automa extension from: ${extensionPath}`);
  
  const browser = await puppeteer.launch({
    headless: 'shell', // Default to headless shell to support extensions in CI/displayless envs
    defaultViewport: null,
    executablePath,
    ignoreDefaultArgs: ['--disable-extensions', '--disable-component-extensions-with-background-pages'],
    ...puppeteerOptions,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      `--user-data-dir=${tempUserDir}`,
      ...(puppeteerOptions.args || [])
    ]
  });

  // Call browser hook if provided
  if (options.onBrowserCreated) {
    await options.onBrowserCreated(browser);
  }

  let extensionId = null;
  let extensionPage = null;

  try {
    console.log("Detecting Extension ID...");
    // Poll for the extension target
    const maxTargetPolls = 20;
    for (let i = 0; i < maxTargetPolls; i++) {
      const targets = browser.targets();
      console.log(`Poll ${i + 1}: Found targets:`, targets.map(t => `${t.type()} (${t.url()})`));
      const target = targets.find(t => {
        const url = t.url();
        return url.startsWith('chrome-extension://') && 
               (url.includes('background.bundle.js') || url.includes('service_worker.js') || url.includes('newtab.html') || url.includes('popup.html') || url.includes('offscreen.html'));
      });
      if (target) {
        const url = target.url();
        const match = url.match(/chrome-extension:\/\/([a-p]{32})/);
        if (match) {
          extensionId = match[1];
          break;
        }
      }
      await new Promise(r => setTimeout(r, 500));
    }

    if (!extensionId) {
      throw new Error("Failed to detect Automa extension ID from targets.");
    }
    console.log(`Detected Extension ID: ${extensionId}`);

    // Replace static 2-second sleep with dynamic page polling loop
    console.log("Polling for automatically opened extension welcome page...");
    const maxPagePolls = 15;
    for (let i = 0; i < maxPagePolls; i++) {
      const pages = await browser.pages();
      extensionPage = pages.find(p => p.url().includes(`chrome-extension://${extensionId}/`));
      if (extensionPage) {
        break;
      }
      await new Promise(r => setTimeout(r, 200));
    }

    if (extensionPage) {
      console.log(`Reusing automatically opened extension page: ${extensionPage.url()}`);
    } else {
      console.log("Opening extension dashboard (newtab.html)...");
      extensionPage = await browser.newPage();
      await extensionPage.goto(`chrome-extension://${extensionId}/newtab.html`, { waitUntil: 'domcontentloaded' });
    }

    // Close any other non-extension pages to clean up
    console.log("Closing default blank tabs...");
    pages = await browser.pages();
    for (const page of pages) {
      if (page.url() === 'about:blank' || page.url().includes('new-tab-page')) {
        await page.close().catch(() => {});
      }
    }

    // Handshake: poll get:sender to ensure background script is ready
    console.log("Performing handshake with background service worker...");
    const maxHandshakePolls = 30;
    let handshakeSuccess = false;
    for (let i = 0; i < maxHandshakePolls; i++) {
      try {
        const handshakeResult = await extensionPage.evaluate(async () => {
          try {
            const sendPromise = (async () => {
              // Try promise-based browser.runtime.sendMessage first
              if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.sendMessage) {
                const res = await browser.runtime.sendMessage({
                  name: 'background--get:sender',
                  data: {}
                });
                return { success: !!res, type: 'browser' };
              }
              // Fallback to callback-based chrome.runtime.sendMessage
              if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                const res = await new Promise((resolve) => {
                  chrome.runtime.sendMessage({
                    name: 'background--get:sender',
                    data: {}
                  }, (res) => {
                    const err = chrome.runtime.lastError;
                    resolve(err ? { error: err.message } : { success: !!res });
                  });
                });
                return { ...res, type: 'chrome' };
              }
              return { success: false, error: 'No messaging API found' };
            })();

            // Enforce a 1500ms timeout using Promise.race
            return await Promise.race([
              sendPromise,
              new Promise((resolve) => setTimeout(() => resolve({ success: false, error: 'Handshake message timeout' }), 1500))
            ]);
          } catch (e) {
            return { success: false, error: e.message };
          }
        });
        console.log(`Handshake poll ${i + 1} result:`, handshakeResult);
        if (handshakeResult.success) {
          handshakeSuccess = true;
          break;
        }
      } catch (err) {
        console.error(`Handshake poll ${i + 1} evaluate threw error:`, err.message);
      }
      await new Promise(r => setTimeout(r, 500));
    }

    if (!handshakeSuccess) {
      throw new Error("Handshake with background service worker timed out.");
    }
    console.log("Handshake successful. Background service worker is ready.");

    // Execute the workflow
    console.log("Dispatching workflow execution command...");
    const startTime = Date.now();

    await extensionPage.evaluate(async (wData, vars) => {
      const executeOptions = {
        checkParams: false,
        checkParam: false,
        data: {
          variables: vars
        }
      };

      const payload = {
        name: 'background--workflow:execute',
        data: {
          ...wData,
          options: executeOptions
        }
      };

      if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.sendMessage) {
        await browser.runtime.sendMessage(payload);
        return;
      }

      await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(payload, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
    }, workflowData, variables);

    console.log("Workflow execute command dispatched. Polling execution state...");

    // Poll storage for active state and IndexedDB for completed log
    const pollInterval = 1000;
    const maxPolls = Math.ceil(timeout / pollInterval);
    let executionId = null;
    let started = false;
    let runResult = null;

    for (let poll = 0; poll < maxPolls; poll++) {
      // 1. Check active states in chrome.storage.local
      const activeStates = await extensionPage.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.local.get('workflowStates', (result) => {
            resolve(result.workflowStates || []);
          });
        });
      });

      const matchedState = activeStates.find(s => s.workflowId === workflowId);

      if (matchedState) {
        started = true;
        executionId = matchedState.id;
        console.log(`Workflow running. Active state ID: ${executionId}, current block:`, matchedState.state?.currentBlock);
      } else {
        // If it was running and now it's gone, or if we want to check logs
        console.log("Checking IndexedDB for execution logs...");
        const logData = await extensionPage.evaluate((wId, execId, startTs) => {
          return new Promise((resolve) => {
            const timeout = setTimeout(() => {
              resolve(null);
            }, 1000);

            try {
              const request = indexedDB.open('logs');
              
              request.onblocked = () => {
                clearTimeout(timeout);
                resolve(null);
              };
              
              request.onerror = () => {
                clearTimeout(timeout);
                resolve(null);
              };
              
              request.onsuccess = (event) => {
                clearTimeout(timeout);
                const db = event.target.result;
                
                // Verify that the object stores exist to prevent version lock/blocked upgrade
                if (!db.objectStoreNames.contains('items') || !db.objectStoreNames.contains('logsData')) {
                  db.close();
                  resolve(null);
                  return;
                }
                
                try {
                  const transaction = db.transaction(['items', 'logsData'], 'readonly');
                  const itemsStore = transaction.objectStore('items');
                  const logsDataStore = transaction.objectStore('logsData');
                  
                  const itemsRequest = itemsStore.getAll();
                  const logsDataRequest = logsDataStore.getAll();
                  
                  transaction.oncomplete = () => {
                    const items = itemsRequest.result || [];
                    const logsData = logsDataRequest.result || [];
                    
                    // Find log by executionId or workflowId with matching start time
                    const logItem = items.find(item => {
                      if (execId) return item.id === execId;
                      return item.workflowId === wId && item.startedAt >= startTs;
                    });
                    
                    if (!logItem) {
                      db.close();
                      resolve(null);
                      return;
                    }
                    
                    const dataItem = logsData.find(d => d.logId === logItem.id);
                    db.close();
                    resolve({
                      log: logItem,
                      data: dataItem ? dataItem.data : null
                    });
                  };
                  
                  transaction.onerror = () => {
                    db.close();
                    resolve(null);
                  };
                  
                  transaction.onabort = () => {
                    db.close();
                    resolve(null);
                  };
                } catch (e) {
                  db.close();
                  resolve(null);
                }
              };
            } catch (e) {
              clearTimeout(timeout);
              resolve(null);
            }
          });
        }, workflowId, executionId, startTime);

        if (logData) {
          console.log(`Execution logs found! Status: ${logData.log.status}`);
          runResult = logData;
          break;
        }

        if (started) {
          console.log("Workflow state cleared, waiting for logs to be written...");
        }
      }

      await new Promise(r => setTimeout(r, pollInterval));
    }

    if (!runResult) {
      throw new Error(`Workflow execution timed out or failed to produce logs within ${timeout}ms.`);
    }

    return runResult;

  } finally {
    console.log("Tearing down: closing browser...");
    await browser.close().catch(() => {});
    try {
      if (tempUserDir && fs.existsSync(tempUserDir)) {
        // Wait a tiny moment for Chrome processes to completely release lock files
        await new Promise(r => setTimeout(r, 1000));
        fs.rmSync(tempUserDir, { recursive: true, force: true });
      }
    } catch (e) {
      console.warn("Failed to clean up temporary profile directory:", e.message);
    }
  }
}

module.exports = {
  runWorkflow
};
