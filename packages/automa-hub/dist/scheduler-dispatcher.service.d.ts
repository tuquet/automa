import { OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ScheduleService } from './schedule.service';
import { FleetService } from './fleet.service';
import { CampaignService } from './campaign.service';
export declare class SchedulerDispatcherService implements OnModuleInit {
    private readonly scheduleService;
    private readonly fleetService;
    private readonly campaignService;
    private readonly schedulerRegistry;
    private readonly logger;
    constructor(scheduleService: ScheduleService, fleetService: FleetService, campaignService: CampaignService, schedulerRegistry: SchedulerRegistry);
    onModuleInit(): Promise<void>;
    private registerActiveSchedules;
    addCronJobForSchedule(schedule: any): void;
    removeCronJob(scheduleId: string): void;
    dispatchFleet(schedule: any): Promise<void>;
}
