import { Test, TestingModule } from '@nestjs/testing';
import { FleetService } from './fleet.service';
import { NotFoundException } from '@nestjs/common';
import * as core from '@automa/core';

// Mock the entire @automa/core module
jest.mock('@automa/core', () => ({
  fleets: { id: 'id', name: 'name' },
  fleetMembers: { fleetId: 'fleetId', accountId: 'accountId' },
  schedules: {},
  assetsDb: {
    select: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
  }
}));

describe('FleetService', () => {
  let service: FleetService;
  let mockAssetsDb: any;

  beforeEach(async () => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockAssetsDb = core.assetsDb;

    const module: TestingModule = await Test.createTestingModule({
      providers: [FleetService],
    }).compile();

    service = module.get<FleetService>(FleetService);
  });

  describe('getAllFleets', () => {
    it('should return all fleets from db', async () => {
      const mockFleets = [{ id: '1', name: 'Fleet 1' }];
      const fromMock = jest.fn().mockResolvedValue(mockFleets);
      mockAssetsDb.select.mockReturnValue({ from: fromMock });

      const result = await service.getAllFleets();

      expect(mockAssetsDb.select).toHaveBeenCalled();
      expect(fromMock).toHaveBeenCalledWith(core.fleets);
      expect(result).toEqual(mockFleets);
    });
  });

  describe('getFleetById', () => {
    it('should throw NotFoundException if fleet does not exist', async () => {
      const whereMock = jest.fn().mockResolvedValue([]);
      const fromMock = jest.fn().mockReturnValue({ where: whereMock });
      mockAssetsDb.select.mockReturnValue({ from: fromMock });

      await expect(service.getFleetById('invalid')).rejects.toThrow(NotFoundException);
    });

    it('should return fleet if it exists', async () => {
      const mockFleet = { id: 'valid', name: 'Valid Fleet' };
      const whereMock = jest.fn().mockResolvedValue([mockFleet]);
      const fromMock = jest.fn().mockReturnValue({ where: whereMock });
      mockAssetsDb.select.mockReturnValue({ from: fromMock });

      const result = await service.getFleetById('valid');
      expect(result).toEqual(mockFleet);
    });
  });

  describe('createFleet', () => {
    it('should create and return the new fleet', async () => {
      // Mock insert().values()
      const valuesMock = jest.fn().mockResolvedValue({});
      mockAssetsDb.insert.mockReturnValue({ values: valuesMock });
      
      // Mock getFleetById to return the mocked fleet
      jest.spyOn(service, 'getFleetById').mockResolvedValue({ id: 'fleet_123', name: 'New Fleet', status: 'active', description: null, createdAt: '' });

      const result = await service.createFleet({ name: 'New Fleet' });

      expect(mockAssetsDb.insert).toHaveBeenCalledWith(core.fleets);
      expect(valuesMock).toHaveBeenCalled();
      expect(result.name).toBe('New Fleet');
    });
  });

  describe('addFleetMember', () => {
    it('should throw if fleet does not exist', async () => {
      jest.spyOn(service, 'getFleetById').mockRejectedValue(new NotFoundException());
      
      await expect(service.addFleetMember('invalid', 'acc1')).rejects.toThrow(NotFoundException);
    });

    it('should add member if fleet exists', async () => {
      jest.spyOn(service, 'getFleetById').mockResolvedValue({ id: 'f1', name: 'F1', status: 'active', description: null, createdAt: '' });
      const valuesMock = jest.fn().mockResolvedValue({});
      mockAssetsDb.insert.mockReturnValue({ values: valuesMock });

      const result = await service.addFleetMember('f1', 'acc1');
      expect(result).toEqual({ success: true });
      expect(valuesMock).toHaveBeenCalledWith({ fleetId: 'f1', accountId: 'acc1' });
    });
  });
});
