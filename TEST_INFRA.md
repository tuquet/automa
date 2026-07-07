# Test Infrastructure & E2E Test Suite Design (TEST_INFRA.md)

This document outlines the test environment setup, requirements, and test case inventory for validating the `automa-cli` integration with the Supabase Edge Function (`get-workflow`), database seeding, and dynamic proxy-based domain mocking.

---

## 1. Test Environment Setup & Requirements

To execute the E2E test suite, the runner environment must meet the following criteria:

- **Node.js**: Version 18 or above (for native HTTP, async/await support).
- **Chrome/Chromium Browser**: Must be installed locally. The test runner will automatically detect paths on Windows (`msedge.exe`, `chrome.exe`) or use Puppeteer's default package executable.
- **Automa Extension Build**: A pre-compiled version of the Automa extension must exist at `automa/build` (or be passed via `--extension` flag).
- **Local Supabase Instance**: Must be running on port `54321`.
- **Environment Variables**:
  - `SUPABASE_URL`: Points to the local Supabase Instance (e.g., `http://127.0.0.1:54321`) or Mock Server.
  - `SUPABASE_ANON_KEY`: Supabase authentication key passed via headers to the Supabase Server.

---

## 2. Test Infrastructure Architecture

The E2E test suite uses a native Node.js framework with three core helper components:

### A. Mock Supabase & Proxy HTML Server
Listening on port `54322`, this server handles two roles:
1. **Mock Supabase Server**: Intercepts requests for error cases (e.g. 404, 500, 401, timeout simulation).
2. **HTTP Proxy Server**: Chromium is started with `http_proxy` pointed to this mock server. Any request targeting the external domain `http://crm.cmcglobal.com.vn/` is intercepted, and the server returns a simulated CRM login page or dashboard.

```javascript
// Example proxy check in mock server:
if (hostname === 'crm.cmcglobal.com.vn') {
  if (pathname === '/' || pathname === '/crm-login') {
    // Serve mock CRM page
  }
}
```

### B. Database Seeding & Cleanup Helper
Before executing tests that query the real local Supabase Edge Function (such as T1.2, T1.7, T1.8), the test runner seeds the local Supabase database by making a REST POST request:
`POST http://127.0.0.1:54321/rest/v1/workflows`
This inserts the CRM login workflow JSON into the `workflows` table under the ID `crm-login-workflow-id`. Once the test completes, it triggers a REST DELETE request to clean up the seeded row.

### C. Child Process Spawner & NDJSON Parser
This component executes `node bin/cli.js` as a child process and reads/parses `stdout` as a real-time NDJSON stream. It configures the proxy env vars:
- `http_proxy: http://127.0.0.1:54322`
- `HTTP_PROXY: http://127.0.0.1:54322`

---

## 3. 4-Tier Test Case Inventory (27 Test Cases)

All test cases utilize the real `automa-cli/tests/crm_login.automa.json` workflow data content, executing against either the local proxy-mocked crm site or local files.

### Tier 1: Feature Coverage (9 Test Cases)
Focuses on ensuring individual CLI features, options, and basic communication work successfully under positive paths.

1. **T1.1: Local JSON File Execution**
   - **Description**: Runs a valid workflow JSON from local disk.
   - **Inputs**: `automa-cli tests/temp_workflow.json` (CRM login workflow copy)
   - **Assertions**: Exit code `0`; output contains NDJSON logs indicating successful execution.
2. **T1.2: Supabase Workflow Fetching and Execution**
   - **Description**: Seeds database with ID `crm-login-workflow-id` and runs via ID.
   - **Inputs**: `automa-cli --id crm-login-workflow-id` with local Supabase running.
   - **Assertions**: Exit code `0`; fetches from local Edge Function, executes against mocked CRM login proxy.
3. **T1.3: Custom Extension Path Flag**
   - **Description**: Verifies launching browser with a custom extension path.
   - **Inputs**: `--extension ../automa/build`
   - **Assertions**: Exit code `0`.
4. **T1.4: Variable Injection**
   - **Description**: Verifies external variables are successfully injected into the workflow.
   - **Inputs**: `--variables "{\"username\":\"tuquet\",\"password\":\"1235\"}"`
   - **Assertions**: Exit code `0`.
5. **T1.5: Custom Timeout Option**
   - **Description**: Verifies that custom execution timeout flag is parsed and respected.
   - **Inputs**: `--timeout 4000`
   - **Assertions**: Exit code `0`.
6. **T1.6: Real-time NDJSON Log Stream Format**
   - **Description**: Asserts that execution log events match the structured NDJSON contract.
   - **Inputs**: Standard execution.
   - **Assertions**: Exit code `0`.
7. **T1.7: Custom Supabase URL Env Var**
   - **Description**: Sets the `SUPABASE_URL` environment variable to a custom local address.
   - **Inputs**: Run CLI with `SUPABASE_URL=http://localhost:54321` and `--id crm-login-workflow-id`.
   - **Assertions**: Seeded DB workflow fetched and executed.
8. **T1.8: Custom Supabase Key Env Var**
   - **Description**: Sets the `SUPABASE_ANON_KEY` env variable and verifies correct transmission.
   - **Inputs**: Run CLI with `SUPABASE_ANON_KEY=custom-token-123` and `--id crm-login-workflow-id`.
   - **Assertions**: Executed correctly.
