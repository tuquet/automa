import { ConfigService } from '@nestjs/config';
export declare class CliWorkerService {
    private configService;
    private readonly logger;
    private readonly workerUrl;
    constructor(configService: ConfigService);
    dispatchJob(payload: any): Promise<any>;
}
