---
name: automa-ex-release
description: Release protocol for the Automa Chrome Extension (version bump, build, zip, and upload to Supabase Storage).
---

# Automa Extension Release Protocol

This protocol guides the release and packaging process for the Automa Chrome Extension (`automa` project).

## Release Workflow

When the user requests to release the extension, upload the extension, or package the extension:

1. **Verify environment files:**
   Ensure `automa-ex/secrets.production.js` (or `secrets.development.js` if deploying a dev build) contains the correct Supabase URL and anonymous key.

2. **Run the interactive release wizard:**
   Run the release script within the `automa-ex` directory:
   ```bash
   cd automa-ex
   node utils/release.js
   ```

3. **Follow the interactive prompts:**
   - **Version Bump:** Select whether to bump the version (`patch`, `minor`, `major`, or `none`). Bumping is recommended to avoid version collisions.
   - **Build ZIP:** Confirm running the build (`npm run build:zip`) to generate the new extension bundle.
   - **Environment Upload:** Choose the target environment to upload the extension zip to (`production`, `development`, or `none`). The script will automatically read credentials from the secrets file and upload the zip package to the `release` storage bucket using the Supabase JS client.
     
     > [!WARNING]
     > **Production Upload Guard:**
     > - **NEVER** select `production` during the upload prompt unless the user has explicitly requested a Production Release.
     > - Uploading to `production` will immediately overwrite the extension zip package served to production clients. Always ask the user first.

4. **Verify upload:**
   Once successfully uploaded, notify the user that the extension is live and can be downloaded from the release storage bucket.
