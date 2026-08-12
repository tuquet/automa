import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

jest.mock('@automa/core', () => ({}));


describe('ProfileController', () => {
  let controller: ProfileController;
  let service: ProfileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: ProfileService,
          useValue: {
            getAllProfiles: jest.fn(),
            getProfileById: jest.fn(),
            createProfile: jest.fn(),
            deleteProfile: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProfileController>(ProfileController);
    service = module.get<ProfileService>(ProfileService);
  });

  it('should return all profiles', async () => {
    const mockProfiles = [{ id: '1', name: 'Profile 1' }];
    jest.spyOn(service, 'getAllProfiles').mockResolvedValue(mockProfiles as any);
    const result = await controller.getAllProfiles();
    expect(result).toBe(mockProfiles);
    expect(service.getAllProfiles).toHaveBeenCalled();
  });

  it('should return profile by id', async () => {
    const mockProfile = { id: 'p1', name: 'Profile 1' };
    jest.spyOn(service, 'getProfileById').mockResolvedValue(mockProfile as any);
    const result = await controller.getProfileById('p1');
    expect(result).toBe(mockProfile);
    expect(service.getProfileById).toHaveBeenCalledWith('p1');
  });

  it('should create profile', async () => {
    const payload = { name: 'New Profile' };
    const mockProfile = { id: 'new', ...payload };
    jest.spyOn(service, 'createProfile').mockResolvedValue(mockProfile as any);
    const result = await controller.createProfile(payload);
    expect(result).toBe(mockProfile);
    expect(service.createProfile).toHaveBeenCalledWith(payload);
  });

  it('should delete profile', async () => {
    const mockResult = { success: true };
    jest.spyOn(service, 'deleteProfile').mockResolvedValue(mockResult);
    const result = await controller.deleteProfile('p1');
    expect(result).toBe(mockResult);
    expect(service.deleteProfile).toHaveBeenCalledWith('p1');
  });
});
