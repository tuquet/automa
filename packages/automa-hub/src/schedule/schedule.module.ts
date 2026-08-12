import { Module } from '@nestjs/common';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';
import { SchedulerDispatcherService } from './scheduler-dispatcher.service';
import { CampaignModule } from '../campaign/campaign.module';

@Module({
  imports: [CampaignModule],
  controllers: [ScheduleController],
  providers: [ScheduleService, SchedulerDispatcherService],
})
export class ScheduleModule {}
