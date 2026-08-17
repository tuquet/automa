import { Test, TestingModule } from '@nestjs/testing';
import { CampaignController } from './campaign.controller';
import { CampaignService } from './campaign.service';
import { vi } from 'vitest';

describe('CampaignController', () => {
  let controller: CampaignController;
  let campaignService: CampaignService;

  const mockCampaignService = {
    runCampaign: vi.fn().mockResolvedValue({ jobId: '123' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignController],
      providers: [
        { provide: CampaignService, useValue: mockCampaignService },
      ],
    }).compile();

    controller = module.get<CampaignController>(CampaignController);
    campaignService = module.get<CampaignService>(CampaignService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should run campaign', async () => {
    const dto = { workflowPath: 'path' };
    const result = await controller.runCampaign(dto as any);
    expect(result).toEqual({ success: true, result: { jobId: '123' } });
    expect(campaignService.runCampaign).toHaveBeenCalledWith(dto);
  });
});
