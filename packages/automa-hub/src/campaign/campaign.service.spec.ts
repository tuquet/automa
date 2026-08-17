import { Test, TestingModule } from '@nestjs/testing';
import { CampaignService } from './campaign.service';
import { CliWorkerService } from '../cli-worker/cli-worker.service';
import { vi } from 'vitest';

const mockDb = vi.hoisted(() => ({
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([]),
}));

vi.mock('@automa/core', () => ({
  assetsDb: mockDb,
  accounts: { id: 'id', status: 'status' },
  proxies: { status: 'status' },
  browserProfiles: { accountId: 'accountId' },
  campaignAccounts: { campaignId: 'campaignId' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn().mockReturnValue('eq'),
  isNull: vi.fn().mockReturnValue('isNull'),
}));

describe('CampaignService', () => {
  let service: CampaignService;
  let cliWorkerService: CliWorkerService;

  const mockCliWorkerService = {
    dispatchJob: vi.fn().mockResolvedValue({ jobId: 'job1' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignService,
        { provide: CliWorkerService, useValue: mockCliWorkerService },
      ],
    }).compile();

    service = module.get<CampaignService>(CampaignService);
    cliWorkerService = module.get<CliWorkerService>(CliWorkerService);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCampaignAccounts', () => {
    it('should return accounts', async () => {
      mockDb.where.mockResolvedValueOnce([{ id: 'acc1' }]);
      const result = await service.getCampaignAccounts('camp1');
      expect(result).toEqual([{ id: 'acc1' }]);
    });
  });

  describe('runCampaign', () => {
    it('should run campaign successfully', async () => {
      mockDb.limit.mockResolvedValueOnce([{ id: 'acc1', cookies: 'cook' }]);
      mockDb.limit.mockResolvedValueOnce([{ id: 'proxy1', protocol: 'http', host: 'localhost', port: 8080 }]);
      mockDb.limit.mockResolvedValueOnce([{ userAgent: 'test' }]);

      const result = await service.runCampaign({ workflowPath: 'test.json' });
      expect(result).toEqual({ jobId: 'job1' });
      expect(cliWorkerService.dispatchJob).toHaveBeenCalled();
    });

    it('should run campaign with accountId and no proxy', async () => {
      mockDb.where.mockResolvedValueOnce([{ id: 'acc1' }]);
      mockDb.limit.mockResolvedValueOnce([]);
      mockDb.limit.mockResolvedValueOnce([]);
      mockDb.limit.mockResolvedValueOnce([{ userAgent: 'test2' }]);

      const result = await service.runCampaign({ workflowPath: 'test.json', accountId: 'acc1' });
      expect(result).toEqual({ jobId: 'job1' });
    });

    it('should throw NotFoundException if account not found', async () => {
      mockDb.limit.mockResolvedValueOnce([]); 
      await expect(service.runCampaign({ workflowPath: 'test.json' })).rejects.toThrow('No active accounts available');
    });

    it('should throw NotFoundException if specific account not found', async () => {
      mockDb.where.mockResolvedValueOnce([]);
      await expect(service.runCampaign({ workflowPath: 'test.json', accountId: 'missing' })).rejects.toThrow('Account missing not found');
    });

    it('should fallback to default userAgent if no profiles found', async () => {
      mockDb.limit.mockResolvedValueOnce([{ id: 'acc1' }]);
      mockDb.limit.mockResolvedValueOnce([{ protocol: 'http', host: 'localhost', port: '80', username: 'u', password: 'p', id: 'proxy2' }]);
      mockDb.limit.mockResolvedValueOnce([]);
      mockDb.limit.mockResolvedValueOnce([]);

      const result = await service.runCampaign({ workflowPath: 'test.json' });
      expect(result).toEqual({ jobId: 'job1' });
    });
  });
});
