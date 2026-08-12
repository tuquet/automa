"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FleetService = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@automa/core");
const drizzle_orm_1 = require("drizzle-orm");
const crypto_1 = require("crypto");
let FleetService = class FleetService {
    async getAllFleets() {
        if (!core_1.assetsDb)
            return [];
        return await core_1.assetsDb.select().from(core_1.fleets);
    }
    async getFleetById(id) {
        if (!core_1.assetsDb)
            throw new Error('DB not initialized');
        const result = await core_1.assetsDb.select().from(core_1.fleets).where((0, drizzle_orm_1.eq)(core_1.fleets.id, id));
        if (result.length === 0) {
            throw new common_1.NotFoundException(`Fleet with ID ${id} not found`);
        }
        return result[0];
    }
    async createFleet(data) {
        if (!core_1.assetsDb)
            throw new Error('DB not initialized');
        const newId = `fleet_${(0, crypto_1.randomUUID)()}`;
        await core_1.assetsDb.insert(core_1.fleets).values({
            id: newId,
            name: data.name,
            description: data.description,
            status: data.status || 'active',
        });
        return this.getFleetById(newId);
    }
    async addFleetMember(fleetId, accountId) {
        if (!core_1.assetsDb)
            throw new Error('DB not initialized');
        await this.getFleetById(fleetId);
        await core_1.assetsDb.insert(core_1.fleetMembers).values({
            fleetId,
            accountId,
        });
        return { success: true };
    }
    async getFleetMembers(fleetId) {
        if (!core_1.assetsDb)
            throw new Error('DB not initialized');
        return await core_1.assetsDb.select().from(core_1.fleetMembers).where((0, drizzle_orm_1.eq)(core_1.fleetMembers.fleetId, fleetId));
    }
    async removeFleetMember(fleetId, accountId) {
        if (!core_1.assetsDb)
            throw new Error('DB not initialized');
        const { and } = await import('drizzle-orm');
        await core_1.assetsDb.delete(core_1.fleetMembers).where(and((0, drizzle_orm_1.eq)(core_1.fleetMembers.fleetId, fleetId), (0, drizzle_orm_1.eq)(core_1.fleetMembers.accountId, accountId)));
        return { success: true };
    }
};
exports.FleetService = FleetService;
exports.FleetService = FleetService = __decorate([
    (0, common_1.Injectable)()
], FleetService);
//# sourceMappingURL=fleet.service.js.map