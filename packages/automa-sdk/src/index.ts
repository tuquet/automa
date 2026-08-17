export interface HealthResponse {
  status: string;
  version: string;
  message: string;
}

export interface EncryptSecretRequest {
  plaintext: string;
  passphrase?: string;
}

export interface EncryptSecretResponse {
  encrypted_secret: string;
}

export interface JobHistoryItem {
  id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface LogItem {
  id: number;
  type: string;
  message: string;
  created_at: string;
  [key: string]: any;
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
    const response = await fetch(`${this.daemonUrl}/api/health`);
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    return await response.json() as HealthResponse;
  }

  /**
   * Mã hóa chuỗi bảo mật sử dụng AES-256
   */
  async encryptSecret(req: EncryptSecretRequest): Promise<EncryptSecretResponse> {
    const response = await fetch(`${this.daemonUrl}/api/secrets/encrypt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Encryption failed: ${errorData.error || response.statusText}`);
    }
    return await response.json() as EncryptSecretResponse;
  }

  /**
   * Lấy lịch sử thực thi các Workflows
   */
  async getHistory(limit: number = 50): Promise<JobHistoryItem[]> {
    const response = await fetch(`${this.daemonUrl}/api/history?limit=${limit}`);
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    return await response.json() as JobHistoryItem[];
  }

  /**
   * Gửi một Job tới Daemon để chạy
   */
  async submitJob(endpoint: string, payload: Record<string, unknown>): Promise<{ jobId: string }> {
    const response = await fetch(`${this.daemonUrl}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    return await response.json() as { jobId: string };
  }

  /**
   * Lấy trạng thái của Job (Tạm thời map với lịch sử)
   */
  async getJobStatus(jobId: string): Promise<{ status: string }> {
    // Nếu daemon có endpoint /api/history/:id, ta sẽ gọi nó
    // Tạm thời giả lập fallback hoặc gọi tới endpoint có sẵn
    const response = await fetch(`${this.daemonUrl}/api/history/${jobId}/status`).catch(() => null);
    if (response && response.ok) {
        return await response.json() as { status: string };
    }
    return { status: "unknown" };
  }

  /**
   * Lấy chi tiết Logs của một phiên thực thi Workflow cụ thể
   */
  async getJobLogs(jobId: string): Promise<LogItem[]> {
    const response = await fetch(`${this.daemonUrl}/api/history/${jobId}/logs`);
    if (!response.ok) {
        // Fallback backward compatibility cho extension cũ
        const oldResponse = await fetch(`${this.daemonUrl}/api/jobs/${jobId}/logs`).catch(() => null);
        if (oldResponse && oldResponse.ok) {
           return (await oldResponse.json() as any).logs as LogItem[];
        }
        throw new Error(`HTTP error: ${response.status}`);
    }
    return await response.json() as LogItem[];
  }

  /**
   * Cài đặt Browser (Stream SSE response qua onProgress)
   */
  async installBrowser(onProgress: (message: string) => void): Promise<void> {
    const response = await fetch(`${this.daemonUrl}/api/system/install-browser`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ browser: "chrome" }),
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
              let data: any = null;
              try {
                data = JSON.parse(dataStr);
              } catch (_e) {}
              if (data) {
                if (data.type === "progress") {
                  onProgress(`Downloading... ${data.percent}%`);
                } else if (data.type === "info") {
                  onProgress(data.message);
                } else if (data.type === "error") {
                  throw new Error(data.error);
                }
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
  connectSse(): EventSource {
    return new EventSource(`${this.daemonUrl}/api/events`);
  }
}

