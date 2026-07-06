const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const { runWorkflow } = require('../../automa-cli/lib/runner');

async function testVerification() {
  console.log("=== DEBUG AUTOMA CLI VERIFICATION ===");

  const testHtmlPath = path.resolve(__dirname, '../../automa-cli/test.html');
  const testHtmlUrl = `file:///${testHtmlPath.replace(/\\/g, '/')}`;
  console.log(`Local test page URL: ${testHtmlUrl}`);

  const sampleWorkflowPath = path.resolve(__dirname, '../../automa-cli/sample_workflow.json');
  const tempWorkflowPath = path.resolve(__dirname, 'temp_workflow.json');

  const sampleWorkflowContent = fs.readFileSync(sampleWorkflowPath, 'utf8');
  const compiledWorkflow = sampleWorkflowContent.replace(/\{\{TEST_HTML_URL\}\}/g, testHtmlUrl);
  fs.writeFileSync(tempWorkflowPath, compiledWorkflow, 'utf8');

  try {
    const result = await runWorkflow(tempWorkflowPath, {
      variables: {
        injected_var: "injected_val"
      },
      timeout: 30000,
      puppeteerOptions: {
        headless: false, // Run headfully
        dumpio: true
      },
      onBrowserCreated: async (browser) => {
        browser.on('targetcreated', async (target) => {
          const url = target.url();
          console.log(`[Target Created] ${target.type()} - ${url}`);
          
          if (target.type() === 'service_worker') {
            try {
              const client = await target.createCDPSession();
              await client.send('Runtime.enable');
              client.on('Runtime.consoleAPICalled', (event) => {
                const argsText = event.args.map(arg => {
                  if (arg.value !== undefined) return JSON.stringify(arg.value);
                  if (arg.description !== undefined) return arg.description;
                  return JSON.stringify(arg);
                }).join(' ');
                console.log(`[ServiceWorker Console] ${argsText}`);
              });
              client.on('Runtime.exceptionThrown', (event) => {
                console.error(`[ServiceWorker Exception]`, JSON.stringify(event.exceptionDetails));
              });
            } catch (e) {
              console.log(`Error attaching to service_worker: ${e.message}`);
            }
          } else if (target.type() === 'page') {
            try {
              const page = await target.page();
              if (page) {
                page.on('console', msg => console.log(`[Browser Console] ${msg.text()}`));
                page.on('pageerror', err => console.log(`[Browser Page Error] ${err.toString()}`));
              }
            } catch (e) {
              console.log(`Error attaching console to page: ${e.message}`);
            }
          }
        });
      }
    });

    console.log("=== RESULT ===");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("[FAILURE]", err);
  } finally {
    if (fs.existsSync(tempWorkflowPath)) {
      fs.unlinkSync(tempWorkflowPath);
    }
  }
}

testVerification();
