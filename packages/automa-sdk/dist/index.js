// src/index.ts
var AutomaClient = class {
  daemonUrl;
  constructor(daemonUrl = "http://127.0.0.1:8765") {
    this.daemonUrl = daemonUrl;
  }
  /**
   * Kiểm tra trạng thái của Rust Daemon
   */
  async checkDaemonHealth() {
    try {
      const response = await fetch(`${this.daemonUrl}/api/health`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`Kh\xF4ng th\u1EC3 k\u1EBFt n\u1ED1i t\u1EDBi Automa Core Daemon: ${error}`);
    }
  }
};
export {
  AutomaClient
};
