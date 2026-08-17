var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AutomaClient: () => AutomaClient
});
module.exports = __toCommonJS(index_exports);
var AutomaClient = class {
  daemonUrl;
  constructor(daemonUrl = "http://127.0.0.1:8765") {
    this.daemonUrl = daemonUrl;
  }
  /**
   * Kiểm tra trạng thái của Rust Daemon
   */
  async checkDaemonHealth() {
    const response = await fetch(`${this.daemonUrl}/api/health`);
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    return await response.json();
  }
  /**
   * Mã hóa chuỗi bảo mật sử dụng AES-256
   */
  async encryptSecret(req) {
    const response = await fetch(`${this.daemonUrl}/api/secrets/encrypt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Encryption failed: ${errorData.error || response.statusText}`);
    }
    return await response.json();
  }
  /**
   * Lấy lịch sử thực thi các Workflows
   */
  async getHistory(limit = 50) {
    const response = await fetch(`${this.daemonUrl}/api/history?limit=${limit}`);
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    return await response.json();
  }
  /**
   * Gửi một Job tới Daemon để chạy
   */
  async submitJob(endpoint, payload) {
    const response = await fetch(`${this.daemonUrl}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    return await response.json();
  }
  /**
   * Lấy trạng thái của Job (Tạm thời map với lịch sử)
   */
  async getJobStatus(jobId) {
    const response = await fetch(`${this.daemonUrl}/api/history/${jobId}/status`).catch(() => null);
    if (response && response.ok) {
      return await response.json();
    }
    return { status: "unknown" };
  }
  /**
   * Lấy chi tiết Logs của một phiên thực thi Workflow cụ thể
   */
  async getJobLogs(jobId) {
    const response = await fetch(`${this.daemonUrl}/api/history/${jobId}/logs`);
    if (!response.ok) {
      const oldResponse = await fetch(`${this.daemonUrl}/api/jobs/${jobId}/logs`).catch(() => null);
      if (oldResponse && oldResponse.ok) {
        return (await oldResponse.json()).logs;
      }
      throw new Error(`HTTP error: ${response.status}`);
    }
    return await response.json();
  }
  /**
   * Cài đặt Browser (Stream SSE response qua onProgress)
   */
  async installBrowser(onProgress) {
    const response = await fetch(`${this.daemonUrl}/api/system/install-browser`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ browser: "chrome" })
    });
    if (!response.ok) throw new Error("Daemon returned error");
    if (!response.body) throw new Error("No response body");
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let done = false;
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.substring(6);
            if (dataStr) {
              try {
                const data = JSON.parse(dataStr);
                if (data.type === "progress") {
                  onProgress(`Downloading... ${data.percent}%`);
                } else if (data.type === "info") {
                  onProgress(data.message);
                } else if (data.type === "error") {
                  throw new Error(data.error);
                }
              } catch (_e) {
              }
            }
          }
        }
      }
    }
  }
  /**
   * Mở luồng Server-Sent Events (SSE) để theo dõi trạng thái realtime
   * Trả về đối tượng EventSource
   */
  connectSse() {
    return new EventSource(`${this.daemonUrl}/api/events`);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AutomaClient
});
