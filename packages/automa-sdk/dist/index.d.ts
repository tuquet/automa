interface HealthResponse {
    status: string;
    version: string;
    message: string;
}
declare class AutomaClient {
    private daemonUrl;
    constructor(daemonUrl?: string);
    /**
     * Kiểm tra trạng thái của Rust Daemon
     */
    checkDaemonHealth(): Promise<HealthResponse>;
}

export { AutomaClient, type HealthResponse };
