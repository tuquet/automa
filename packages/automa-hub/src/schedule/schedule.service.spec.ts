import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleService } from './schedule.service';
import { NotFoundException } from '@nestjs/common';
import * as core from '@automa/core';

vi.mock('@automa/core', () => ({
  schedules: { id: 'id', campaignId: 'campaignId', workflowPath: 'workflowPath', cronExpr: 'cronExpr', concurrency: 'concurrency', status: 'status' },
  assetsDb: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
}));

describe('ScheduleService', () => {
  let service: ScheduleService;
  let mockAssetsDb: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockAssetsDb = core.assetsDb;

    const module: TestingModule = await Test.createTestingModule({
      providers: [ScheduleService],
    }).compile();

    service = module.get<ScheduleService>(ScheduleService);
  });

  describe('getAllSchedules', () => {
    it('should return all schedules', async () => {
      const mockList = [{ id: '1', campaignId: 'f1', cronExpr: '* * * * *' }];
      const fromMock = vi.fn().mockResolvedValue(mockList);
      mockAssetsDb.select.mockReturnValue({ from: fromMock });

      const result = await service.getAllSchedules();
      expect(result).toEqual(mockList);
      expect(fromMock).toHaveBeenCalledWith(core.schedules);
    });
  });

  describe('createSchedule', () => {
    it('should create and return a new schedule', async () => {
      const valuesMock = vi.fn().mockResolvedValue({});
      mockAssetsDb.insert.mockReturnValue({ values: valuesMock });
      
      const newSched = { id: 'sch_1', campaignId: 'f1', workflowPath: '/path', cronExpr: '0 * * * *', concurrency: 1, status: 'active', createdAt: '' };
      vi.spyOn(service, 'getScheduleById').mockResolvedValue(newSched);

      const payload = { campaignId: 'f1', workflowPath: '/path', cronExpr: '0 * * * *', concurrency: 1 };
      const result = await service.createSchedule(payload);
      
      expect(mockAssetsDb.insert).toHaveBeenCalledWith(core.schedules);
      expect(result).toEqual(newSched);
    });
  });

  describe('getScheduleById', () => {
    it('should throw NotFoundException if schedule missing', async () => {
      const whereMock = vi.fn().mockResolvedValue([]);
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      mockAssetsDb.select.mockReturnValue({ from: fromMock });

      await expect(service.getScheduleById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteSchedule', () => {
    it('should delete and return success', async () => {
      const returningMock = vi.fn().mockResolvedValue([{ id: 's1' }]);
      const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
      mockAssetsDb.delete.mockReturnValue({ where: whereMock });

      const result = await service.deleteSchedule('s1');
      expect(result).toEqual({ success: true });
    });
  });

  describe('updateScheduleStatus', () => {
    it('should update status', async () => {
      const returningMock = vi.fn().mockResolvedValue([{ id: 's1', status: 'paused' }]);
      const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
      const setMock = vi.fn().mockReturnValue({ where: whereMock });
      mockAssetsDb.update.mockReturnValue({ set: setMock });

      const result = await service.updateScheduleStatus('s1', 'paused');
      expect(result.status).toBe('paused');
    });
  });
});
