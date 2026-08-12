import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from './profile.service';
import { NotFoundException } from '@nestjs/common';
import * as core from '@automa/core';

jest.mock('@automa/core', () => ({
  browserProfiles: { id: 'id', name: 'name' },
  assetsDb: {
    select: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
  }
}));

describe('ProfileService', () => {
  let service: ProfileService;
  let mockAssetsDb: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockAssetsDb = core.assetsDb;

    const module: TestingModule = await Test.createTestingModule({
      providers: [ProfileService],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
  });

  describe('getAllProfiles', () => {
    it('should return all profiles', async () => {
      const mockProfiles = [{ id: 'p1', name: 'Profile 1' }];
      const fromMock = jest.fn().mockResolvedValue(mockProfiles);
      mockAssetsDb.select.mockReturnValue({ from: fromMock });

      const result = await service.getAllProfiles();
      expect(result).toEqual(mockProfiles);
      expect(fromMock).toHaveBeenCalledWith(core.browserProfiles);
    });
  });

  describe('getProfileById', () => {
    it('should throw NotFoundException if profile not found', async () => {
      const whereMock = jest.fn().mockResolvedValue([]);
      const fromMock = jest.fn().mockReturnValue({ where: whereMock });
      mockAssetsDb.select.mockReturnValue({ from: fromMock });

      await expect(service.getProfileById('missing')).rejects.toThrow(NotFoundException);
    });

    it('should return the profile if found', async () => {
      const mockProfile = { id: 'p1', name: 'Profile 1' };
      const whereMock = jest.fn().mockResolvedValue([mockProfile]);
      const fromMock = jest.fn().mockReturnValue({ where: whereMock });
      mockAssetsDb.select.mockReturnValue({ from: fromMock });

      const result = await service.getProfileById('p1');
      expect(result).toEqual(mockProfile);
    });
  });

  describe('createProfile', () => {
    it('should insert a new profile with defaults and return it', async () => {
      const valuesMock = jest.fn().mockResolvedValue({});
      mockAssetsDb.insert.mockReturnValue({ values: valuesMock });

      const createdMock = { id: 'prof_new', name: 'My Profile', userAgent: 'abc', timezone: 'UTC', language: 'en-US', screenResolution: '1920x1080', accountId: null, createdAt: '' };
      jest.spyOn(service, 'getProfileById').mockResolvedValue(createdMock);

      const result = await service.createProfile({ name: 'My Profile' });
      expect(mockAssetsDb.insert).toHaveBeenCalledWith(core.browserProfiles);
      expect(result).toEqual(createdMock);
    });
  });

  describe('deleteProfile', () => {
    it('should throw NotFoundException if trying to delete missing profile', async () => {
      const returningMock = jest.fn().mockResolvedValue([]);
      const whereMock = jest.fn().mockReturnValue({ returning: returningMock });
      mockAssetsDb.delete.mockReturnValue({ where: whereMock });

      await expect(service.deleteProfile('missing')).rejects.toThrow(NotFoundException);
    });

    it('should delete and return success if profile exists', async () => {
      const returningMock = jest.fn().mockResolvedValue([{ id: 'p1' }]);
      const whereMock = jest.fn().mockReturnValue({ returning: returningMock });
      mockAssetsDb.delete.mockReturnValue({ where: whereMock });

      const result = await service.deleteProfile('p1');
      expect(result).toEqual({ success: true });
    });
  });
});