9. **T1.9: CLI Help Flag**
   - **Description**: Verifies the CLI outputs the help screen.
   - **Inputs**: `automa-cli --help` or `-h`
   - **Assertions**: Exit code `0`; stdout contains help menu.

### Tier 2: Boundary & Edge Cases (9 Test Cases)
Validates CLI error handling, network failures, input constraints, and robust execution timeouts.

10. **T2.1: Non-existent Workflow File**
    - **Description**: Executes CLI targeting a non-existent JSON path.
    - **Inputs**: `automa-cli tests/does_not_exist.json`
    - **Assertions**: Exit code `1`; error message containing workflow not found.
11. **T2.2: Malformed Workflow JSON File**
    - **Description**: Executes CLI targeting a JSON file containing malformed contents.
    - **Inputs**: `automa-cli tests/temp_malformed.json`
    - **Assertions**: Exit code `1`.
12. **T2.3: Supabase 404 - Workflow Not Found**
    - **Description**: Verifies CLI behavior when the Edge Function returns a 404 status code.
    - **Inputs**: `automa-cli --id invalid-id-999` against mock server returning `404`.
    - **Assertions**: Exit code `1`; error message contains "not found".
13. **T2.4: Supabase 500 - Edge Function Internal Error**
    - **Description**: Verifies CLI behavior when the Edge Function fails internally.
    - **Inputs**: `automa-cli --id error-id` against mock server returning `500`.
    - **Assertions**: Exit code `1`; error message contains "Database connection lost".
14. **T2.5: Missing / Invalid API Key Auth**
    - **Description**: Mock server rejects request with a 401 Unauthorized status.
    - **Inputs**: Run CLI with invalid auth config against mock server returning 401.
    - **Assertions**: Exit code `1`; error contains "Unauthorized".
15. **T2.6: Supabase Endpoint Response Timeout**
    - **Description**: The mock Supabase server hangs/delays response beyond HTTP timeout limit.
    - **Inputs**: Edge Function call hangs for 5 seconds.
    - **Assertions**: Handled correctly.
16. **T2.7: Extremely Short Execution Timeout**
    - **Description**: Forces workflow execution to timeout.
    - **Inputs**: `--timeout 100` (100ms)
    - **Assertions**: Exit code `1`; output contains timeout error event.
17. **T2.8: Empty Workflow Payload**
    - **Description**: Workflow file is empty JSON `{}`.
    - **Inputs**: `automa-cli tests/temp_empty.json`
    - **Assertions**: Exit code `1`.
18. **T2.9: Invalid Extension Directory Path**
    - **Description**: Passes a non-existent directory to the `--extension` flag.
    - **Inputs**: `-e /invalid/path`
    - **Assertions**: Exit code `1`; output contains directory not found error.

### Tier 3: Combination Cases (5 Test Cases)
Verifies complex inputs, conflicting configs, and resilience under unstable external states.

19. **T3.1: Conflicting Sources (File vs ID)**
    - **Description**: Passes both a local JSON path and `--id` flag.
    - **Inputs**: `automa-cli temp.json --id crm-login-workflow-id`
    - **Assertions**: Precedence logic resolves cleanly.
20. **T3.2: Complex Variable Objects Injection**
    - **Description**: Injects variables containing nested structures.
    - **Inputs**: `-v "{\"nest\":{\"key\":\"🚀 value\"}}"`
    - **Assertions**: Exit code `0`.
21. **T3.3: Slow Workflow with Borderline Timeout**
    - **Description**: Test with a 4-second timeout (passes) and a 10ms timeout (fails).
    - **Inputs**: Multi-step slow workflow with custom timeouts.
    - **Assertions**: First run succeeds (exit code `0`); second run fails (exit code `1`) with execution timeout.
22. **T3.4: Supabase Edge Function Completely Offline**
    - **Description**: Supabase server is not listening on the port (Connection Refused).
    - **Inputs**: Run CLI with `SUPABASE_URL=http://127.0.0.1:54399` (non-listening port).
    - **Assertions**: Exit code `1`; output contains connection refused error.
23. **T3.5: Multiple Runs Profile Isolation**
    - **Description**: Executes CLI twice sequentially using the same command.
    - **Inputs**: Sequential execution of T1.1.
    - **Assertions**: Both succeed; temp profile folders are cleaned up completely after each run.

### Tier 4: Realistic Applications (4 Test Cases)
Exercises complex workflow topologies matching actual production workflows.

24. **T4.1: CRM Login Flow Simulation**
    - **Description**: Seeds DB, runs CLI with ID, Chromium executes against proxied CRM domain.
    - **Assertions**: Exit code `0`.
25. **T4.2: Data Scraping & Variable Export**
    - **Description**: Runs CRM login workflow seeded in database.
    - **Assertions**: Exit code `0`.
26. **T4.3: Multi-step Form Submission with Conditional Paths**
    - **Description**: Runs CRM login workflow seeded in database.
    - **Assertions**: Exit code `0`.
27. **T4.4: Error Recovery inside Workflow (Try/Catch equivalent)**
    - **Description**: Runs CRM login workflow seeded in database.
    - **Assertions**: Exit code `0`.
