import { CliWorkerService } from './cli-worker.service';
import { RunCampaignDto } from './dto/run-campaign.dto';
export declare class CampaignService {
    private readonly cliWorkerService;
    private readonly logger;
    constructor(cliWorkerService: CliWorkerService);
    runCampaign(dto: RunCampaignDto): Promise<any>;
    private getAvailableAccount;
    private getAliveProxy;
    private getBrowserProfile;
    private buildPayload;
}
