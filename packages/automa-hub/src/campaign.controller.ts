/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller, Post, Body } from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { RunCampaignDto } from './dto/run-campaign.dto';

@Controller('api/mmo/campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post('run')
  async runCampaign(@Body() dto: RunCampaignDto) {
    const result = await this.campaignService.runCampaign(dto);

    return { success: true, result };
  }
}
