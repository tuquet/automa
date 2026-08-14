---
title: Browser Management
date: 2026-08-05
tags:
  - cli
  - browser
  - cdp
---

# Browser Management (Quản Lý Trình Duyệt)

> [!info]
> Khả năng quản lý trình duyệt linh hoạt là cốt lõi để Automa CLI vận hành headless scraping, tự động hoá, hay thiết kế workflow trên Automa Studio. Nó dùng CDP (Chrome DevTools Protocol) để giao tiếp ở cấp thấp.

## Quản lý và Khởi chạy (Launch & Resolve)

- **`BrowserResolver` / `BrowserLauncher`**: Định tuyến và tìm kiếm file thực thi (executable) của Chromium/Chrome/Edge/Brave. CLI cũng cung cấp sẵn lệnh `automa install-browser` để tải phiên bản Chromium `latest` chạy hoàn toàn độc lập (cô lập khỏi profile chính).
- Trình duyệt khởi chạy với cờ đặc biệt để:
  1. Load Automa Extension unpackaged (`--load-extension=...`).
  2. Bật CDP debugging port (giúp CLI tương tác).
  3. Bypass các cảnh báo "Chrome for testing" nếu có.

## Tương tác với Extension (MV3)

Do Automa dùng Manifest V3, CLI không thể dùng background page để thực thi trực tiếp mọi thứ, vì service worker của MV3 có thể bị tạm ngưng (sleep). CLI giải quyết bằng cách:

1. **CDP Polling**: Gắn trực tiếp vào port CDP, đợi Service Worker của Extension `automa-ex` khởi động và sẵn sàng.
2. **Offscreen Document**: Trong một số thao tác phức tạp, trình duyệt sẽ gọi `chrome.offscreen.createDocument()` để giữ kết nối không bị đứt.
3. **Studio Popup**: Ở lệnh `automa studio`, CLI tạo một popup Chrome kết nối với Studio URL (`newtab.html#/workflows/<id>`), cho phép giao diện Studio mở lên trực tiếp từ local. Tính năng Live Sync được quản lý bởi `StudioManager`.

## Campaign & Chạy Song Song (Concurrency)

- **`BrowserManager` & `BrowserQueue`**: Quản lý nhiều phiên trình duyệt cùng lúc.
- Ở lệnh `automa Campaign`, `CampaignOrchestrator` sinh ra nhiều process trình duyệt, mỗi trình duyệt chạy trên 1 User Data Directory / Profile tạm biệt lập hoàn toàn.
- Tuỳ vào chế độ (`queue`, `parallel`, `skip`), hệ thống sẽ cấp phát tài nguyên RAM và điều phối trình duyệt để tối ưu tài nguyên máy khi chạy chục tiến trình scraper cùng lúc.
