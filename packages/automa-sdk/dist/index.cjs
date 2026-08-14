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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AutomaClient
});
