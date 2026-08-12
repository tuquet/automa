import { CampaignService } from './campaign.service';
export declare class CampaignController {
    private readonly campaignService;
    constructor(campaignService: CampaignService);
    runCampaign(body: {
        workflowPath: string;
        accountId?: string;
    }): Promise<{
        success: boolean;
        result: any;
    }>;
}
