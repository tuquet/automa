---
name: automa-vault
description: Directory conventions, Campaign matrix schemas (*.campaign.json), anti-detect browser profiles (*.browser.json), and storage workspace organization for automa-vault. Activate when managing scenario files on disk, matrix fleet scheduling, or mapping workflows to virtual browsers.
---

# Automa Storage Workspace (`automa-vault`)

File layout conventions, Campaign matrix scheduling, and browser profile specifications for the `apps/vault` directory.

---

## 1. 🎯 Scope: Global Storage vs Storage Workspace

- **Global Storage (Runtime Truth)**: SQLite database managed by `apps/core` (`Tables`, `Variables`, `Credentials`, `Browsers`, `Jobs`). All UI panels and runtimes consume state directly via `/api/v1/...` REST APIs.
- **Storage Workspace (`apps/vault`)**: Disk directory tree used for Git version control and explicit export/import. **Zero Folder Scanning Invariant**: Runtimes and extensions MUST NOT use automatic folder scanning/globbing commands to discover state; all entities are managed through the SQLite database.

---

## 2. 🛡️ File Conventions & Schemas

### 1. Campaigns (`campaigns/*.campaign.json`)
```json
{
  "name": "E-commerce Price Monitor",
  "version": "1.0.0",
  "description": "Scrapes product prices across target vendors using rotating browsers",
  "browsers": [
    {
      "id": "browser-chrome-us",
      "name": "US Residential Chrome",
      "tasks": [
        {
          "workflow_id": "google-search.workflow.json",
          "schedule": "cron: 0 */2 * * *"
        }
      ]
    }
  ]
}
```

### 2. Browser Profiles (`browsers/*.browser.json`)
```json
{
  "id": "browser-chrome-us",
  "name": "US Residential Chrome",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...",
  "timezone": "America/New_York",
  "locale": "en-US",
  "proxy": {
    "protocol": "http",
    "host": "proxy.example.com",
    "port": 8080
  }
}
```

---

## 3. 💻 Flat List Directory Structure

```text
apps/vault/
├── browsers/
│   ├── chrome-profile-1.browser.json
│   └── firefox-profile-2.browser.json
├── campaigns/
│   └── daily-lead-gen.campaign.json
├── workflows/
│   ├── google.com/
│   │   └── search-and-extract.workflow.json
│   └── linkedin.com/
│       └── connect-request.workflow.json
└── scratch/
    └── test-temp.json
```

---

## 4. 🔧 Verification & Types Reference

- **TypeScript DTOs**: Imported from `@automa/types` ([`packages/types`](../../packages/types)).
- **Schema Validation**: Validate schemas via `node scripts/enforce-strict-schema.mjs`.
