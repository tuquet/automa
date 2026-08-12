import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { ScheduleService } from './schedule.service';
import { FleetService } from './fleet.service';
import { CampaignService } from './campaign.service';

@Injectable()
export class SchedulerDispatcherService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerDispatcherService.name);

  constructor(
    private readonly scheduleService: ScheduleService,
    private readonly fleetService: FleetService,
    private readonly campaignService: CampaignService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing Scheduler Dispatcher...');
    await this.registerActiveSchedules();
  }

  private async registerActiveSchedules() {
    try {
      const schedules = await this.scheduleService.getAllSchedules();
      for (const schedule of schedules) {
        if (schedule.status === 'active') {
          this.addCronJobForSchedule(schedule);
        }
      }
    } catch (err) {
      this.logger.error('Failed to load schedules on init', err);
    }
  }

  addCronJobForSchedule(schedule: any) {
    const jobName = `schedule_${schedule.id}`;
    
    // Check if job exists
    if (this.schedulerRegistry.getCronJobs().has(jobName)) {
      this.logger.warn(`Job ${jobName} already exists! Replacing it.`);
      this.schedulerRegistry.deleteCronJob(jobName);
    }

    try {
      const job = new CronJob(schedule.cronExpr, async () => {
        this.logger.log(`Cron job triggered for schedule ${schedule.id}`);
        await this.dispatchFleet(schedule);
      });

      this.schedulerRegistry.addCronJob(jobName, job);
      job.start();
      this.logger.log(`Registered cron job: ${jobName} with expr: ${schedule.cronExpr}`);
    } catch (error) {
      this.logger.error(`Error registering cron job ${jobName}: ${error}`);
    }
  }

  removeCronJob(scheduleId: string) {
    const jobName = `schedule_${scheduleId}`;
    if (this.schedulerRegistry.getCronJobs().has(jobName)) {
      this.schedulerRegistry.deleteCronJob(jobName);
      this.logger.log(`Removed cron job: ${jobName}`);
    }
  }

  async dispatchFleet(schedule: any) {
    this.logger.log(`Dispatching fleet ${schedule.fleetId} for schedule ${schedule.id}`);
    
    try {
      const members = await this.fleetService.getFleetMembers(schedule.fleetId);
      
      if (!members || members.length === 0) {
        this.logger.warn(`No members found in fleet ${schedule.fleetId}`);
        return;
      }

      // Concurrency chunking
      const concurrency = schedule.concurrency || 1;
      this.logger.log(`Found ${members.length} members. Concurrency: ${concurrency}`);

      for (let i = 0; i < members.length; i += concurrency) {
        const chunk = members.slice(i, i + concurrency);
        this.logger.debug(`Dispatching chunk size ${chunk.length}`);
        
        await Promise.all(
          chunk.map((member: any) =>
            this.campaignService.runCampaign({
              workflowPath: schedule.workflowPath,
              accountId: member.accountId,
            }).catch(err => {
              this.logger.error(`Failed to dispatch for account ${member.accountId}`, err);
            })
          )
        );
      }

      this.logger.log(`Successfully dispatched all members for schedule ${schedule.id}`);
    } catch (err) {
      this.logger.error(`Error dispatching fleet ${schedule.fleetId}`, err);
    }
  }
}
