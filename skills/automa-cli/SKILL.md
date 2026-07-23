---
name: automa-cli-run
description: Protocol for verifying local dependencies and running the Automa CLI tool to execute workflows.
---

# Automa CLI Local Run Protocol

Follow this protocol to verify local dependencies and run the Automa CLI runner (`automa-cli`) successfully on the local developer machine.

---

## 1. Verify Supabase Local Status

Before running a workflow that relies on Supabase variables or credentials, ensure the local Supabase container is up and running.

### Verification Action:
Run `npx supabase status` inside `automa-be/`.

* **If running:** It will print the local API URL (`http://127.0.0.1:54321`) and credentials.
* **If stopped:** Run the Supabase start task or run `npx supabase start` in `automa-be/`.

---

## 2. Verify Extension Build Status

The CLI runner requires the unpacked extension build to execute workflows. 

### Verification Action:
Check if the file `automa-ex/build/manifest.json` exists.

* **Developer Mode (Dev):** If the developer is actively modifying the extension, they should run `npm run dev` in `automa-ex/`. This keeps the `build/` folder up-to-date via Webpack watch.
* **Production Mode (Prod):** Run `npm run build:prod-chrome` in `automa-ex/` to generate a optimized one-off build at `automa-ex/build/`.

---

## 3. CLI Run Parameters & Invocation

Navigate to `automa-cli/` before running the commands.

### Option A: Run via local JSON file (Recommended for Vault Workflows)
```bash
node bin/cli.js "../automa-vault/crm/workflows/Auth - Login.json" --extension ../automa-ex/build
```

### Option B: Run via Database ID
```bash
node bin/cli.js --id <database_workflow_id> --extension ../automa-ex/build
```

### Passing Input Parameters & Variables
* **Direct JSON Variables:** Use the `--variables` / `-v` flag with a stringified JSON object:
  ```bash
  node bin/cli.js <path> --variables '{"$$my_var": "custom_value"}'
  ```
* **Database Variables Auto-Populate:** The CLI will automatically query all variables from the local Supabase DB and inject any referenced global variables (starting with `$$`) if they are not explicitly overridden in the `--variables` flag. Ensure you have run `Vault: Push` beforehand so the database has the latest values.
