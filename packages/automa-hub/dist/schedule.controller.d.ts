import { ScheduleService } from './schedule.service';
import { SchedulerDispatcherService } from './scheduler-dispatcher.service';
export declare class ScheduleController {
    private readonly scheduleService;
    private readonly dispatcherService;
    constructor(scheduleService: ScheduleService, dispatcherService: SchedulerDispatcherService);
    getAllSchedules(): Promise<{
        id: string;
        status: string;
        createdAt: string | null;
        workflowPath: string;
        fleetId: string;
        cronExpr: string;
        concurrency: number | null;
    }[]>;
    getScheduleById(id: string): Promise<{
        id: string;
        status: string;
        createdAt: string | null;
        workflowPath: string;
        fleetId: string;
        cronExpr: string;
        concurrency: number | null;
    }>;
    createSchedule(body: any): Promise<{
        id: string;
        status: string;
        createdAt: string | null;
        workflowPath: string;
        fleetId: string;
        cronExpr: string;
        concurrency: number | null;
    }>;
    deleteSchedule(id: string): Promise<{
        success: boolean;
    }>;
    updateScheduleStatus(id: string, body: {
        status: string;
    }): Promise<{
        id: string;
        status: string;
        createdAt: string | null;
        workflowPath: string;
        fleetId: string;
        cronExpr: string;
        concurrency: number | null;
    }>;
}
