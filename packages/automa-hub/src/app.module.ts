import { Module } from '@nestjs/common';
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

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController, MmoController, CampaignController, ProfileController, FleetController],
  providers: [AppService, CampaignService, CliWorkerService, ProfileService, FleetService],
})
export class AppModule {}
