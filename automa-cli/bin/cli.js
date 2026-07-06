#!/usr/bin/env node

const path = require('path');
const { runWorkflow } = require('../lib/runner');

function printHelp() {
  console.log(`
Automa CLI runner

Usage:
  automa-cli <path-to-workflow-json> [options]

Options:
  --extension, -e  Path to the built Automa chrome extension directory (default: ../automa/build)
  --variables, -v  JSON string representing variables to inject (default: {})
  --timeout, -t    Execution timeout in milliseconds (default: 60000)
  --help, -h       Show help
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    printHelp();
    process.exit(0);
  }

  const workflowPath = path.resolve(args[0]);
  let extensionPath = null;
  let variables = {};
  let timeout = 60000;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--extension' || args[i] === '-e') {
      extensionPath = path.resolve(args[i + 1]);
      i++;
    } else if (args[i] === '--variables' || args[i] === '-v') {
      try {
        variables = JSON.parse(args[i + 1]);
      } catch (err) {
        console.error("Error parsing variables JSON:", err.message);
        process.exit(1);
      }
      i++;
    } else if (args[i] === '--timeout' || args[i] === '-t') {
      timeout = parseInt(args[i + 1], 10);
      i++;
    }
  }

  try {
    const result = await runWorkflow(workflowPath, {
      extensionPath,
      variables,
      timeout
    });
    console.log("Execution Status:", result.log.status);
    console.log("Execution Log ID:", result.log.id);
    console.log("Variables output:", result.data ? result.data.variables : {});
    console.log("Table output:", result.data ? result.data.table : []);
    
    if (result.log.status === 'error') {
      console.error("Execution failed with message:", result.log.message);
      process.exit(1);
    }
  } catch (err) {
    console.error("CLI Execution failed:", err.message);
    process.exit(1);
  }
}

main();
