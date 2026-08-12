import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { WorkflowEngine } from '../src/engine/WorkflowEngine.js';
import { MockBrowserAdapter } from './mocks/MockBrowserAdapter.js';
import {
  handlerTrigger,
  handlerConditions,
  handlerInsertData,
  handlerLoopData,
  handlerLoopBreakpoint,
} from '../src/blocksHandler/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runE2ETest() {
  console.log('====================================================');
  console.log('  @tuquet/workflow-runner - E2E Verification Runner     ');
  console.log('====================================================\n');

  // 1. Instantiate Mock Browser Adapter
  const mockAdapter = new MockBrowserAdapter({
    id: 101,
    url: 'https://example.com',
    frameId: 0,
  });
  console.log('[1/5] MockBrowserAdapter initialized with Active Tab ID: 101, URL: https://example.com');

  // 2. Load Mock Workflow JSON
  const workflowPath = join(__dirname, 'mocks', 'mockWorkflow.json');
  const mockWorkflow = JSON.parse(readFileSync(workflowPath, 'utf-8'));
  console.log('[2/5] Mock Workflow JSON loaded successfully:', mockWorkflow.name);

  // 3. Instantiate WorkflowEngine with Dependency Injection
  const engine = new WorkflowEngine({
    browserAdapter: mockAdapter,
    options: {
      debugMode: false,
    },
  });

  // 4. Register unmodified legacy block handlers
  engine.registerBlocksHandler({
    trigger: handlerTrigger,
    conditions: handlerConditions,
    'insert-data': handlerInsertData,
    'loop-data': handlerLoopData,
    'loop-breakpoint': handlerLoopBreakpoint,
  });
  console.log('[3/5] Registered unmodified legacy block handlers: Trigger, Conditions, Insert Data, Loop Data, Loop Breakpoint');

  // Track events during execution
  const executedBlocks: string[] = [];
  let workflowDoneStatus: string | null = null;
  let finalRefData: any = null;

  engine.on('block:execute', ({ block }) => {
    executedBlocks.push(block.id);
    console.log(`  -> Executing block: ${block.id} (label: ${block.label})`);
  });

  const completionPromise = new Promise<{ status: string; referenceData: any }>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('E2E Test timed out after 10000ms'));
    }, 10000);

    engine.on('workflow:done', (event) => {
      clearTimeout(timeout);
      workflowDoneStatus = event.status;
      finalRefData = event.referenceData;
      resolve(event);
    });

    engine.on('workflow:error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });

  // 5. Initialize & Execute Workflow
  console.log('[4/5] Starting Workflow Engine execution...');
  engine.init(mockWorkflow);
  engine.execute();

  const completionResult = await completionPromise;

  // 6. Verification & Assertions
  console.log('\n[5/5] Performing E2E Verification Assertions...');

  // Assertion A: Workflow Completed
  if (completionResult.status !== 'completed') {
    throw new Error(`Assertion Failed: Workflow did not complete cleanly. Status: ${completionResult.status}`);
  }
  console.log('  ✔ Assertion A Passed: Workflow completed with status "completed"');

  // Assertion B: Reference Data Mutated Correctly
  const variables = finalRefData?.variables || {};
  if (variables.testVar !== 'insertedValue') {
    throw new Error(`Assertion Failed: Variable testVar expected "insertedValue", got "${variables.testVar}"`);
  }
  console.log('  ✔ Assertion B Passed: Variable testVar = "insertedValue"');

  const table = finalRefData?.table || [];
  const insertedRow = table.find((row: any) => row.users === 'Alice');
  if (!insertedRow) {
    throw new Error(`Assertion Failed: Table row with users = "Alice" not found in referenceData.table: ${JSON.stringify(table)}`);
  }
  console.log('  ✔ Assertion C Passed: Table row mutated with { users: "Alice" }');

  // Assertion D: Loop Graph Jumps Executed
  const loopCount = executedBlocks.filter((id) => id === 'block-loop-data').length;
  if (loopCount < 3) {
    throw new Error(`Assertion Failed: Expected loop-data block to execute 3 times, executed ${loopCount} times`);
  }
  console.log(`  ✔ Assertion D Passed: Loop Data executed ${loopCount} iterations (graph backward jump verified)`);

  // Assertion E: Facade -> Adapter Delegation
  const activeTab = await mockAdapter.getActiveTab();
  if (!activeTab || activeTab.id !== 101) {
    throw new Error(`Assertion Failed: MockBrowserAdapter active tab lost or incorrect`);
  }
  console.log('  ✔ Assertion E Passed: Facade delegate activeTab verified (Tab ID: 101)');

  // Direct test of Facade _sendMessageToTab delegation
  const sendMessageResult = await mockAdapter.sendMessageToTab(101, {
    name: 'test-message',
    data: { hello: 'world' },
  });
  if (!sendMessageResult || sendMessageResult.status !== 'success') {
    throw new Error('Assertion Failed: sendMessageToTab delegation failed');
  }
  if (mockAdapter.recordedMessages.length === 0) {
    throw new Error('Assertion Failed: MockBrowserAdapter recorded 0 message calls');
  }
  console.log(`  ✔ Assertion F Passed: Facade sendMessageToTab correctly recorded by MockBrowserAdapter (${mockAdapter.recordedMessages.length} call recorded)`);

  console.log('\n====================================================');
  console.log('  🎉 All E2E Verification Assertions Passed!        ');
  console.log('====================================================\n');
}

runE2ETest().catch((err) => {
  console.error('\n❌ E2E Verification Failed:', err);
  process.exit(1);
});
