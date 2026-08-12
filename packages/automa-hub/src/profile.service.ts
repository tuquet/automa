import { Injectable, NotFoundException } from '@nestjs/common';
import { assetsDb, browserProfiles } from '@automa/core';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

@Injectable()
export class ProfileService {
  async getAllProfiles() {
    if (!assetsDb) return [];
    // @ts-ignore
    return await assetsDb.select().from(browserProfiles);
  }

  async getProfileById(id: string) {
    if (!assetsDb) throw new Error('DB not initialized');
    // @ts-ignore
    const result = await assetsDb.select().from(browserProfiles).where(eq(browserProfiles.id, id));
    if (result.length === 0) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }
    return result[0];
  }

  async createProfile(data: any) {
    if (!assetsDb) throw new Error('DB not initialized');
    const newId = `prof_${randomUUID()}`;
    // @ts-ignore
    await assetsDb.insert(browserProfiles).values({
      id: newId,
      name: data.name,
      userAgent: data.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      timezone: data.timezone || 'UTC',
      language: data.language || 'en-US',
      screenResolution: data.screenResolution || '1920x1080',
      accountId: data.accountId, // Optional
    });
    return this.getProfileById(newId);
  }

  async deleteProfile(id: string) {
    if (!assetsDb) throw new Error('DB not initialized');
    // @ts-ignore
    const result = await assetsDb.delete(browserProfiles).where(eq(browserProfiles.id, id)).returning();
    if (result.length === 0) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }
    return { success: true };
  }
}
