const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const { runWorkflow } = require('../../automa-cli/lib/runner');

async function testSW() {
  console.log("=== DEBUG AUTOMA CLI SERVICE WORKER ===");

  const extensionPath = path.resolve(__dirname, '../../automa/build');
  const tempUserDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'automa-sw-profile-'));

  let executablePath = null;
  const commonPaths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  ];
  for (const p of commonPaths) {
    if (fs.existsSync(p)) {
      executablePath = p;
      break;
    }
  }

  const browser = await puppeteer.launch({
    headless: 'shell',
    defaultViewport: null,
    executablePath,
    ignoreDefaultArgs: ['--disable-extensions', '--disable-component-extensions-with-background-pages'],
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      `--user-data-dir=${tempUserDir}`
    ]
  });

  try {
    // Wait for service worker target
    console.log("Waiting for service worker target...");
    let swTarget = null;
    for (let i = 0; i < 20; i++) {
      const targets = browser.targets();
      swTarget = targets.find(t => t.type() === 'service_worker' && t.url().includes('ailjcckpkilelkklimdnaleonhikmcha'));
      if (swTarget) break;
      await new Promise(r => setTimeout(r, 500));
    }

    if (!swTarget) {
      throw new Error("Service worker target not found!");
    }

    console.log("Service worker target found:", swTarget.url());
    const worker = await swTarget.worker();
    console.log("Worker obtained successfully.");

    // Evaluate chrome.offscreen and other stuff
    const diag = await worker.evaluate(async () => {
      const results = {};
      results.chrome_offscreen_exists = typeof chrome.offscreen !== 'undefined';
      results.chrome_runtime_getContexts_exists = typeof chrome.runtime.getContexts !== 'undefined';
      
      if (results.chrome_runtime_getContexts_exists) {
        try {
          const contexts = await chrome.runtime.getContexts({
            contextTypes: ['OFFSCREEN_DOCUMENT']
          });
          results.contexts = contexts.map(c => ({ id: c.id, url: c.documentUrl }));
        } catch (e) {
          results.contexts_error = e.message;
        }
      }

      // Try creating offscreen doc directly
      try {
        const OFFSCREEN_URL = chrome.runtime.getURL('/offscreen.html');
        results.offscreen_url = OFFSCREEN_URL;
        
        await chrome.offscreen.createDocument({
          url: OFFSCREEN_URL,
          reasons: ['BLOBS', 'CLIPBOARD', 'IFRAME_SCRIPTING'],
          justification: 'Debug testing'
        });
        results.create_status = "success";
      } catch (e) {
        results.create_error = e.message;
      }

      // Check contexts again
      if (results.chrome_runtime_getContexts_exists) {
        try {
          const contextsAfter = await chrome.runtime.getContexts({
            contextTypes: ['OFFSCREEN_DOCUMENT']
          });
          results.contexts_after = contextsAfter.map(c => ({ id: c.id, url: c.documentUrl }));
        } catch (e) {
          results.contexts_after_error = e.message;
        }
      }

      return results;
    });

    console.log("DIAGNOSTICS:", JSON.stringify(diag, null, 2));

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await browser.close().catch(() => {});
    fs.rmSync(tempUserDir, { recursive: true, force: true });
  }
}

testSW();
