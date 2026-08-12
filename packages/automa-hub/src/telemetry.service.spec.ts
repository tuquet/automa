import { Test, TestingModule } from '@nestjs/testing';
import { TelemetryService } from './telemetry.service';
import * as core from '@automa/core';

jest.mock('@automa/core', () => ({
  accounts: { id: 'id', trustScore: 'trustScore', status: 'status' },
  proxies: { id: 'id', trustScore: 'trustScore', status: 'status' },
  assetsDb: {
    update: jest.fn(),
  },
  eq: jest.fn(),
  sql: jest.fn().mockImplementation((strings, ...values) => {
    return strings.reduce((acc, str, i) => acc + str + (values[i] || ''), '');
  }),
}));

describe('TelemetryService', () => {
  let service: TelemetryService;
  let mockAssetsDb: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockAssetsDb = core.assetsDb;

    const module: TestingModule = await Test.createTestingModule({
      providers: [TelemetryService],
    }).compile();

    service = module.get<TelemetryService>(TelemetryService);
  });

  describe('processTelemetry', () => {
    it('should increase trust score on success', async () => {
      const returningMock = jest.fn().mockResolvedValue([{ trustScore: 15 }]);
      const whereMock = jest.fn().mockReturnValue({ returning: returningMock });
      const setMock = jest.fn().mockReturnValue({ where: whereMock });
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
      const returningMock = jest.fn().mockResolvedValue([{ trustScore: -5 }]);
      const whereMock = jest.fn().mockReturnValue({ returning: returningMock });
      const setMock = jest.fn().mockReturnValue({ where: whereMock });
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
