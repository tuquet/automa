---
name: automa-release
description: Upload automa to Supabase Storage and push DB migrations to Supabase Cloud for production release.
---

# Automa Release Protocol

Whenever the user asks you to "release to production", "upload extension", or "push to cloud", you must strictly follow this protocol.

## Step 1: Run the automated release script
A script has been provided to automatically build the extension, zip it, and upload it to Supabase Storage.
You must run it using the `run_command` tool.

**Command:**
```bash
node docs/skills/automa-release/scripts/release.js
```
*Note: Make sure to run this command from the workspace root.*

If the script fails due to missing environment variables (`SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY`), you must ask the user to provide them or set them in the shell before retrying.

## Step 2: Push Supabase Database & Edge Functions (Cloud)
To push backend changes to the production Supabase cloud:
1. Ensure the CLI is linked to the production project ID. If the user hasn't specified it, ask for the Project ID.
   ```bash
   cd automa-be
   supabase link --project-ref <PROJECT_ID>
   ```
2. Push database migrations and edge functions:
   ```bash
   supabase db push
   supabase functions deploy
   ```

## Step 3: Verify the Release
After the upload and push are successful:
- Confirm with the user that the extension was uploaded.
- Remind the user that `download-extension` Edge Function will now correctly serve the latest `.zip` file from the `release` storage bucket.
