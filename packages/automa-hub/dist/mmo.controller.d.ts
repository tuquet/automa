import { TelemetryService } from './telemetry.service';
export declare class MmoController {
    private readonly telemetryService;
    constructor(telemetryService: TelemetryService);
    getAccounts(): Promise<{
        id: string;
        platform: string;
        username: string;
        password: string | null;
        twoFactorSecret: string | null;
        cookies: string | null;
        proxyId: string | null;
        status: string;
        trustScore: number | null;
        createdAt: string | null;
        updatedAt: string | null;
    }[]>;
    createAccount(body: any): Promise<{
        id: string;
        success: boolean;
    }>;
    getProxies(): Promise<{
        id: string;
        username: string | null;
        password: string | null;
        status: string;
        trustScore: number | null;
        createdAt: string | null;
        host: string;
        port: number;
        protocol: string | null;
        lastChecked: string | null;
    }[]>;
    createProxy(body: any): Promise<{
        id: string;
        success: boolean;
    }>;
    reportTelemetry(body: any): Promise<{
        success: boolean;
    }>;
}
