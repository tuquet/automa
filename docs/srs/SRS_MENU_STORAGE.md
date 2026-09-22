# 🗄️ ĐẶC TẢ NGHIỆP VỤ SRS: MENU STORAGE (SQLITE GLOBAL STORAGE & VAULT)

---

## 🎯 1. MỤC TIÊU & PHẠM VI (SCOPE & OBJECTIVES)

Menu **Storage** quản lý toàn bộ cơ sở dữ liệu nghiệp vụ, biến cấu hình toàn cục, mật mã kho bí mật (Vault Secrets), và cây tệp kịch bản lưu trữ của Automa Ecosystem:
- **`apps/desk`**: Cung cấp giao diện quản trị 3 tab (`StorageView.vue`): **Tables** (Bảng dữ liệu SQLite), **Variables** (Biến toàn cục Public), **Credentials** (Mật mã mã hóa Zero-Leak Vault).
- **`apps/vsce`**: Cung cấp sidebar panel `STORAGE` (`automa.storage`), standalone panel `TablePanel.ts` và webview `TableView.vue` với chế độ Visual Form Mode.
- **`apps/vault`**: Thư mục workspace chứa các file kịch bản trên đĩa (`*.workflow.json`, `*.campaign.json`, `*.browser.json`).

---

## 🌳 2. BỐ CỤC GIAO DIỆN & COMPONENT TREE (UI/UX LAYOUT)

```text
StorageView.vue (hoặc TableView.vue trong VS Code)
├── Storage Tabs Navigation (Tables / Variables / Credentials / File Explorer)
├── TAB 1: TABLES (Bảng SQLite Động)
│   ├── Left Sidebar: Danh sách bảng + btn.storage.table.create + Search
│   └── Right Panel: Dynamic Data Table Grid
│       ├── Table Schema Header (Tên cột & Kiểu dữ liệu)
│       ├── Table Controls: btn.storage.table.addcolumn, btn.storage.table.addrow, btn.storage.table.export
│       └── Virtualized Table Rows (Hỗ trợ inline edit từng ô)
├── TAB 2: VARIABLES (Biến Toàn Cục Public)
│   ├── Variable List Grid: Key / Value / Type / Updated At
│   └── Controls: btn.storage.variable.create, btn.storage.variable.delete
├── TAB 3: CREDENTIALS (Kho Mật Mã Zero-Leak Vault)
│   ├── Encrypted Keys Grid: Key Name / Ciphertext Preview / HMAC Seal
│   └── Controls: btn.storage.credential.create, btn.storage.credential.test
└── TAB 4: FILE EXPLORER (Storage Workspace)
    └── Flat List Namespace Tagging: [namespace/category] • File Name • Blocks Count
```

---

## ⚡ 3. DANH MỤC NÚT BẤM (BUTTON CATALOG) TRONG MENU STORAGE

| Button ID | Tên Nút / Nhãn UI | Icon | Trạng Thái FSM Hỗ Trợ | Target Action & Endpoint | `data-testid` |
|---|---|---|---|---|---|
| `btn.storage.table.create` | New Table | `Plus` | `IDLE` | Tạo bảng mới `createStorageTable()` | `btn-create-storage-table` |
| `btn.storage.table.delete` | Delete Table | `Trash2` | `IDLE` | Xóa bảng `deleteStorageTable()` | `btn-delete-storage-table` |
| `btn.storage.table.addcolumn` | Add Column | `Columns`| `IDLE` | Thêm cột động vào cấu trúc bảng | `btn-add-table-column` |
| `btn.storage.table.addrow` | Add Row | `PlusSquare`| `IDLE` | Thêm bản ghi mới `addStorageTableRow()` | `btn-add-table-row` |
| `btn.storage.table.export` | Export CSV | `Download` | `IDLE` | Xuất dữ liệu bảng ra file CSV/JSON | `btn-export-table-csv` |
| `btn.storage.variable.create`| New Variable | `Plus` | `IDLE` | Tạo biến mới `createStorageVariable()` | `btn-create-storage-variable` |
| `btn.storage.variable.delete`| Delete Variable| `Trash2` | `IDLE` | Xóa biến `deleteStorageVariable()` | `btn-delete-storage-variable` |
| `btn.storage.credential.create`| New Credential| `Key` | `IDLE` | Mã hóa và lưu `createStorageCredential()` | `btn-create-storage-credential` |
| `btn.storage.credential.delete`| Delete Credential| `Trash2`| `IDLE`| Xóa khóa bí mật khỏi Vault | `btn-delete-storage-credential` |
| `btn.storage.credential.test`| Test Encryption| `ShieldCheck`| `IDLE`| Thử nghiệm mã hóa trực tiếp với Daemon | `btn-test-credential-encrypt` |

---

