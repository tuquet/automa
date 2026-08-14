import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleService } from './schedule.service';
import { NotFoundException } from '@nestjs/common';
import * as core from '@automa/core';

jest.mock('@automa/core', () => ({
  schedules: { id: 'id', campaignId: 'campaignId', workflowPath: 'workflowPath', cronExpr: 'cronExpr', concurrency: 'concurrency', status: 'status' },
  assetsDb: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }
}));

describe('ScheduleService', () => {
  let service: ScheduleService;
  let mockAssetsDb: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockAssetsDb = core.assetsDb;

    const module: TestingModule = await Test.createTestingModule({
      providers: [ScheduleService],
    }).compile();

    service = module.get<ScheduleService>(ScheduleService);
  });

  describe('getAllSchedules', () => {
    it('should return all schedules', async () => {
      const mockList = [{ id: '1', campaignId: 'f1', cronExpr: '* * * * *' }];
      const fromMock = jest.fn().mockResolvedValue(mockList);
      mockAssetsDb.select.mockReturnValue({ from: fromMock });

      const result = await service.getAllSchedules();
      expect(result).toEqual(mockList);
      expect(fromMock).toHaveBeenCalledWith(core.schedules);
    });
  });

  describe('createSchedule', () => {
    it('should create and return a new schedule', async () => {
      const valuesMock = jest.fn().mockResolvedValue({});
      mockAssetsDb.insert.mockReturnValue({ values: valuesMock });
      
      const newSched = { id: 'sch_1', campaignId: 'f1', workflowPath: '/path', cronExpr: '0 * * * *', concurrency: 1, status: 'active', createdAt: '' };
      jest.spyOn(service, 'getScheduleById').mockResolvedValue(newSched);

      const payload = { campaignId: 'f1', workflowPath: '/path', cronExpr: '0 * * * *', concurrency: 1 };
      const result = await service.createSchedule(payload);
      
      expect(mockAssetsDb.insert).toHaveBeenCalledWith(core.schedules);
      expect(result).toEqual(newSched);
    });
  });

  describe('getScheduleById', () => {
    it('should throw NotFoundException if schedule missing', async () => {
      const whereMock = jest.fn().mockResolvedValue([]);
      const fromMock = jest.fn().mockReturnValue({ where: whereMock });
      mockAssetsDb.select.mockReturnValue({ from: fromMock });

      await expect(service.getScheduleById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteSchedule', () => {
    it('should delete and return success', async () => {
      const returningMock = jest.fn().mockResolvedValue([{ id: 's1' }]);
      const whereMock = jest.fn().mockReturnValue({ returning: returningMock });
      mockAssetsDb.delete.mockReturnValue({ where: whereMock });

      const result = await service.deleteSchedule('s1');
      expect(result).toEqual({ success: true });
    });
  });

  describe('updateScheduleStatus', () => {
    it('should update status', async () => {
      const returningMock = jest.fn().mockResolvedValue([{ id: 's1', status: 'paused' }]);
      const whereMock = jest.fn().mockReturnValue({ returning: returningMock });
      const setMock = jest.fn().mockReturnValue({ where: whereMock });
      mockAssetsDb.update.mockReturnValue({ set: setMock });

      const result = await service.updateScheduleStatus('s1', 'paused');
      expect(result.status).toBe('paused');
    });
  });
});
