/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Controller, Get, Post, Body } from '@nestjs/common';
import { assetsDb, accounts, proxies } from '@automa/core';

import { TelemetryService } from '../telemetry/telemetry.service';

@Controller('api/assets')
export class AssetsController {
  constructor(private readonly telemetryService: TelemetryService) {}

  // --- Accounts API ---
  @Get('accounts')
  async getAccounts() {
    if (!assetsDb) return [];
    // @ts-ignore
    return await assetsDb.select().from(accounts);
  }

  @Post('accounts')
  async createAccount(@Body() body: any) {
    if (!assetsDb) throw new Error('DB not initialized');
    const newId = `acc_${Date.now()}`;
    // @ts-ignore
    await assetsDb.insert(accounts).values({
      id: newId,
      platform: body.platform || 'unknown',
      username: body.username,
      password: body.password,
    });
    return { id: newId, success: true };
  }

  // --- Proxies API ---
  @Get('proxies')
  async getProxies() {
    if (!assetsDb) return [];
    // @ts-ignore
    return await assetsDb.select().from(proxies);
  }

  @Post('proxies')
  async createProxy(@Body() body: any) {
    if (!assetsDb) throw new Error('DB not initialized');
    const newId = `proxy_${Date.now()}`;
    // @ts-ignore
    await assetsDb.insert(proxies).values({
      id: newId,
      host: body.host,
      port: body.port,
    });
    return { id: newId, success: true };
  }

  // --- Telemetry API ---
  @Post('telemetry')
  async reportTelemetry(@Body() body: any) {
    await this.telemetryService.processTelemetry(body);
    return { success: true };
  }
}
