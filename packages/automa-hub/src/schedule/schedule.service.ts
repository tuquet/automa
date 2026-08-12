import { Injectable, NotFoundException } from '@nestjs/common';
import { assetsDb, schedules } from '@automa/core';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

@Injectable()
export class ScheduleService {
  async getAllSchedules() {
    if (!assetsDb) return [];
    // @ts-ignore
    return await assetsDb.select().from(schedules);
  }

  async getScheduleById(id: string) {
    if (!assetsDb) throw new Error('DB not initialized');
    // @ts-ignore
    const result = await assetsDb.select().from(schedules).where(eq(schedules.id, id));
    if (result.length === 0) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }
    return result[0];
  }

  async createSchedule(data: { campaignId: string; workflowPath: string; cronExpr: string; concurrency?: number; status?: string }) {
    if (!assetsDb) throw new Error('DB not initialized');
    const newId = `sch_${randomUUID()}`;
    // @ts-ignore
    await assetsDb.insert(schedules).values({
      id: newId,
      campaignId: data.campaignId,
      workflowPath: data.workflowPath,
      cronExpr: data.cronExpr,
      concurrency: data.concurrency || 1,
      status: data.status || 'active',
    });
    return this.getScheduleById(newId);
  }

  async deleteSchedule(id: string) {
    if (!assetsDb) throw new Error('DB not initialized');
    // @ts-ignore
    const result = await assetsDb.delete(schedules).where(eq(schedules.id, id)).returning();
    if (result.length === 0) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }
    return { success: true };
  }

  async updateScheduleStatus(id: string, status: string) {
    if (!assetsDb) throw new Error('DB not initialized');
    // @ts-ignore
    const result = await assetsDb.update(schedules).set({ status }).where(eq(schedules.id, id)).returning();
    if (result.length === 0) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }
    return result[0];
  }
}
