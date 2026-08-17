import { Test, TestingModule } from '@nestjs/testing';
import { TelemetryService } from './telemetry.service';
import * as core from '@automa/core';

vi.mock('@automa/core', () => ({
  accounts: { id: 'id', trustScore: 'trustScore', status: 'status' },
  proxies: { id: 'id', trustScore: 'trustScore', status: 'status' },
  assetsDb: {
    update: vi.fn(),
  },
  eq: vi.fn(),
  sql: vi.fn().mockImplementation((strings, ...values) => {
    return strings.reduce((acc, str, i) => acc + str + (values[i] || ''), '');
  }),
}));

describe('TelemetryService', () => {
  let service: TelemetryService;
  let mockAssetsDb: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockAssetsDb = core.assetsDb;

    const module: TestingModule = await Test.createTestingModule({
      providers: [TelemetryService],
    }).compile();

    service = module.get<TelemetryService>(TelemetryService);
  });

  describe('processTelemetry', () => {
    it('should increase trust score on success', async () => {
      const returningMock = vi.fn().mockResolvedValue([{ trustScore: 15 }]);
      const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
      const setMock = vi.fn().mockReturnValue({ where: whereMock });
      mockAssetsDb.update.mockReturnValue({ set: setMock });

      await service.processTelemetry({
        jobId: 'job-1',
        accountId: 'acc1',
        status: 'success'
      });

      expect(mockAssetsDb.update).toHaveBeenCalled();
      expect(setMock).toHaveBeenCalled();
      expect(whereMock).toHaveBeenCalled();
    });

    it('should ban account if trust score falls below zero', async () => {
      const returningMock = vi.fn().mockResolvedValue([{ trustScore: -5 }]);
      const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
      const setMock = vi.fn().mockReturnValue({ where: whereMock });
      mockAssetsDb.update.mockReturnValue({ set: setMock });

      await service.processTelemetry({
        jobId: 'job-2',
        accountId: 'acc-bad',
        status: 'error'
      });

      expect(mockAssetsDb.update).toHaveBeenCalledTimes(2); // one for score update, one for status update
    });
  });
});
