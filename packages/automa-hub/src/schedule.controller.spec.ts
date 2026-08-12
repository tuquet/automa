import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';
import { SchedulerDispatcherService } from './scheduler-dispatcher.service';

jest.mock('@automa/core', () => ({}));


describe('ScheduleController', () => {
  let controller: ScheduleController;
  let service: ScheduleService;
  let dispatcher: SchedulerDispatcherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScheduleController],
      providers: [
        {
          provide: ScheduleService,
          useValue: {
            getAllSchedules: jest.fn(),
            getScheduleById: jest.fn(),
            createSchedule: jest.fn(),
            deleteSchedule: jest.fn(),
            updateScheduleStatus: jest.fn(),
          },
        },
        {
          provide: SchedulerDispatcherService,
          useValue: {
            addCronJobForSchedule: jest.fn(),
            removeCronJob: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ScheduleController>(ScheduleController);
    service = module.get<ScheduleService>(ScheduleService);
    dispatcher = module.get<SchedulerDispatcherService>(SchedulerDispatcherService);
  });

  it('should get all schedules', async () => {
    jest.spyOn(service, 'getAllSchedules').mockResolvedValue([]);
    await controller.getAllSchedules();
    expect(service.getAllSchedules).toHaveBeenCalled();
  });

  it('should create schedule and register cron if active', async () => {
    const mockSchedule = { id: 's1', status: 'active' };
    jest.spyOn(service, 'createSchedule').mockResolvedValue(mockSchedule as any);
    
    await controller.createSchedule({});
    expect(service.createSchedule).toHaveBeenCalled();
    expect(dispatcher.addCronJobForSchedule).toHaveBeenCalledWith(mockSchedule);
  });

  it('should create schedule and NOT register cron if paused', async () => {
    const mockSchedule = { id: 's2', status: 'paused' };
    jest.spyOn(service, 'createSchedule').mockResolvedValue(mockSchedule as any);
    
    await controller.createSchedule({});
    expect(dispatcher.addCronJobForSchedule).not.toHaveBeenCalled();
  });

  it('should delete schedule and remove cron', async () => {
    jest.spyOn(service, 'deleteSchedule').mockResolvedValue({ success: true });
    await controller.deleteSchedule('s1');
    expect(service.deleteSchedule).toHaveBeenCalledWith('s1');
    expect(dispatcher.removeCronJob).toHaveBeenCalledWith('s1');
  });

  it('should update status and add/remove cron accordingly', async () => {
    jest.spyOn(service, 'updateScheduleStatus').mockResolvedValue({ id: 's1', status: 'paused' } as any);
    await controller.updateScheduleStatus('s1', { status: 'paused' });
    expect(dispatcher.removeCronJob).toHaveBeenCalledWith('s1');

    jest.spyOn(service, 'updateScheduleStatus').mockResolvedValue({ id: 's1', status: 'active' } as any);
    await controller.updateScheduleStatus('s1', { status: 'active' });
    expect(dispatcher.addCronJobForSchedule).toHaveBeenCalledWith({ id: 's1', status: 'active' });
  });
});
