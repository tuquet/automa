## 2026-07-06T08:29:10Z

You are teamwork_preview_worker.
Your objective is to apply critical bug fixes to the Automa extension's offscreen document detection and the CLI runner's IndexedDB query reliability.
Your working directory is: c:\Repository\automa-ecosystem\.agents\worker_m2_gen3.
Create a progress.md file in your directory and update it as you complete steps.

Please perform the following tasks:

1. **Fix 1: Offscreen Document Detection (Headless mode fix)**:
   - File path: `automa/src/background/BackgroundOffscreen.js`
   - Modify the `isOpened()` function (around lines 61-70). Remove the `documentUrls` filter property from the query object passed to `chrome.runtime.getContexts()`. The call should only filter by `contextTypes: ['OFFSCREEN_DOCUMENT']`.
   - Run the extension build command: `pnpm run build` inside `c:\Repository\automa-ecosystem\automa`. Verify that the build succeeds and output files are created in `automa/build`.

2. **Fix 2: IndexedDB Open Hang Protection (Robustness fix)**:
   - File path: `automa-cli/lib/runner.js`
   - Inside the IndexedDB log checking `evaluate` function (around lines 263-337):
     - Implement a safety `setTimeout` of 1000ms.
     - If the timeout fires, immediately resolve `null`. This prevents the promise from hanging indefinitely when a database version upgrade locks the connection.
     - Ensure that if `onsuccess`, `onerror`, or `onblocked` is triggered, you call `clearTimeout()` on the safety timeout before proceeding.

3. **Verify the Fixes**:
   - Run the E2E verification test: `node verify_cli.js` inside `automa-cli`.
   - Confirm that the script executes to completion and outputs `[SUCCESS] Verification passed! All assertions met perfectly.` on the first try and headless mode.
   - Run it multiple times to ensure stability.

4. **Commit Changes**:
   - Commit all changes using conventional commits (e.g., `fix(background): fix offscreen contexts check in headless and add safety timeout for indexeddb`).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Please report back with details of your changes and verify script outputs.
