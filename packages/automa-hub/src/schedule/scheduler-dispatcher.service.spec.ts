import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerDispatcherService } from './scheduler-dispatcher.service';
import { ScheduleService } from './schedule.service';
import { CampaignService } from '../campaign/campaign.service';
import { SchedulerRegistry } from '@nestjs/schedule';

jest.mock('@automa/core', () => ({}));


describe('SchedulerDispatcherService', () => {
  let service: SchedulerDispatcherService;
  let scheduleService: ScheduleService;
  let campaignService: CampaignService;
  let schedulerRegistry: SchedulerRegistry;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulerDispatcherService,
        {
          provide: ScheduleService,
          useValue: {
            getAllSchedules: jest.fn(),
          },
        },
        {
          provide: CampaignService,
          useValue: {
            runCampaign: jest.fn(),
            getCampaignAccounts: jest.fn(),
          },
        },
        {
          provide: SchedulerRegistry,
          useValue: {
            addCronJob: jest.fn(),
            deleteCronJob: jest.fn(),
            getCronJobs: jest.fn().mockReturnValue(new Map()),
          },
        },
      ],
    }).compile();

    service = module.get<SchedulerDispatcherService>(SchedulerDispatcherService);
    scheduleService = module.get<ScheduleService>(ScheduleService);
    campaignService = module.get<CampaignService>(CampaignService);
    schedulerRegistry = module.get<SchedulerRegistry>(SchedulerRegistry);
  });

  describe('onModuleInit', () => {
    it('should register active schedules as cron jobs', async () => {
      const mockSchedules = [
        { id: 's1', cronExpr: '0 * * * *', status: 'active', campaignId: 'c1', workflowPath: '/path' },
        { id: 's2', cronExpr: '0 * * * *', status: 'paused', campaignId: 'c2', workflowPath: '/path2' }, // should be ignored
      ];
      jest.spyOn(scheduleService, 'getAllSchedules').mockResolvedValue(mockSchedules as any);
      
      await service.onModuleInit();
      
      expect(scheduleService.getAllSchedules).toHaveBeenCalled();
      expect(schedulerRegistry.addCronJob).toHaveBeenCalledTimes(1);
      expect(schedulerRegistry.addCronJob).toHaveBeenCalledWith('schedule_s1', expect.anything());
    });
  });

  describe('dispatchCampaign', () => {
    it('should fetch members and dispatch to campaign service respecting concurrency', async () => {
      const mockSchedule = { id: 's1', campaignId: 'c1', workflowPath: '/my/workflow.json', concurrency: 2 };
      const mockMembers = [{ accountId: 'acc1' }, { accountId: 'acc2' }, { accountId: 'acc3' }];
      
      jest.spyOn(campaignService, 'getCampaignAccounts').mockResolvedValue(mockMembers as any);
      jest.spyOn(campaignService, 'runCampaign').mockResolvedValue(true as any);

      await service.dispatchCampaign(mockSchedule as any);

      expect(campaignService.getCampaignAccounts).toHaveBeenCalledWith('c1');
      // Should have called runCampaign 3 times
      expect(campaignService.runCampaign).toHaveBeenCalledTimes(3);
      expect(campaignService.runCampaign).toHaveBeenCalledWith(expect.objectContaining({
        workflowPath: '/my/workflow.json',
        accountId: 'acc1',
      }));
    });
  });
});
