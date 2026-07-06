## 2026-07-06T07:43:30Z

You are teamwork_preview_worker.
Your objective is to implement the Automa CLI package and verification script as specified in the project requirements.
Your working directory is: c:\Repository\automa-ecosystem\.agents\worker_m2.
Create a progress.md file in your directory and update it as you complete steps.

Perform the following tasks:
1. Create the `automa-cli` directory in c:\Repository\automa-ecosystem.
2. Implement R1: Create `automa-cli/design_and_risks.md`. It must contain:
   - A Mermaid mindmap detailing the Puppeteer startup and message sequence.
   - Four detailed mitigation sections for:
     1. MV3 Service Worker sleep (mitigated by opening/holding extension newtab.html).
     2. Chrome default tab behavior (closing or reusing it).
     3. Background listener startup latency (polling handshake using background--get:sender).
     4. Bypassing popup.html and params.html UI (using direct message passing with checkParams: false and injecting variables).
3. Implement R2: Develop the `automa-cli` package.
   - Create `automa-cli/package.json` containing dependencies (Puppeteer, etc.). Remember: run pnpm/npm commands with ignore-scripts if needed.
   - Create the runner library `automa-cli/lib/runner.js` implementing the Puppeteer browser launch, extension ID detection, handshake, workflow execute message dispatching, local storage polling, Dexie IndexedDB logs retrieval, and teardown.
   - Create a CLI entrypoint `automa-cli/index.js` or `automa-cli/bin/cli.js` which parses args.
4. Implement Verification:
   - Create a simple workflow `automa-cli/sample_workflow.json` (e.g. opens a target website, sets a variable or records table data).
   - Create `automa-cli/verify_cli.js`. This script must programmatically run the sample workflow using the runner library, hook a `targetcreated` listener to assert that popup.html or params.html are NEVER rendered, verify the final results from IndexedDB logs match expectations, and print test success/failure.
5. Run the verification script and provide terminal output to verify success.
6. Commit your changes to git following conventional commit messages (e.g., `feat(cli): add automa-cli package and verify script`, etc.).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Please report back when done with absolute paths to all created files and a summary of your results.
