interface HealthResponse {
    status: string;
    version: string;
    message: string;
}
interface EncryptSecretRequest {
    plaintext: string;
    passphrase?: string;
}
interface EncryptSecretResponse {
    encrypted_secret: string;
}
interface JobHistoryItem {
    id: string;
    name: string;
    status: string;
    created_at: string;
    updated_at: string;
}
interface LogItem {
    id: number;
    type: string;
    message: string;
    created_at: string;
    [key: string]: any;
}
declare class AutomaClient {
    private daemonUrl;
    constructor(daemonUrl?: string);
    /**
     * Kiểm tra trạng thái của Rust Daemon
     */
    checkDaemonHealth(): Promise<HealthResponse>;
    /**
     * Mã hóa chuỗi bảo mật sử dụng AES-256
     */
    encryptSecret(req: EncryptSecretRequest): Promise<EncryptSecretResponse>;
    /**
     * Lấy lịch sử thực thi các Workflows
     */
    getHistory(limit?: number): Promise<JobHistoryItem[]>;
    /**
     * Gửi một Job tới Daemon để chạy
     */
    submitJob(endpoint: string, payload: Record<string, unknown>): Promise<{
        jobId: string;
    }>;
    /**
     * Lấy trạng thái của Job (Tạm thời map với lịch sử)
     */
    getJobStatus(jobId: string): Promise<{
        status: string;
    }>;
    /**
     * Lấy chi tiết Logs của một phiên thực thi Workflow cụ thể
     */
    getJobLogs(jobId: string): Promise<LogItem[]>;
    /**
     * Cài đặt Browser (Stream SSE response qua onProgress)
     */
    installBrowser(onProgress: (message: string) => void): Promise<void>;
    /**
     * Mở luồng Server-Sent Events (SSE) để theo dõi trạng thái realtime
     * Trả về đối tượng EventSource
     */
    connectSse(): EventSource;
}

export { AutomaClient, type EncryptSecretRequest, type EncryptSecretResponse, type HealthResponse, type JobHistoryItem, type LogItem };
