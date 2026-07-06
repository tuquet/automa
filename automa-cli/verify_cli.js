const path = require('path');
const fs = require('fs');
const { runWorkflow } = require('./lib/runner');

async function testVerification() {
  console.log("=== AUTOMA CLI VERIFICATION TEST ===");

  const testHtmlPath = path.resolve(__dirname, 'test.html');
  const testHtmlUrl = `file:///${testHtmlPath.replace(/\\/g, '/')}`;
  console.log(`Local test page URL: ${testHtmlUrl}`);

  // Load and compile the sample workflow
  const sampleWorkflowPath = path.resolve(__dirname, 'sample_workflow.json');
  const tempWorkflowPath = path.resolve(__dirname, 'temp_workflow.json');

  if (!fs.existsSync(sampleWorkflowPath)) {
    console.error("Error: sample_workflow.json not found!");
    process.exit(1);
  }

  const sampleWorkflowContent = fs.readFileSync(sampleWorkflowPath, 'utf8');
  const compiledWorkflow = sampleWorkflowContent.replace(/\{\{TEST_HTML_URL\}\}/g, testHtmlUrl);
  fs.writeFileSync(tempWorkflowPath, compiledWorkflow, 'utf8');

  let popupOrParamsOpened = false;

  try {
    const result = await runWorkflow(tempWorkflowPath, {
      variables: {
        injected_var: "injected_val"
      },
      timeout: 30000,
      onBrowserCreated: (browser) => {
        // Hook targetcreated listener to assert popup.html or params.html are NEVER rendered
        browser.on('targetcreated', (target) => {
          const url = target.url();
          console.log(`[Target Created] ${url}`);
          if (url.includes('popup.html') || url.includes('params.html')) {
            console.error(`[VIOLATION] Rendered forbidden UI target: ${url}`);
            popupOrParamsOpened = true;
          }
        });
      }
    });

    console.log("=== EXECUTION RESULT ANALYSIS ===");
    console.log("Log ID:", result.log.id);
    console.log("Status:", result.log.status);
    console.log("Variables:", result.data ? result.data.variables : {});

    // Assertions
    if (popupOrParamsOpened) {
      throw new Error("Assertion failed: popup.html or params.html was opened during workflow execution.");
    }

    if (result.log.status !== 'success') {
      throw new Error(`Assertion failed: Expected status to be 'success', but got '${result.log.status}'. Message: ${result.log.message}`);
    }

    if (!result.data || !result.data.variables) {
      throw new Error("Assertion failed: Execution data or variables were not recorded.");
    }

    const { cli_tested, injected_var } = result.data.variables;
    if (cli_tested !== 'success') {
      throw new Error(`Assertion failed: Expected cli_tested variable to be 'success', but got '${cli_tested}'`);
    }

    if (injected_var !== 'injected_val') {
      throw new Error(`Assertion failed: Expected injected_var to be 'injected_val', but got '${injected_var}'`);
    }

    console.log("\n[SUCCESS] Verification passed! All assertions met perfectly.");
    process.exit(0);

  } catch (err) {
    console.error("\n[FAILURE] Verification failed:", err.message);
    process.exit(1);
  } finally {
    // Clean up temporary workflow file
    if (fs.existsSync(tempWorkflowPath)) {
      fs.unlinkSync(tempWorkflowPath);
    }
  }
}

testVerification();
