# Test Ready Signaling (TEST_READY.md)

This document signals that the comprehensive E2E test suite has been successfully implemented and is ready for execution.

## How to Run the E2E Test Suite

### Prerequisites
1. Ensure Node.js 18 or above is installed.
2. Verify that dependencies are installed and the Automa extension is built at `automa/build`.

### Running the E2E Test Runner
From the root of the repository, execute the following command:
```bash
node automa-cli/tests/e2e_tests.js
```

Or from the `automa-cli` directory:
```bash
cd automa-cli
node tests/e2e_tests.js
```

## Test Inventory & Setup details
The test suite is fully self-contained and manages:
- **Mock Supabase Server**: Listens on port `54321` and simulates both `get-workflow` Edge Functions and standard REST API calls.
- **Dynamic HTML Server**: Serves mock pages for login, data scraping, branching, and conditional routing.
- **CLI NDJSON parsing**: Runs child processes executing the CLI and parses output in real-time.
- **Comprehensive coverage**: Runs all 27 test cases outlined in `TEST_INFRA.md`.
