---
title: Campaign Preview
date: 2026-08-05
tags:
  - vscode
  - feature
  - Campaign
  - custom-editor
---

# Campaign Preview

## Tổng quan
Campaign Preview là Custom Editor dành cho định dạng `*.Campaigns.json` (hoặc `*.Campaign.json`), giúp thiết lập, trực quan hóa và giám sát trạng thái thực thi song song của các nhóm tiến trình (Campaign) trong Automa.

## Kiến trúc Implementation
File nguồn chính: [CampaignPreviewEditorProvider.ts](file:///C:/Users/pn.tund2/Documents/Repository/automa-ecosystem/automa-vscode/src/providers/CampaignPreviewEditorProvider.ts) (`src/providers/CampaignPreviewEditorProvider.ts`)
View HTML: `src/webview/Campaign-preview.html`

Class `CampaignPreviewEditorProvider` implements `vscode.CustomTextEditorProvider` để đăng ký loại view `automa.CampaignPreview`.

### Các tính năng chính trong Code

1. **Thu thập dữ liệu tham chiếu (Dictionaries)**
   - Để hiển thị danh sách Dropdown cho các Task và Profile, Provider gọi hai hàm:
     - `getWorkflowDictionary()`: Tìm kiếm tất cả `**/*.automa.json` trong Workspace để lập ánh xạ `ID -> Name`.
     - `getProfileDictionary()`: Tìm kiếm tất cả `**/*.{profile.json,profile.json}` để lập ánh xạ Profile `ID -> Name`.
   - Dữ liệu này được gửi tới Webview qua message `type: "update"`.

2. **Giao tiếp Webview & Document Sync**
   - Lắng nghe sự thay đổi của file (`onDidChangeTextDocument`) để postMessage tới UI để làm mới giao diện.
   - Webview UI hỗ trợ thao tác kéo-thả, chỉnh sửa thuộc tính. Khi người dùng bấm lưu, thông điệp `save-Campaign` được gửi về kèm JSON content mới, Provider thực thi `WorkspaceEdit` để overwrite file.
   - Các hành động `run-Campaign` và `stop-Campaign` từ UI sẽ trigger trực tiếp các Command của VS Code (`automa.runCampaign`, `automa.stopCampaign`).

3. **Telemetry & Real-time Tracking**
   - Đăng ký lắng nghe sự kiện từ `TaskRunner.telemetryEmitter`.
   - Bất cứ khi nào background daemon báo cáo trạng thái execution, kiện `telemetry` được nhận và Provider chuyển tiếp thẳng vào Webview để UI cập nhật trạng thái Live (Đang chạy, Lỗi, Hoàn thành...) cho từng Node / Task trong Campaign.

> [!WARNING]
> Telemetry listener phải được dọn dẹp cẩn thận trong `webviewPanel.onDidDispose` bằng cách gọi `off("telemetry")`, tránh gây rò rỉ bộ nhớ (Memory Leak) khi đóng/mở panel nhiều lần.
