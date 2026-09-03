# 🛡️ Automa Minimalist UI/UX Audit Log (5-Round Periodic Audit)

> **Standard Protocol**: [`skills/automa-minimalist-ux-audit/SKILL.md`](file:///c:/Users/pn.tund2/Documents/Repository/automa-ecosystem/skills/automa-minimalist-ux-audit/SKILL.md)  
> **Cadence**: 10 phút / lần qua công cụ `schedule` (Tổng cộng 5 vòng rà soát chuyên sâu).  
> **Mục tiêu**: Loại bỏ triệt để hành động trùng lặp (Duplicate CTAs), text rác/marketing fluff (Rule of 1–3 Words), giảm tải thị giác (Visual Noise), và chuẩn hóa bố cục 4 tầng (Header $\rightarrow$ Toolbar $\rightarrow$ Content $\rightarrow$ Footer).

---

## 📌 Bảng Điều Khiển Tiến Độ 5 Vòng (Audit Progress Matrix)

| Vòng | Phân Hệ / Module Mục Tiêu | Thời Điểm | Trạng Thái | Số Lỗi Phát Hiện |
| :--- | :--- | :--- | :--- | :--- |
| **Vòng 1** | **`automa-webe/src/studio`** (Web Studio Canvas & Modals) | Khởi động ngay | ✅ Hoàn thành | 8 lỗi |
| **Vòng 2** | **`automa-desk`** (Desktop Tauri App & Action Panels) | +10 phút | ✅ Hoàn thành | 8 lỗi |
| **Vòng 3** | **`automa-vsce`** (VS Code Extension Views & Tree Providers) | +20 phút | ✅ Hoàn thành | 7 lỗi |
| **Vòng 4** | **`@automa/ui`** (Shared Design System & Virtualized Tables) | +30 phút | ⏳ Đang chờ cron | Đang chờ |
| **Vòng 5** | **Ecosystem Consistency** (Terminology & Button/Select Contracts) | +40 phút | ⏳ Đang chờ cron | Đang chờ |

---

## 🔍 VÒNG 1: Rà Soát Chi Tiết `automa-webe/src/studio`

### 1. Trùng Lặp Hành Động (Duplicate Actions / CTAs)
1. **[WorkflowLibraryModal.vue:124] Nút `Close` ở Footer bị thừa**:
   - Modal đã có nút đóng chuẩn ở góc trên bên phải (của Dialog wrapper). Việc đặt thêm nút `Close` ở Footer là lặp lại thao tác đóng.
   - *Đề xuất*: Xóa nút `Close` ở footer hoặc chỉ giữ khi có thao tác hủy form nhập liệu.
2. **[StorageSecretsTab.vue:5-13] Nút `New Secret` xuất hiện cả ở Toolbar lẫn tiêu đề Form**:
   - Khi click nút `New Secret` ở toolbar, form mở ra lại chứa tiêu đề `<KeyRound /> New Secret`.
   - *Đề xuất*: Giữ nút ở Toolbar với nhãn ngắn gọn `New` hoặc `+`, tiêu đề form giữ `New Secret`.
3. **[StudioHeader.vue:249-272] Nút điều khiển WebSocket Debugger dùng thẻ thô thay vì Button Contract**:
   - Các nút Pause, Resume, Stop đang được tạo thủ công bằng `<Button>` thông thường thay vì sử dụng canonical ID `btn.workflow.pause`, `btn.workflow.resume`, `btn.workflow.stop` từ FSM contract.
   - *Đề xuất*: Chuẩn hóa sang `<AutomaButton id="btn.workflow.pause" ... />`.

---

### 2. Rà Soát Microcopy & Text Rác (Text Audit)
1. **[RunWorkflowModal.vue:14] Vi phạm thuật ngữ cấm (`Browser Profile`)**:
   - Nhãn hiển thị `Browser Profile` vi phạm quy chuẩn thuật ngữ trong [`.agents/AGENTS.md`](file:///c:/Users/pn.tund2/Documents/Repository/automa-ecosystem/.agents/AGENTS.md) (nghiêm cấm dùng từ *Profile* hoặc *Member*).
   - *Đề xuất*: Sửa thành `Browser`.
2. **[WorkflowLibraryModal.vue:121-123] Dòng thống kê Footer trùng lặp thông tin**:
   - Dòng chữ `{{ workflows.length }} workflows, {{ campaigns.length }} campaigns` ở chân modal là thừa thãi vì 3 tab phía trên (`Workflows (N)`, `Packages (N)`, `Campaigns (N)`) đã hiển thị số lượng chính xác theo thời gian thực.
   - *Đề xuất*: Xóa dòng text thống kê ở footer theo Tier 4 của SKILL.
3. **[StorageTablesTab.vue:10] Nhãn `Table:` thừa trước dropdown**:
   - Nhãn chữ `Table:` đặt trước dropdown chọn bảng gây chật chội thanh công cụ. Bản thân dropdown đã hiển thị tên bảng và số cột.
   - *Đề xuất*: Xóa nhãn `Table:`.

---

### 3. Giảm Tải Thị Giác Trong Hiển Thị Dữ Liệu (Visual Noise)
1. **[WorkflowLibraryModal.vue:112] Badge `Campaign` trên từng hàng tab Campaigns**:
   - Người dùng đang đứng trong tab **Campaigns**, việc gắn thêm badge xanh lá cây `Campaign` trên mỗi hàng là 100% rác thị giác (visual noise).
   - *Đề xuất*: Xóa badge này, tận dụng không gian hiển thị đường dẫn hoặc số tác vụ.
2. **[StorageSecretsTab.vue:120] Subtitle kỹ thuật `Value: •••••••••••• (Encrypted AES-256)`**:
   - Mọi credential trong hệ thống đều mặc định được mã hóa AES-256 trong SQLite. Chữ `Value:` và `(Encrypted AES-256)` tạo cảm giác nặng nề.
   - *Đề xuất*: Rút gọn thành `••••••••••••`.
3. **[StudioHeader.vue:174-217] Các nút mở modal phụ chiếm dụng chiều ngang trên màn hình lớn**:
   - Các nút `Storage`, `Settings`, `Logs` trên header chứa cả icon lẫn chữ (`<span class="hidden xl:inline">...</span>`), khiến header bị dàn trải khi mở trên màn hình rộng.
   - *Đề xuất*: Chuyển thành icon-only buttons kèm tooltip giống chuẩn của `automa-desk` (`StudioActionHeader.vue`).

---

### 4. Kế Hoạch Khắc Phục Vòng 1 (Action Items)
- [ ] Sửa `RunWorkflowModal.vue`: Đổi nhãn `Browser Profile` $\rightarrow$ `Browser`.
- [ ] Tinh giản `WorkflowLibraryModal.vue`: Xóa badge `Campaign` lặp lại, xóa text thống kê footer.
- [ ] Tinh giản `StorageSecretsTab.vue`: Xóa chữ `Value:` và `(Encrypted AES-256)` rườm rà.
- [ ] Tinh giản `StorageTablesTab.vue`: Xóa nhãn `Table:` trước dropdown.

---

## 🔍 VÒNG 2: Rà Soát Chi Tiết `automa-desk`

### 1. Trùng Lặp Hành Động (Duplicate Actions / CTAs)
1. **[StoragePanel.vue:291-298] Nút `btn.storage.refresh` bị ẩn hoàn toàn trong Modal**:
   - Khi `StoragePanel` được nhúng vào `StorageModal` với `:show-header="false"`, nút refresh của panel bị ẩn và modal header cũng không có nút refresh, khiến người dùng không có cách làm mới dữ liệu storage nếu không đổi tab.
   - *Đề xuất*: Chuyển nút Refresh vào thanh Toolbar ngay cạnh TabsList (`Tables`, `Variables`, `Credentials`).
2. **[BrowserQuickPickModal.vue:65] Chữ `Select` lặp lại trên từng thẻ Browser**:
   - Mỗi item browser trong danh sách đã là một button có hiệu ứng hover border xanh và active scale, việc hiển thị thêm chữ `Select` và mũi tên `ChevronRight` khi hover là thao tác thừa thãi và gây xao nhãng thị giác.
   - *Đề xuất*: Xóa nhãn `Select`, chỉ giữ lại card bấm trực tiếp.

---

### 2. Rà Soát Microcopy & Text Rác (Text Audit)
1. **[BrowserQuickPickModal.vue:5, 15] Vi phạm thuật ngữ cấm (`cachedProfiles`, `profileId`)**:
   - Biến `cachedProfiles` và tham số hàm `profileId: string` vi phạm quy tắc thuật ngữ chuẩn Monorepo trong `.agents/AGENTS.md` (Domain Terminology: Anti-detect browser entity is **`Browser`**, NEVER `Profile` or `Member`).
   - *Đề xuất*: Đổi thành `cachedBrowsers`, `browserId`.
2. **[ExecutionConsole.vue:12] Tiêu đề mặc định vượt quá 3 từ (Fluff Words)**:
   - Chuỗi tiêu đề fallback `'Execution Logs & Diagnostics'` (4 từ).
   - *Đề xuất*: Rút gọn còn 2 từ: `'Execution Logs'` hoặc `'Job Console'`.
3. **[CommandPaletteDialog.vue:172] Text trạng thái rỗng chưa tối giản**:
   - `No commands found` (3 từ).
   - *Đề xuất*: Rút gọn thành `No commands` (2 từ).
4. **[BrowsersPanel.vue:114] Tooltip dài dòng cho nút hủy diệt**:
   - `title="Kill all running Chromium processes"` $\rightarrow$ Đề xuất: `title="Kill all browsers"`.

---

### 3. Giảm Tải Thị Giác Trong Hiển Thị Dữ Liệu (Visual Noise)
1. **[AppTitleBar.vue:39] Dấu chỉ thị Unsaved dạng dấu sao `*` thay vì dot indicator `●`**:
   - `AppTitleBar.vue` dùng dấu sao `*` vàng `<span v-if="isDirty" class="text-amber-500 ml-0.5 font-bold">*</span>`, không đồng bộ với dot indicator `●` (`size-1.5 rounded-full bg-amber-500`) của `StudioActionHeader` và `CampaignMatrixView`.
   - *Đề xuất*: Chuẩn hóa sang amber dot indicator `●`.
2. **[BrowsersPanel.vue:106] Không đồng bộ font-weight và kích thước tiêu đề**:
   - `BrowsersPanel` dùng `font-bold text-sm`, trong khi `HistoryPanel` và `StoragePanel` dùng `font-semibold text-xs`.
   - *Đề xuất*: Chuẩn hóa đồng loạt `font-semibold text-xs`.
3. **[StoragePanel.vue:321-329] Thẻ `<select>` thô cứng giữa giao diện Shadcn**:
   - Thẻ `<select>` chọn bảng SQLite trong thanh Tabs đang dùng thẻ HTML gốc với chiều cao `h-7`, thiếu bo góc và viền đồng bộ với design system `@automa/ui`.
   - *Đề xuất*: Chuẩn hóa styling theo Shadcn Select hoặc remote select.

---

### 4. Kế Hoạch Khắc Phục Vòng 2 (Action Items)
- [ ] Sửa `BrowserQuickPickModal.vue`: Đổi `cachedProfiles` $\rightarrow$ `cachedBrowsers`, xóa chữ `Select` thừa trên hover.
- [ ] Sửa `AppTitleBar.vue`: Đổi dấu sao `*` $\rightarrow$ amber dot `●`.
- [ ] Sửa `ExecutionConsole.vue`: Rút gọn tiêu đề `'Execution Logs'`.
- [ ] Sửa `CommandPaletteDialog.vue`: Đổi `No commands found` $\rightarrow$ `No commands`.
- [ ] Sửa `BrowsersPanel.vue`: Chuẩn hóa tiêu đề `font-semibold text-xs`.

---

## 🔍 VÒNG 3: Rà Soát Chi Tiết `automa-vsce`

### 1. Trùng Lặp Hành Động (Duplicate Actions / CTAs)
1. **[BrowserFleetPanelView.vue:77-80] Modal xác nhận xóa `ConfirmationModal` lồng lặp**:
   - `BrowserDataTable` đã trang bị các nút action trên từng hàng. Việc mở thêm `ConfirmationModal` ngoài tầng view với lời thoại dài dòng gây gián đoạn trải nghiệm của người dùng.
   - *Đề xuất*: Tinh giản hộp thoại xác nhận thành inline popup hoặc micro-dialog gọn nhẹ.
2. **[WorkflowEditorView.vue:320-335] Nút Pause/Resume Live Debugger dùng thẻ thô**:
   - Tương tự như `StudioHeader.vue`, các nút Pause/Resume debugger trong `WorkflowEditorView` đang dùng các thẻ button tùy biến thay vì canonical Button IDs từ FSM engine.
   - *Đề xuất*: Chuẩn hóa theo `btn.workflow.pause`, `btn.workflow.resume`.

---

### 2. Rà Soát Microcopy & Text Rác (Text Audit)
1. **[BrowserFleetPanelView.vue:88-89] Vi phạm nghiêm ngặt thuật ngữ cấm (`Profile`)**:
   - Tiêu đề `title="Delete Browser Profile"` và thông báo `message="Are you sure you want to delete this browser profile? This action cannot be undone."` sử dụng từ cấm `Profile`.
   - *Đề xuất*: Sửa thành `title="Delete Browser"` và câu hỏi tối giản: `Delete this browser?`.
2. **[SingleBrowserEditorView.vue:104] Placeholder chứa từ cấm `Profile`**:
   - `placeholder="e.g. Marketing Profile"`.
   - *Đề xuất*: Sửa thành `placeholder="e.g. Chrome 1"` hoặc `placeholder="Browser name..."`.
3. **[BrowserFleetPanelView.vue:65, 67] Text thông báo daemon offline rườm rà**:
   - `Automa Core Daemon is offline` $\rightarrow$ Đề xuất: `Daemon offline`.
   - Nút `Start Daemon` $\rightarrow$ `Start`.
4. **[WelcomePanel.ts:180] Văn bản tiếp thị dài dòng (Marketing Fluff)**:
   - `<p>Create, manage, and run high-performance browser automations directly within VS Code powered by the Rust Core Engine.</p>`.
   - *Đề xuất*: Rút gọn còn 1 câu ngắn: `<p>Browser automation engine for VS Code.</p>`.
5. **[SingleBrowserEditorView.vue:66] Tooltip nút Default quá dài**:
   - `title="Set this browser as default for running workflows"` $\rightarrow$ `title="Set as default"`.

---

### 3. Giảm Tải Thị Giác Trong Hiển Thị Dữ Liệu (Visual Noise)
1. **[TableView.vue:208-214] Cột số thứ tự `#` (Index column) không cần thiết**:
   - Tương tự như đã refactor ở `HistoryPanel.vue`, cột `#` làm chật bảng ảo hóa `VirtualDataTable` trong VS Code webview, nơi các cột dữ liệu SQLite thực tế mới là thông tin quan trọng.
   - *Đề xuất*: Xóa cột `#` trong `virtualColumns`.
2. **[SingleBrowserEditorView.vue:128] Khối JSON thô bo viền nặng nề**:
   - Khối `<pre>` chứa `JSON.stringify` toàn bộ object tạo mảng chữ đơn điệu, thiếu khoảng thở và bo viền nặng (`border-[var(--vscode-panel-border)]`).
   - *Đề xuất*: Rút gọn padding và làm dịu viền thẻ.

---

### 4. Kế Hoạch Khắc Phục Vòng 3 (Action Items)
- [ ] Sửa `BrowserFleetPanelView.vue`: Xóa từ cấm `Profile`, rút gọn text offline và nút start.
- [ ] Sửa `SingleBrowserEditorView.vue`: Đổi placeholder `Marketing Profile` $\rightarrow$ `Browser name...`, rút gọn tooltip.
- [ ] Sửa `TableView.vue`: Bỏ cột `#` index khỏi virtual columns.
- [ ] Sửa `WelcomePanel.ts`: Cắt bỏ đoạn văn marketing fluff.

---

*(Các vòng tiếp theo sẽ tự động được thu thập và cập nhật vào file này sau mỗi 10 phút)*