## 📜 4. DANH MỤC SELECT / DROPDOWN TRONG MENU STORAGE

| Select ID | Tên Dropdown | Nguồn Dữ Liệu Remote | Virtualization & Debounce | Side-effect Phản Xạ Khi Chọn | `data-testid` |
|---|---|---|---|---|---|
| `select.storage.table` | Select Table To View | `GET /api/v1/storage/tables` | Virtualized 500+, Debounce 150ms | Nạp dữ liệu các dòng của bảng `activeTableRows` | `select-storage-table` |
| `select.storage.workflow` | Select Workflow In Database | `GET /api/v1/storage/workflows` | Virtualized 1000+, Debounce 250ms | Nạp kịch bản tương ứng lên Canvas Editor | `select-storage-workflow` |

---

## 🍍 5. QUẢN LÝ TRẠNG THÁI PINIA STORE LIÊN QUAN (`useStorageStore`)

Store [`useStorageStore`](../../packages/automa-ui/src/stores/useStorageStore.ts) quản lý toàn bộ dữ liệu của menu Storage:
- `tables`: Mảng danh sách bảng SQLite (`StorageTable[]`).
- `activeTableId`: ID bảng đang được mở xem.
- `activeTableRows`: Mảng bản ghi dữ liệu động của bảng hiện tại.
- `variables`: Mảng biến public (`StorageVariable[]`).
- `credentials`: Mảng khóa bí mật đã mã hóa (`StorageCredential[]`).
- `tableCount`, `variableCount`, `credentialCount`: Computed getters.

---

## 🔒 6. CHUẨN MÃ HÓA BẢO MẬT KHO BÍ MẬT (VAULT CRYPTOGRAPHY)

Chuẩn mã hóa cốt lõi được bảo đảm 100% trong `apps/core/src/core/crypto/`:
1. **Key & IV Derivation**: Thuật toán `EVP_BytesToKey` (MD5 hash Master Passphrase + 8-byte Salt ngẫu nhiên) sinh 32-byte Key và 16-byte IV.
2. **AES-256-CBC Payload**: Mã hóa có padding `Pkcs7`, sinh chuỗi Base64 chuẩn `Salted__<salt><ciphertext>`.
3. **HMAC-SHA256 Integrity Seal**: Tính chữ ký 64 hex bảo vệ chuỗi Base64.
4. **Nguyên lý Zero-Leak**: Giải mã chỉ diễn ra trong RAM khi chạy block `{{secrets.key}}` và giải phóng bộ nhớ ngay lập tức, nghiêm cấm ghi log bí mật.

---

## 🌐 7. DANH MỤC API ENDPOINTS & SSE EVENTS

| Giao Thức | Endpoint / Sự Kiện | Phương Thức | SDK Function Gọi Chuẩn | Mô Tả Nghiệp Vụ |
|---|---|:---:|---|---|
| **REST** | `/api/v1/storage/tables` | `GET` / `POST` | `getStorageTables()` / `createStorageTable()` | Lấy danh sách hoặc tạo bảng SQLite |
| **REST** | `/api/v1/storage/tables/{id}/rows` | `GET` / `POST` | `getStorageTableRows()` / `addStorageTableRow()` | Lấy hoặc thêm dòng dữ liệu vào bảng |
| **REST** | `/api/v1/storage/variables` | `GET` / `POST` | `getStorageVariables()` / `createStorageVariable()` | Lấy danh sách hoặc tạo biến public |
| **REST** | `/api/v1/storage/credentials` | `GET` / `POST` | `getStorageCredentials()` / `createStorageCredential()` | Lấy danh sách hoặc lưu bí mật mã hóa |
| **REST** | `/api/v1/storage/workflows` | `GET` / `POST` | `getStorageWorkflows()` / `createStorageWorkflow()` | Quản lý danh sách và nạp kịch bản từ SQLite Database |
| **REST** | `/api/v1/storage/campaigns` | `GET` / `POST` | `getStorageCampaigns()` / `createStorageCampaign()` | Quản lý danh sách chiến dịch từ SQLite Database |
| **SSE** | `/api/v1/events` | Stream | `globalSseClient` | Nhận sự kiện `storage_table_changed`, `storage_variable_changed` |

---

## 🛡️ 8. TIÊU CHUẨN KIỂM ĐỊNH CHẤT LƯỢNG (AGENT CROSS-CHECK)

1. [ ] Tuyệt đối không quét thư mục đĩa (Zero Folder Scanning); 100% dữ liệu đi qua SQLite REST API.
2. [ ] Bảng dữ liệu hỗ trợ thêm cột động (`+ Add Column`) và hiển thị Visual Form Mode mặc định.
3. [ ] Các khóa bí mật trong tab Credentials luôn hiển thị ở dạng mã hóa, không bao giờ lộ plaintext.
