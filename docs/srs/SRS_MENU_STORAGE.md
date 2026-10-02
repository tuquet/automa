# 🗄️ SRS Domain Specification: Menu Storage (SQLite Global Storage & Vault)

---

## 🎯 1. Scope & Objectives

The **Storage** menu manages business databases, global configuration variables, encrypted Vault secrets, and workflow asset stores across the Automa Ecosystem:
- **`apps/desk`**: Provides a 3-tab administration interface (`StorageView.vue`): **Tables** (Dynamic SQLite tables), **Variables** (Public environment variables), and **Credentials** (Zero-Leak encrypted vault).
- **`apps/vsce`**: Provides the `STORAGE` sidebar container (`automa.storage`), standalone panel `TablePanel.ts`, and webview `TableView.vue` with Visual Form Mode.
- **`apps/vault`**: Workspace on disk housing workflow assets (`*.workflow.json`, `*.campaign.json`, `*.browser.json`).

---

## 🌳 2. UI/UX Layout & Component Tree

```text
StorageView.vue (or TableView.vue in VS Code)
├── Storage Tabs Navigation (Tables / Variables / Credentials / File Explorer)
├── TAB 1: TABLES (Dynamic SQLite Tables)
│   ├── Left Sidebar: Table catalog + btn.storage.table.create + Search
│   └── Right Panel: Dynamic Data Table Grid
│       ├── Table Schema Header (Column names & data types)
│       ├── Table Controls: btn.storage.table.addcolumn, btn.storage.table.addrow, btn.storage.table.export
│       └── Virtualized Table Rows (Inline cell editing)
├── TAB 2: VARIABLES (Public Environment Variables)
│   ├── Variable List Grid: Key / Value / Type / Updated At
│   └── Controls: btn.storage.variable.create, btn.storage.variable.delete
├── TAB 3: CREDENTIALS (Zero-Leak Cryptographic Vault)
│   ├── Encrypted Keys Grid: Key Name / Ciphertext Preview / HMAC Seal
│   └── Controls: btn.storage.credential.create, btn.storage.credential.test
└── TAB 4: FILE EXPLORER (Storage Workspace)
    └── Flat List Namespace Tagging: [namespace/category] • File Name • Blocks Count
```

---

## ⚡ 3. Button Catalog in Storage Menu

| Button ID | UI Label | Icon | Supported FSM States | Target Action & Endpoint | `data-testid` |
|---|---|---|---|---|---|
| `btn.storage.table.create` | New Table | `Plus` | `IDLE` | Creates new table `createStorageTable()` | `btn-create-storage-table` |
| `btn.storage.table.delete` | Delete Table | `Trash2` | `IDLE` | Deletes table `deleteStorageTable()` | `btn-delete-storage-table` |
| `btn.storage.table.addcolumn` | Add Column | `Columns`| `IDLE` | Appends dynamic column to table schema | `btn-add-table-column` |
| `btn.storage.table.addrow` | Add Row | `PlusSquare`| `IDLE` | Appends new record `addStorageTableRow()` | `btn-add-table-row` |
| `btn.storage.table.export` | Export CSV | `Download` | `IDLE` | Exports table data to CSV/JSON file | `btn-export-table-csv` |
| `btn.storage.variable.create`| New Variable | `Plus` | `IDLE` | Creates public variable `createStorageVariable()` | `btn-create-storage-variable` |
| `btn.storage.variable.delete`| Delete Variable| `Trash2` | `IDLE` | Removes variable `deleteStorageVariable()` | `btn-delete-storage-variable` |
| `btn.storage.credential.create`| New Credential| `Key` | `IDLE` | Encrypts & saves `createStorageCredential()` | `btn-create-storage-credential` |
| `btn.storage.credential.delete`| Delete Credential| `Trash2`| `IDLE`| Purges secret key from Vault | `btn-delete-storage-credential` |
| `btn.storage.credential.test`| Test Encryption| `ShieldCheck`| `IDLE`| Tests live encryption roundtrip with Daemon | `btn-test-credential-encrypt` |

