import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MmoController } from './mmo.controller';
import { CampaignController } from './campaign.controller';
import { CampaignService } from './campaign.service';
import { CliWorkerService } from './cli-worker.service';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { FleetController } from './fleet.controller';
import { FleetService } from './fleet.service';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';
import { SchedulerDispatcherService } from './scheduler-dispatcher.service';
import { TelemetryService } from './telemetry.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ScheduleModule.forRoot()],
  controllers: [AppController, MmoController, CampaignController, ProfileController, FleetController, ScheduleController],
  providers: [AppService, CampaignService, CliWorkerService, ProfileService, FleetService, ScheduleService, SchedulerDispatcherService, TelemetryService],
})
export class AppModule {}
