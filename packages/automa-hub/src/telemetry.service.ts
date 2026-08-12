import { Injectable, Logger } from '@nestjs/common';
import { assetsDb, accounts, proxies, eq, sql } from '@automa/core';

export interface TelemetryPayload {
  jobId: string;
  accountId?: string;
  proxyId?: string;
  status: 'success' | 'error';
  duration?: number;
  error?: string;
}

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  async processTelemetry(payload: TelemetryPayload) {
    this.logger.log(`Received telemetry for job ${payload.jobId} - Status: ${payload.status}`);
    
    try {
      if (payload.accountId) {
        await this.updateAccountTrustScore(payload.accountId, payload.status);
      }
      
      if (payload.proxyId) {
        await this.updateProxyTrustScore(payload.proxyId, payload.status);
      }
    } catch (err) {
      this.logger.error('Failed to process telemetry', err);
    }
  }

  private async updateAccountTrustScore(accountId: string, status: 'success' | 'error') {
    if (!assetsDb) return;
    const modifier = status === 'success' ? 5 : -10;
    
    // @ts-ignore
    const result = await assetsDb.update(accounts).set({
      trustScore: sql`${accounts.trustScore} + ${modifier}`,
    }).where(eq(accounts.id, accountId)).returning();
    
    if (result[0] && (result[0].trustScore ?? 0) < 0) {
      this.logger.warn(`Account ${accountId} trust score below 0. Disabling account.`);
      // @ts-ignore
      await assetsDb.update(accounts).set({ status: 'banned' }).where(eq(accounts.id, accountId));
    }
  }

  private async updateProxyTrustScore(proxyId: string, status: 'success' | 'error') {
    if (!assetsDb) return;
    const modifier = status === 'success' ? 2 : -20;
    
    // @ts-ignore
    const result = await assetsDb.update(proxies).set({
      trustScore: sql`${proxies.trustScore} + ${modifier}`,
    }).where(eq(proxies.id, proxyId)).returning();
    
    if (result[0] && (result[0].trustScore ?? 0) < 0) {
      this.logger.warn(`Proxy ${proxyId} trust score below 0. Marking dead.`);
      // @ts-ignore
      await assetsDb.update(proxies).set({ status: 'dead' }).where(eq(proxies.id, proxyId));
    }
  }
}
