import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MmoController } from './mmo.controller';
import { CampaignController } from './campaign.controller';
import { CampaignService } from './campaign.service';
import { CliWorkerService } from './cli-worker.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController, MmoController, CampaignController],
  providers: [AppService, CampaignService, CliWorkerService],
})
export class AppModule {}
