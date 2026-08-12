import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { assetsDb, accounts, proxies } from '@automa/core';
import { eq } from 'drizzle-orm';

@Controller('api/mmo')
export class MmoController {
  
  // --- Accounts API ---
  @Get('accounts')
  async getAccounts() {
    if (!assetsDb) return [];
    // @ts-ignore
    return await assetsDb.select().from(accounts);
  }

  @Post('accounts')
  async createAccount(@Body() body: any) {
    if (!assetsDb) throw new Error("DB not initialized");
    const newId = `acc_${Date.now()}`;
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
    return await assetsDb.select().from(proxies);
  }

  @Post('proxies')
  async createProxy(@Body() body: any) {
    if (!assetsDb) throw new Error("DB not initialized");
    const newId = `proxy_${Date.now()}`;
    await assetsDb.insert(proxies).values({
      id: newId,
      host: body.host,
      port: body.port,
    });
    return { id: newId, success: true };
  }
}
