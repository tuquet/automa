import { Controller, Post, Body } from '@nestjs/common';
import { CampaignService } from './campaign.service';

@Controller('api/mmo/campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post('run')
  async runCampaign(@Body() body: { workflowPath: string, accountId?: string }) {
    if (!body.workflowPath) {
      throw new Error("workflowPath is required");
    }
    const result = await this.campaignService.runCampaign(body.workflowPath, body.accountId);
    return { success: true, result };
  }
}
