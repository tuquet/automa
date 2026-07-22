# Deployment Rules

- **NEVER** deploy, push, or seed data to Production environments (e.g., Supabase Cloud, live servers) unless the user explicitly requests it.
- If a task involves Production databases or Cloud deployment, always ask for permission first and wait for explicit user confirmation before executing any scripts or commands that modify Production state.
# Developer Workflow Alignment

- Always favor executing scripts and processes via the VS Code `tasks.json` definitions (e.g., checking `.vscode/tasks.json` for the correct command and `cwd`) to ensure your execution perfectly mirrors the developer's use case and uses the correct environment.

# Data Sync Architecture Flow

- **Vue UI -> Pinia Store:** Component calls store actions (e.g. workflowStore.insert).
- **Pinia Store -> Browser Local Storage:** Saves offline instantly.
- **Pinia Store -> Dexie IndexedDB syncQueue:** Queues background sync task (recordId, action, timestamp) in storage.js.
- **Dexie IndexedDB -> Ban Message Event:** storage.js monkey-patches Dexie methods to fire `browser.runtime.sendMessage({ name: 'background--TRIGGER_SYNC' })`.
- **Background Script -> BackgroundSyncEngine:** background/index.js listens to TRIGGER_SYNC and calls `BackgroundSyncEngine.triggerSync()` (debounced).
- **BackgroundSyncEngine -> Supabase Cloud:** Reads syncQueue, batches upserts/deletes, and pushes to Supabase Database.
- **CRITICAL KNOWLEDGE:** Background Service Worker in Manifest V3 does NOT hot-reload on file changes. Always reload the extension manually in `chrome://extensions` after editing sync or background scripts.


# CRM FE Sitemap Knowledge

Hệ thống Frontend (crm-fe) hiện tại chỉ có các Router path sau:
- `/`: Login
- `/forbidden`: 403 Forbidden
- `/sales-team`: Sales Team Configuration. **Lưu ý quan trọng**: Màn hình này chứa CẢ 2 danh sách Teams và Employees (Toggle qua lại bằng `viewMode`). Không có route riêng biệt nào tên là `/employees`.
- `/sales-team/:id`: Sales Team Detail
- `/sales-team/employees/:id`: Employee Detail
- `/settings/codebook`: Codebook Management

*Agent Instruction: Không được tự ý đoán URL ngoài các route trên. Nếu cần điều hướng đến màn hình danh sách Employees, hãy dùng `crm.mingxn.site/sales-team`.*

# Git Repository Rules

- **NEVER** use `git commit` or `git push` on your own accord.
- Pushing code to remote is an important, sensitive action. **ONLY the USER** is allowed to push code and use `git push`.
- Unless explicitly asked by the USER, leave all completed changes in the Staging Area or Working Directory for the USER to review and commit manually.
