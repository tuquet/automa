export interface TelemetryPayload {
    jobId: string;
    accountId?: string;
    proxyId?: string;
    status: 'success' | 'error';
    duration?: number;
    error?: string;
}
export declare class TelemetryService {
    private readonly logger;
    processTelemetry(payload: TelemetryPayload): Promise<void>;
    private updateAccountTrustScore;
    private updateProxyTrustScore;
}
