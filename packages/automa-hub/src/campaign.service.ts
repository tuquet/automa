import { Injectable, Logger } from '@nestjs/common';
import { assetsDb, accounts, proxies, browserProfiles } from '@automa/core';
import { eq, isNull } from 'drizzle-orm';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  async runCampaign(workflowPath: string, accountId?: string) {
    if (!assetsDb) throw new Error("Assets DB not initialized");

    this.logger.log(`Starting campaign for workflow: ${workflowPath}`);

    // 1. Asset Matching Algorithm
    // Find an active account (either the one requested, or any active one)
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
      throw new Error("No active accounts available");
    }

    // Find an alive proxy
    // @ts-ignore
    const availableProxies = await assetsDb.select().from(proxies).where(eq(proxies.status, 'alive')).limit(1);
    const selectedProxy = availableProxies.length > 0 ? availableProxies[0] : null;

    // Find a browser profile bound to this account, or pick a random one
    let selectedProfile;
    // @ts-ignore
    const boundProfiles = await assetsDb.select().from(browserProfiles).where(eq(browserProfiles.accountId, selectedAccount.id)).limit(1);
    if (boundProfiles.length > 0) {
      selectedProfile = boundProfiles[0];
    } else {
      // @ts-ignore
      const freeProfiles = await assetsDb.select().from(browserProfiles).where(isNull(browserProfiles.accountId)).limit(1);
      selectedProfile = freeProfiles.length > 0 ? freeProfiles[0] : { userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" };
    }

    // 2. Build Payload for Automa CLI Worker
    const payload = {
      workflowPath,
      options: {
        keepBrowserOpen: false,
      },
      assets: {
        accountId: selectedAccount.id,
        cookies: selectedAccount.cookies,
        proxy: selectedProxy ? `${selectedProxy.protocol}://${selectedProxy.username ? selectedProxy.username + ':' + selectedProxy.password + '@' : ''}${selectedProxy.host}:${selectedProxy.port}` : null,
        browserProfile: selectedProfile
      }
    };

    // 3. Dispatch to CLI Worker (Assuming it's running locally on port 3500)
    this.logger.log(`Dispatching to CLI Worker: Account ${selectedAccount.id}, Proxy ${selectedProxy?.id || 'None'}`);
    
    try {
      const response = await fetch('http://127.0.0.1:3500/api/jobs/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`CLI Worker Error: ${errorText}`);
      }

      const result = await response.json();
      this.logger.log(`Job queued on CLI Worker. Job ID: ${result.jobId}`);
      return result;
    } catch (e) {
      this.logger.error(`Failed to dispatch to CLI Worker: ${e.message}`);
      throw e;
    }
  }
}
