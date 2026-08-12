import { CampaignService } from './campaign.service';
import { RunCampaignDto } from './dto/run-campaign.dto';
export declare class CampaignController {
    private readonly campaignService;
    constructor(campaignService: CampaignService);
    runCampaign(dto: RunCampaignDto): Promise<{
        success: boolean;
        result: any;
    }>;
}
