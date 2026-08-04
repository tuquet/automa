---
name: automa-cli-browser-launcher
description: Mẫu chuẩn OOP để khởi chạy trình duyệt bằng exec/spawn và kết nối qua CDP (automa-cli).
---

# Browser Launcher CDP (No-Playwright Mode)

Khi cần phát triển hoặc refactor tính năng mở trình duyệt cho `automa-cli` mà không phụ thuộc vào `puppeteer.launch()`, hãy áp dụng class pattern sau. Pattern này hỗ trợ mở trình duyệt độc lập bằng `execFile`, lấy CDP websocket, kết nối qua `puppeteer-core`, và quản lý tiến trình (PID) an toàn.

## Class Architecture (OOP)

Sử dụng OOP để quản lý cấu hình (options), trạng thái tiến trình (process), và kết nối websocket.

```typescript
import { execFile, ChildProcess } from 'child_process';
import puppeteer, { Browser } from 'puppeteer-core';
import treeKill from 'tree-kill';

export interface BrowserLauncherOptions {
  executablePath: string;
  userDataDir: string;
  debuggingPort: number;
  extensionPaths?: string[];
  customArgs?: string[];
}

export class BrowserLauncher {
  private options: BrowserLauncherOptions;
  private process: ChildProcess | null = null;
  private browser: Browser | null = null;
  private wsUrl: string | null = null;

  constructor(options: BrowserLauncherOptions) {
    this.options = options;
  }

  /**
   * Khởi chạy trình duyệt dưới dạng tiến trình độc lập
   */
  public async launch(): Promise<string> {
    const args = this.buildArguments();
    
    // Sử dụng execFile thay vì spawn để dễ dàng truyền params và env
    this.process = execFile(this.options.executablePath, args);
    
    if (!this.process.pid) {
      throw new Error("Không thể khởi chạy tiến trình trình duyệt.");
    }
    
    console.log(`[BrowserLauncher] Trình duyệt đang chạy tại PID: ${this.process.pid}`);
    
    // Đợi CDP endpoint sẵn sàng
    this.wsUrl = await this.waitForWsUrl();
    return this.wsUrl;
  }

  /**
   * Kết nối Puppeteer-core tới trình duyệt đã khởi chạy
   */
  public async connect(): Promise<Browser> {
    if (!this.wsUrl) {
      throw new Error("Trình duyệt chưa được khởi chạy hoặc chưa có WebSocket URL.");
    }

    this.browser = await puppeteer.connect({
      browserWSEndpoint: this.wsUrl,
      defaultViewport: null
    });

    return this.browser;
  }

  /**
   * Đóng trình duyệt và kill toàn bộ process tree
   */
  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.disconnect(); // Ngắt kết nối puppeteer trước
      this.browser = null;
    }

    if (this.process && this.process.pid) {
      return new Promise((resolve, reject) => {
        // Dùng tree-kill để dọn dẹp sạch sẽ các process con (như GPU process, Utility process)
        treeKill(this.process!.pid!, 'SIGKILL', (err) => {
          if (err) {
            console.error(`[BrowserLauncher] Lỗi khi kill PID ${this.process!.pid}:`, err);
            reject(err);
          } else {
            console.log(`[BrowserLauncher] Đã đóng thành công trình duyệt (PID: ${this.process!.pid})`);
            this.process = null;
            resolve();
          }
        });
      });
    }
  }

  /**
   * Lấy WebSocket Debugger URL bằng cách polling
   */
  private async waitForWsUrl(maxAttempts = 30, intervalMs = 500): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${this.options.debuggingPort}/json/version`);
        const data = await res.json();
        if (data.webSocketDebuggerUrl) {
          return data.webSocketDebuggerUrl;
        }
      } catch (e) {
        // Chờ và thử lại
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }
    throw new Error("Timeout: Không thể kết nối tới Chrome CDP Endpoint.");
  }

  /**
   * Xây dựng danh sách params để truyền vào execFile
   */
  private buildArguments(): string[] {
    const args = [
      `--remote-debugging-port=${this.options.debuggingPort}`,
      `--user-data-dir=${this.options.userDataDir}`,
      '--no-first-run',
      '--password-store=basic',
      '--restore-last-session'
    ];

    if (this.options.extensionPaths && this.options.extensionPaths.length > 0) {
      args.push(`--load-extension=${this.options.extensionPaths.join(',')}`);
    }

    if (this.options.customArgs) {
      args.push(...this.options.customArgs);
    }

    return args;
  }
}
```

## Lợi ích của kiến trúc này
1. **Encapsulation**: Ẩn giấu logic polling WebSocket và cấu hình params bên trong một class chuyên biệt.
2. **Resource Management**: Dễ dàng dọn dẹp bộ nhớ/process với method `close()` bằng package `tree-kill`.
3. **Decoupling**: Tách rời việc khởi chạy (`launch()`) và việc gắn kết Puppeteer (`connect()`), có thể phục vụ nhiều kịch bản (chỉ mở trình duyệt, hoặc vừa mở vừa tự động điều khiển).
4. **Anti-Detect Friendly**: Cách tiếp cận này hoàn toàn minh bạch với hệ điều hành và trông giống hệt như người dùng bấm đúp chuột vào trình duyệt bình thường, qua mặt các hệ thống detect Puppeteer thông dụng.

## 5. Phân biệt Chrome for Testing và Pure Chromium
Từ phiên bản v114, Puppeteer mặc định tải về `Chrome for Testing` (Browser.CHROME). Phiên bản này **bị gắn chặt (hardcoded)** cảnh báo "Chrome for testing is only for automated testing" trên Title bar, không thể tắt bằng cờ `--disable-infobars`.
* **Quy tắc**: Khi cấu hình yêu cầu cài đặt hoặc tải `chromium` (tức là mong muốn có một trình duyệt sạch sẽ, không cảnh báo), **PHẢI** chỉ định `Browser.CHROMIUM` và tag `latest` khi sử dụng `@puppeteer/browsers`, thay vì dùng `Browser.CHROME`.
