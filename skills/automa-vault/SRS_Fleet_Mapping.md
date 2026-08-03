# Software Requirements Specification (SRS)
**Project**: Automa Ecosystem - Fleet Visual Editor Enhancements
**Feature**: Workflow & Browser Profile Mapping

## 1. Introduction
The current Fleet Visual Editor provides a read-only view of `workflow_id` and `browser_id`. To make the editor fully functional for users, it must allow interactive mapping/assignment of local Workflows and Browser Profiles to Fleet Members and Tasks.

## 2. Requirements

### 2.1 Backend (VS Code Extension Provider)
- **REQ-B1 (Profile Scanning)**: `FleetPreviewEditorProvider.ts` must scan the workspace for `**/*.bprofile.json` and `**/*.profile.json` files.
- **REQ-B2 (Dictionary Generation)**: Parse the scanned profile files to extract their unique IDs and Names (or file names if names are absent).
- **REQ-B3 (Data Injection)**: Update the `updateWebview` payload to send both `workflows` (existing) and `profiles` dictionaries to the webview.

### 2.2 Frontend (Webview UI - Vue 3)
- **REQ-F1 (Profile Dropdown)**: In the Member header, replace the static `browser_id` text with a `<select>` dropdown populated by the `profiles` dictionary. Changing this updates `member.browser_id` and marks the document as modified.
- **REQ-F2 (Workflow Dropdown)**: In the Task card, replace the static workflow name/ID display with a `<select>` dropdown populated by the `workflows` dictionary. Changing this updates `task.workflow_id` and marks the document as modified.
- **REQ-F3 (Fallback Handling)**: If a Fleet JSON contains an ID that no longer exists in the local dictionaries (e.g., deleted file), the dropdowns should still display the missing ID with an "[Unknown]" or "[Missing]" prefix to alert the user without losing data.

### 2.3 Demo Data
- **REQ-D1 (Create Demo Profiles)**: Generate two sample browser profile files (e.g., `marketing-profile-01.bprofile.json` and `accounting-profile-02.bprofile.json`) in the `automa-vault/profiles` directory so the Fleet mapping has concrete targets.

## 3. UI/UX Guidelines
- Dropdowns should match the VS Code native styling (`var(--vscode-dropdown-background)`, etc.).
- Interactions must be responsive and immediately trigger the "Save" button to appear.
