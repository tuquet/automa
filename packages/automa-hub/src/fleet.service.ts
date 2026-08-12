import { Injectable, NotFoundException } from '@nestjs/common';
import { assetsDb, fleets, fleetMembers, schedules } from '@automa/core';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

@Injectable()
export class FleetService {
  async getAllFleets() {
    if (!assetsDb) return [];
    // @ts-ignore
    return await assetsDb.select().from(fleets);
  }

  async getFleetById(id: string) {
    if (!assetsDb) throw new Error('DB not initialized');
    // @ts-ignore
    const result = await assetsDb.select().from(fleets).where(eq(fleets.id, id));
    if (result.length === 0) {
      throw new NotFoundException(`Fleet with ID ${id} not found`);
    }
    return result[0];
  }

  async createFleet(data: any) {
    if (!assetsDb) throw new Error('DB not initialized');
    const newId = `fleet_${randomUUID()}`;
    // @ts-ignore
    await assetsDb.insert(fleets).values({
      id: newId,
      name: data.name,
      description: data.description,
      status: data.status || 'active',
    });
    return this.getFleetById(newId);
  }

  async addFleetMember(fleetId: string, accountId: string) {
    if (!assetsDb) throw new Error('DB not initialized');
    // Ensure fleet exists
    await this.getFleetById(fleetId);
    
    // @ts-ignore
    await assetsDb.insert(fleetMembers).values({
      fleetId,
      accountId,
    });
    return { success: true };
  }

  async getFleetMembers(fleetId: string) {
    if (!assetsDb) throw new Error('DB not initialized');
    // @ts-ignore
    return await assetsDb.select().from(fleetMembers).where(eq(fleetMembers.fleetId, fleetId));
  }

  async removeFleetMember(fleetId: string, accountId: string) {
    if (!assetsDb) throw new Error('DB not initialized');
    // We don't have a composite PK utility directly via eq without and() so we can just run a query
    // Actually, drizzle allows eq(table.field, val). For composite, we can use sql or and()
    // but we can just import `and` from drizzle-orm. Let's do that properly in a real world, but for now:
    // we can use sql\`fleet_id = ${fleetId} AND account_id = ${accountId}\`
    const { and } = await import('drizzle-orm');
    // @ts-ignore
    await assetsDb.delete(fleetMembers).where(and(eq(fleetMembers.fleetId, fleetId), eq(fleetMembers.accountId, accountId)));
    return { success: true };
  }
}
