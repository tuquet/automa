## 2026-07-06T08:15:34Z
You are teamwork_preview_worker.
Your objective is to fix the bugs and race conditions in the automa-cli package.
Your working directory is: c:\Repository\automa-ecosystem\.agents\worker_m2_gen2.
Create a progress.md file in your directory and update it as you complete steps.

Please modify the codebase in `c:\Repository\automa-ecosystem\automa-cli` as follows:

1. **Fix 1: IndexedDB Version Lock & Promise Hang**:
   In `automa-cli/lib/runner.js` inside the `extensionPage.evaluate` block that queries IndexedDB (where it runs `indexedDB.open('logs')`):
   - Wrap the IndexedDB transaction and query operations in a `try...catch` block.
   - Attach `onerror` and `onblocked` event listeners to the open request and resolve `null` if triggered, to ensure the evaluate promise never hangs.
   - Verify that the object stores exist using `db.objectStoreNames.contains('items') && db.objectStoreNames.contains('logsData')`. If they do not exist yet, call `db.close()` immediately to release any version locks on Chromium, and resolve `null` so the polling loop can retry on the next tick.

2. **Fix 2: Page Instance Comparison / Tab Cleanup**:
   In `automa-cli/lib/runner.js` under the tab cleanup section (`Closing default blank tabs...`):
   - Instead of checking `page !== extensionPage` (which fails due to Puppeteer Page wrapper reference inequality), change the logic to close only blank tabs. For example, check: `if (page.url() === 'about:blank' || page.url().includes('new-tab-page')) { await page.close().catch(() => {}); }`. This is safe and avoids closing your active extension tab.

3. **Fix 3: Welcome Page Detection Race Condition**:
   In `automa-cli/lib/runner.js` before searching for/loading `extensionPage`:
   - Replace the static 2-second sleep with a dynamic target/page polling loop. Check `browser.pages()` repeatedly (e.g., up to 15 times with 200ms delays) to see if a page with a URL containing `chrome-extension://${extensionId}/` exists. If found, reuse it immediately. If not found after the timeout, open a new page via `browser.newPage()` and navigate it to `newtab.html`.

4. **Fix 4: verify_cli.js Headless Default**:
   In `automa-cli/verify_cli.js` (and the runner default launch options in `lib/runner.js` if appropriate), run Puppeteer in headless mode (`headless: 'new'` or `headless: 'shell'`) by default, to ensure tests run cleanly on displayless server/CI environments.

5. **Fix 5: CLI Options Parsing**:
   In `automa-cli/bin/cli.js` (or index.js), add boundary checks to ensure that accessing `args[i + 1]` does not throw a `TypeError` if a flag is passed without a trailing value.

6. **Fix 6: design_and_risks.md Diagram Labeling**:
   Change the label in `automa-cli/design_and_risks.md` from "Mermaid Mindmap" to "Mermaid Flowchart" to match the actual flowchart diagram syntax used.

7. **Test & Verify**:
   - Run the E2E verification script `node verify_cli.js` inside the `automa-cli` folder. Verify that it executes to completion and outputs `[SUCCESS] Verification passed! All assertions met perfectly.` on the first try.
   - Run it multiple times to ensure the race conditions are completely resolved and there are no hangs.

8. **Commit Changes**:
   - Commit all fixes using conventional commits (e.g., `fix(cli): resolve indexeddb version lock and page comparison race conditions`).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Please report back with details of your fixes and verify script output.
