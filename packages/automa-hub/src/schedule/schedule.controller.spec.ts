import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';
import { SchedulerDispatcherService } from './scheduler-dispatcher.service';

vi.mock('@automa/core', () => ({}));


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
            getAllSchedules: vi.fn(),
            getScheduleById: vi.fn(),
            createSchedule: vi.fn(),
            deleteSchedule: vi.fn(),
            updateScheduleStatus: vi.fn(),
          },
        },
        {
          provide: SchedulerDispatcherService,
          useValue: {
            addCronJobForSchedule: vi.fn(),
            removeCronJob: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ScheduleController>(ScheduleController);
    service = module.get<ScheduleService>(ScheduleService);
    dispatcher = module.get<SchedulerDispatcherService>(SchedulerDispatcherService);
  });

  it('should get all schedules', async () => {
    vi.spyOn(service, 'getAllSchedules').mockResolvedValue([]);
    await controller.getAllSchedules();
    expect(service.getAllSchedules).toHaveBeenCalled();
  });

  it('should create schedule and register cron if active', async () => {
    const mockSchedule = { id: 's1', status: 'active' };
    vi.spyOn(service, 'createSchedule').mockResolvedValue(mockSchedule as any);
    
    await controller.createSchedule({});
    expect(service.createSchedule).toHaveBeenCalled();
    expect(dispatcher.addCronJobForSchedule).toHaveBeenCalledWith(mockSchedule);
  });

  it('should create schedule and NOT register cron if paused', async () => {
    const mockSchedule = { id: 's2', status: 'paused' };
    vi.spyOn(service, 'createSchedule').mockResolvedValue(mockSchedule as any);
    
    await controller.createSchedule({});
    expect(dispatcher.addCronJobForSchedule).not.toHaveBeenCalled();
  });

  it('should delete schedule and remove cron', async () => {
    vi.spyOn(service, 'deleteSchedule').mockResolvedValue({ success: true });
    await controller.deleteSchedule('s1');
    expect(service.deleteSchedule).toHaveBeenCalledWith('s1');
    expect(dispatcher.removeCronJob).toHaveBeenCalledWith('s1');
  });

  it('should update status and add/remove cron accordingly', async () => {
    vi.spyOn(service, 'updateScheduleStatus').mockResolvedValue({ id: 's1', status: 'paused' } as any);
    await controller.updateScheduleStatus('s1', { status: 'paused' });
    expect(dispatcher.removeCronJob).toHaveBeenCalledWith('s1');

    vi.spyOn(service, 'updateScheduleStatus').mockResolvedValue({ id: 's1', status: 'active' } as any);
    await controller.updateScheduleStatus('s1', { status: 'active' });
    expect(dispatcher.addCronJobForSchedule).toHaveBeenCalledWith({ id: 's1', status: 'active' });
  });
});
