import { Module } from '@nestjs/common';
import { CliWorkerService } from './cli-worker.service';

@Module({
  providers: [CliWorkerService],
  exports: [CliWorkerService],
})
export class CliWorkerModule {}
