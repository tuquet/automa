"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SchedulerDispatcherService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerDispatcherService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const cron_1 = require("cron");
const schedule_service_1 = require("./schedule.service");
const fleet_service_1 = require("./fleet.service");
const campaign_service_1 = require("./campaign.service");
let SchedulerDispatcherService = SchedulerDispatcherService_1 = class SchedulerDispatcherService {
    scheduleService;
    fleetService;
    campaignService;
    schedulerRegistry;
    logger = new common_1.Logger(SchedulerDispatcherService_1.name);
    constructor(scheduleService, fleetService, campaignService, schedulerRegistry) {
        this.scheduleService = scheduleService;
        this.fleetService = fleetService;
        this.campaignService = campaignService;
        this.schedulerRegistry = schedulerRegistry;
    }
    async onModuleInit() {
        this.logger.log('Initializing Scheduler Dispatcher...');
        await this.registerActiveSchedules();
    }
    async registerActiveSchedules() {
        try {
            const schedules = await this.scheduleService.getAllSchedules();
            for (const schedule of schedules) {
                if (schedule.status === 'active') {
                    this.addCronJobForSchedule(schedule);
                }
            }
        }
        catch (err) {
            this.logger.error('Failed to load schedules on init', err);
        }
    }
    addCronJobForSchedule(schedule) {
        const jobName = `schedule_${schedule.id}`;
        if (this.schedulerRegistry.getCronJobs().has(jobName)) {
            this.logger.warn(`Job ${jobName} already exists! Replacing it.`);
            this.schedulerRegistry.deleteCronJob(jobName);
        }
        try {
            const job = new cron_1.CronJob(schedule.cronExpr, async () => {
                this.logger.log(`Cron job triggered for schedule ${schedule.id}`);
                await this.dispatchFleet(schedule);
            });
            this.schedulerRegistry.addCronJob(jobName, job);
            job.start();
            this.logger.log(`Registered cron job: ${jobName} with expr: ${schedule.cronExpr}`);
        }
        catch (error) {
            this.logger.error(`Error registering cron job ${jobName}: ${error}`);
        }
    }
    removeCronJob(scheduleId) {
        const jobName = `schedule_${scheduleId}`;
        if (this.schedulerRegistry.getCronJobs().has(jobName)) {
            this.schedulerRegistry.deleteCronJob(jobName);
            this.logger.log(`Removed cron job: ${jobName}`);
        }
    }
    async dispatchFleet(schedule) {
        this.logger.log(`Dispatching fleet ${schedule.fleetId} for schedule ${schedule.id}`);
        try {
            const members = await this.fleetService.getFleetMembers(schedule.fleetId);
            if (!members || members.length === 0) {
                this.logger.warn(`No members found in fleet ${schedule.fleetId}`);
                return;
            }
            const concurrency = schedule.concurrency || 1;
            this.logger.log(`Found ${members.length} members. Concurrency: ${concurrency}`);
            for (let i = 0; i < members.length; i += concurrency) {
                const chunk = members.slice(i, i + concurrency);
                this.logger.debug(`Dispatching chunk size ${chunk.length}`);
                await Promise.all(chunk.map((member) => this.campaignService.runCampaign({
                    workflowPath: schedule.workflowPath,
                    accountId: member.accountId,
                }).catch(err => {
                    this.logger.error(`Failed to dispatch for account ${member.accountId}`, err);
                })));
            }
            this.logger.log(`Successfully dispatched all members for schedule ${schedule.id}`);
        }
        catch (err) {
            this.logger.error(`Error dispatching fleet ${schedule.fleetId}`, err);
        }
    }
};
exports.SchedulerDispatcherService = SchedulerDispatcherService;
exports.SchedulerDispatcherService = SchedulerDispatcherService = SchedulerDispatcherService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [schedule_service_1.ScheduleService,
        fleet_service_1.FleetService,
        campaign_service_1.CampaignService,
        schedule_1.SchedulerRegistry])
], SchedulerDispatcherService);
//# sourceMappingURL=scheduler-dispatcher.service.js.map