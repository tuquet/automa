export interface HealthResponse {
  status: string;
  version: string;
  message: string;
}

export class AutomaClient {
  private daemonUrl: string;

  constructor(daemonUrl: string = "http://127.0.0.1:8765") {
    this.daemonUrl = daemonUrl;
  }

  /**
   * Kiểm tra trạng thái của Rust Daemon
   */
  async checkDaemonHealth(): Promise<HealthResponse> {
    try {
      const response = await fetch(`${this.daemonUrl}/api/health`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json() as HealthResponse;
    } catch (error) {
      throw new Error(`Không thể kết nối tới Automa Core Daemon: ${error}`);
    }
  }
}
