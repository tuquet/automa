/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/ban-ts-comment */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { assetsDb, accounts, proxies, browserProfiles } from '@automa/core';
import * as schema from '@automa/core';
import { eq, isNull } from 'drizzle-orm';
import { CliWorkerService } from '../cli-worker/cli-worker.service';
import { RunCampaignDto } from './dto/run-campaign.dto';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(private readonly cliWorkerService: CliWorkerService) {}

  async getCampaignAccounts(campaignId: string) {
    if (!assetsDb) throw new Error('Assets DB not initialized');
    // @ts-ignore
    return await assetsDb.select().from(schema.campaignAccounts).where(eq(schema.campaignAccounts.campaignId, campaignId));
  }

  async runCampaign(dto: RunCampaignDto) {
    if (!assetsDb) throw new Error('Assets DB not initialized');
    const { workflowPath, accountId } = dto;

    this.logger.log(`Starting campaign for workflow: ${workflowPath}`);

    const selectedAccount = await this.getAvailableAccount(accountId);
    const selectedProxy = await this.getAliveProxy();

    const selectedProfile = await this.getBrowserProfile(selectedAccount.id);

    const payload = this.buildPayload(
      workflowPath,
      selectedAccount,
      selectedProxy,
      selectedProfile,
    );

    return await this.cliWorkerService.dispatchJob(payload);
  }

  private async getAvailableAccount(accountId?: string) {
    let selectedAccount;
    if (accountId) {
      // @ts-ignore
      const results = await assetsDb.select().from(accounts).where(eq(accounts.id, accountId));
      selectedAccount = results[0];
    } else {
      // @ts-ignore
      const results = await assetsDb.select().from(accounts).where(eq(accounts.status, 'active')).limit(1);
      selectedAccount = results[0];
    }

    if (!selectedAccount) {
      throw new NotFoundException(
        accountId
          ? `Account ${accountId} not found`
          : 'No active accounts available',
      );
    }
    return selectedAccount;
  }

  private async getAliveProxy() {
    // @ts-ignore
    const availableProxies = await assetsDb.select().from(proxies).where(eq(proxies.status, 'alive')).limit(1);
    return availableProxies.length > 0 ? availableProxies[0] : null;
  }

  private async getBrowserProfile(accountId: string) {
    // @ts-ignore
    const boundProfiles = await assetsDb.select().from(browserProfiles).where(eq(browserProfiles.accountId, accountId)).limit(1);
    if (boundProfiles.length > 0) {
      return boundProfiles[0];
    }

    // @ts-ignore
    const freeProfiles = await assetsDb.select().from(browserProfiles).where(isNull(browserProfiles.accountId)).limit(1);
    return freeProfiles.length > 0
      ? freeProfiles[0]
      : {
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        };
  }

  private buildPayload(
    workflowPath: string,

    account: any,

    proxy: any,

    profile: any,
  ) {
    return {
      workflowPath,
      options: {
        keepBrowserOpen: false,
      },
      assets: {
        accountId: account.id,

        cookies: account.cookies,

        proxyUrl: proxy
          ? `${proxy.protocol}://${proxy.username ? proxy.username + ':' + proxy.password + '@' : ''}${proxy.host}:${proxy.port}`
          : null,
        
        proxyId: proxy ? proxy.id : null,

        browserProfile: profile,
      },
    };
  }
}
