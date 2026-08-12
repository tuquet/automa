/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CliWorkerService {
  private readonly logger = new Logger(CliWorkerService.name);
  private readonly workerUrl: string;

  constructor(private configService: ConfigService) {
    this.workerUrl = this.configService.get<string>(
      'CLI_WORKER_URL',
      'http://127.0.0.1:3500/api/jobs/run',
    );
  }

  async dispatchJob(payload: any): Promise<any> {
    this.logger.log(`Dispatching payload to CLI Worker at ${this.workerUrl}`);

    try {
      const response = await fetch(this.workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `CLI Worker responded with status ${response.status}: ${errorText}`,
        );
      }

      const result = await response.json();

      this.logger.log(
        `Job queued successfully on CLI Worker. Job ID: ${result.jobId}`,
      );

      return result;
    } catch (error: unknown) {
      const e = error as Error;
      this.logger.error(`Failed to dispatch job to CLI Worker: ${e.message}`);
      throw new ServiceUnavailableException(
        `CLI Worker is unavailable: ${e.message}`,
      );
    }
  }
}
