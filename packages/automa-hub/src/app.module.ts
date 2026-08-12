import { Module } from '@nestjs/common';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AssetsModule } from './assets/assets.module';
import { CampaignModule } from './campaign/campaign.module';
import { CliWorkerModule } from './cli-worker/cli-worker.module';

import { ProfileModule } from './profile/profile.module';
import { ScheduleModule } from './schedule/schedule.module';
import { TelemetryModule } from './telemetry/telemetry.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    NestScheduleModule.forRoot(),
    AssetsModule,
    CampaignModule,
    CliWorkerModule,

    ProfileModule,
    ScheduleModule,
    TelemetryModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
