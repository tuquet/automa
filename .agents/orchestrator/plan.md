# Plan: Automa CLI Package and Verification

## Objective
Build a CLI package (`automa-cli`) using Puppeteer to run Automa workflows headlessly in the background, addressing MV3 restrictions and bypassing UI popups. Provide a programmatic verification script and a design/risk document.

## Milestones and Steps

### Milestone 1: Design & Risk Analysis (R1)
- **Goal**: Create `automa-cli/design_and_risks.md` covering the startup architecture and mitigations for 4 specific technical risks.
- **Steps**:
  1. Draft the mindmap in Mermaid format.
  2. Analyze the 4 risk cases:
     - MV3 Service Worker sleep limit.
     - Default tab behavior in Chrome.
     - Background listener initialization latency.
     - Bypassing/blocking `popup.html` and `params.html` views.
  3. Formulate technical mitigations for each and document them.

### Milestone 2: CLI Package Development (R2)
- **Goal**: Implement `automa-cli` Node.js package in `c:\Repository\automa-ecosystem\automa-cli`.
- **Steps**:
  1. Create folder `automa-cli`.
  2. Initialize `package.json` with dependencies (Puppeteer, etc.).
  3. Create the CLI execution entry point (`index.js` or `cli.js`).
     - CLI accepts arguments: `--workflow <path_or_id>` or command-line parameters.
     - Launches Puppeteer with unpacked extension load args (`--disable-extensions-except=...` and `--load-extension=...`).
     - Implements service worker liveness ping/keep-alive mechanism.
     - Handles Chrome default tab management (closing or reusing it).
     - Retries background handshake until listeners are ready.
     - Triggers workflow execution directly via message passing.
     - Monitors workflow completion status (via Dexie IndexedDB or `workflowStates` local storage polling).
     - Cleanly shuts down the browser on success or failure.

### Milestone 3: E2E Verification & No-UI Assertion
- **Goal**: Implement `verify_cli.js` to run a sample workflow and assert no UI rendering.
- **Steps**:
  1. Create a sample test workflow JSON file.
  2. Implement `verify_cli.js` inside `automa-cli`.
     - Invokes the CLI with the sample workflow.
     - Monitors target creation using Puppeteer `targetcreated` event listener.
     - Asserts that no pages loading `popup.html` or `params.html` are created or rendered.
     - Verifies that the workflow executes completely without freezing.
     - Logs success/failure clearly.

### Milestone 4: Review, Gating and Audit
- **Goal**: Verify correctness, run reviews, and run the Forensic Auditor.
- **Steps**:
  1. Spawn Reviewer to check design and code.
  2. Spawn Challenger to stress test and run verification.
  3. Spawn Forensic Auditor to verify integrity (no hardcoded expected results, no dummy logic).
