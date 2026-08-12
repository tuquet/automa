export declare class ScheduleService {
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
    createSchedule(data: {
        fleetId: string;
        workflowPath: string;
        cronExpr: string;
        concurrency?: number;
        status?: string;
    }): Promise<{
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
    updateScheduleStatus(id: string, status: string): Promise<{
        id: string;
        status: string;
        createdAt: string | null;
        workflowPath: string;
        fleetId: string;
        cronExpr: string;
        concurrency: number | null;
    }>;
}
