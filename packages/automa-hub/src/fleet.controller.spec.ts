import { Test, TestingModule } from '@nestjs/testing';
import { FleetController } from './fleet.controller';
import { FleetService } from './fleet.service';

jest.mock('@automa/core', () => ({}));


describe('FleetController', () => {
  let controller: FleetController;
  let service: FleetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FleetController],
      providers: [
        {
          provide: FleetService,
          useValue: {
            getAllFleets: jest.fn(),
            getFleetById: jest.fn(),
            createFleet: jest.fn(),
            getFleetMembers: jest.fn(),
            addFleetMember: jest.fn(),
            removeFleetMember: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<FleetController>(FleetController);
    service = module.get<FleetService>(FleetService);
  });

  it('should get all fleets', async () => {
    const mockFleets = [{ id: '1', name: 'Fleet 1' }];
    jest.spyOn(service, 'getAllFleets').mockResolvedValue(mockFleets);
    const result = await controller.getAllFleets();
    expect(result).toBe(mockFleets);
    expect(service.getAllFleets).toHaveBeenCalled();
  });

  it('should get fleet by id', async () => {
    const mockFleet = { id: 'f1', name: 'Fleet 1' };
    jest.spyOn(service, 'getFleetById').mockResolvedValue(mockFleet);
    const result = await controller.getFleetById('f1');
    expect(result).toBe(mockFleet);
    expect(service.getFleetById).toHaveBeenCalledWith('f1');
  });

  it('should create fleet', async () => {
    const mockPayload = { name: 'New Fleet' };
    const mockResult = { id: 'new', ...mockPayload };
    jest.spyOn(service, 'createFleet').mockResolvedValue(mockResult);
    
    const result = await controller.createFleet(mockPayload);
    expect(result).toBe(mockResult);
    expect(service.createFleet).toHaveBeenCalledWith(mockPayload);
  });

  it('should get fleet members', async () => {
    const mockMembers = [{ fleetId: 'f1', accountId: 'a1' }];
    jest.spyOn(service, 'getFleetMembers').mockResolvedValue(mockMembers);
    const result = await controller.getFleetMembers('f1');
    expect(result).toBe(mockMembers);
    expect(service.getFleetMembers).toHaveBeenCalledWith('f1');
  });

  it('should add fleet member', async () => {
    const mockResult = { success: true };
    jest.spyOn(service, 'addFleetMember').mockResolvedValue(mockResult);
    const result = await controller.addFleetMember('f1', { accountId: 'a1' });
    expect(result).toBe(mockResult);
    expect(service.addFleetMember).toHaveBeenCalledWith('f1', 'a1');
  });

  it('should remove fleet member', async () => {
    const mockResult = { success: true };
    jest.spyOn(service, 'removeFleetMember').mockResolvedValue(mockResult);
    const result = await controller.removeFleetMember('f1', 'a1');
    expect(result).toBe(mockResult);
    expect(service.removeFleetMember).toHaveBeenCalledWith('f1', 'a1');
  });
});
