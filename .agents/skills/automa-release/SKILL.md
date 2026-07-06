---
name: automa-release
description: Handles the release process of the Automa extension, including version bumping, building the zip file, and uploading the distribution to Supabase cloud.
---

# Automa Extension Release Protocol

When the user requests to release, deploy, or publish a new version of the Automa extension, follow these steps:

## Context
The repository `automa-ecosystem/automa` contains a release wizard script (`utils/release.js`) which is triggered via `npm run release`. It performs 3 steps:
1. Bumps the semantic version (patch/minor/major/none).
2. Builds the extension into a zip file (`npm run build:zip`).
3. Uploads the zip file to the Supabase Cloud Storage bucket (`release`) in the specified environment (`production` or `development`).

## Execution
Because `npm run release` is an interactive script, you must use PowerShell piping to automatically provide the required inputs. The script asks three questions sequentially:
1. Version bump: `patch`, `minor`, `major`, or `none`
2. Build zip: `y` or `n`
3. Target environment: `production`, `development`, or `none`

### Command syntax:
Change to the `automa` directory, then use `Write-Output` with newlines (`\``n`) to pipe answers to the release script.

**Example 1: Minor version bump, build, and deploy to production**
```powershell
cd C:\Repository\automa-ecosystem\automa
Write-Output "minor`ny`nproduction" | npm run release
```

**Example 2: No version bump, build, and deploy to development**
```powershell
cd C:\Repository\automa-ecosystem\automa
Write-Output "none`ny`ndevelopment" | npm run release
```

### Required Actions Before Executing:
1. **Clarify options:** If the user didn't specify, briefly confirm what type of version bump they want (patch/minor/major/none) and which environment to deploy to (production/development) before running the command.
2. **Execute command:** Run the constructed powershell command using the `run_command` tool. 
3. **Verify:** Check the console output of the command to ensure the build didn't fail and the upload to Supabase cloud was successful (look for "🎉 Successfully uploaded to").
