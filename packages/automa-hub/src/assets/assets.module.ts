import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { TelemetryModule } from '../telemetry/telemetry.module';

@Module({
  imports: [TelemetryModule],
  controllers: [AssetsController],
})
export class AssetsModule {}