---

## 📜 4. Select Dropdowns in Storage Menu

| Select ID | Dropdown Label | Remote Data Source | Virtualization & Debounce | Reactive Selection Side-Effect | `data-testid` |
|---|---|---|---|---|---|
| `select.storage.table` | Select Table To View | `GET /api/v1/storage/tables` | Virtualized 500+, Debounce 150ms | Ingests table rows into `activeTableRows` | `select-storage-table` |
| `select.storage.workflow` | Select Workflow In Database | `GET /api/v1/storage/workflows` | Virtualized 1000+, Debounce 250ms | Loads workflow AST onto Canvas Editor | `select-storage-workflow` |

---

## 🍍 5. Associated Pinia State Management (`useStorageStore`)

The [`useStorageStore`](../../packages/ui/src/stores/useStorageStore.ts) store coordinates storage domain state:
- `tables`: Array of SQLite tables (`StorageTable[]`).
- `activeTableId`: ID of the currently open table.
- `activeTableRows`: Dynamic record array for the active table.
- `variables`: Public variable array (`StorageVariable[]`).
- `credentials`: Encrypted secrets array (`StorageCredential[]`).
- `tableCount`, `variableCount`, `credentialCount`: Computed getters.

---

## 🔒 6. Vault Cryptographic Standards

Security guarantees implemented in `apps/core/src/core/crypto/`:
1. **Key & IV Derivation**: `EVP_BytesToKey` algorithm (MD5 hash of Master Passphrase + 8-byte random Salt) deriving a 32-byte Key and 16-byte IV.
2. **AES-256-CBC Payload**: Authenticated cipher with `Pkcs7` padding, producing the standard Base64 format `Salted__<salt><ciphertext>`.
3. **HMAC-SHA256 Integrity Seal**: Computes a 64-character hex signature protecting ciphertext against tampering.
4. **Zero-Leak Principle**: Decryption occurs exclusively in RAM during `{{secrets.key}}` resolution and memory is cleared immediately; logging secrets is strictly prohibited.

---

## 🌐 7. API Endpoints & SSE Events Catalog

| Protocol | Endpoint / Event | Method | SDK Function | Business Description |
|---|---|:---:|---|---|
| **REST** | `/api/v1/storage/tables` | `GET` / `POST` | `getStorageTables()` / `createStorageTable()` | Fetches or creates SQLite tables |
| **REST** | `/api/v1/storage/tables/{id}/rows` | `GET` / `POST` | `getStorageTableRows()` / `addStorageTableRow()` | Fetches or inserts table row entries |
| **REST** | `/api/v1/storage/variables` | `GET` / `POST` | `getStorageVariables()` / `createStorageVariable()` | Fetches or creates public variables |
| **REST** | `/api/v1/storage/credentials` | `GET` / `POST` | `getStorageCredentials()` / `createStorageCredential()` | Fetches or stores encrypted secrets |
| **REST** | `/api/v1/storage/workflows` | `GET` / `POST` | `getStorageWorkflows()` / `createStorageWorkflow()` | Manages and loads workflows from SQLite |
| **REST** | `/api/v1/storage/campaigns` | `GET` / `POST` | `getStorageCampaigns()` / `createStorageCampaign()` | Manages and loads campaigns from SQLite |
| **SSE** | `/api/v1/events` | Stream | `globalSseClient` | Ingests `storage_table_changed`, `storage_variable_changed` |

---

## 🛡️ 8. Quality Assurance & Agent Cross-Checklist

1. [ ] Zero Folder Scanning: 100% of storage operations query SQLite via REST API.
2. [ ] Tables support dynamic column additions (`+ Add Column`) and default to Visual Form Mode.
3. [ ] Secrets in the Credentials tab display exclusively as ciphertext; plaintext values are never rendered or transmitted unnecessarily.
