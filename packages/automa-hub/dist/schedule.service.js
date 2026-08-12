"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleService = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@automa/core");
const drizzle_orm_1 = require("drizzle-orm");
const crypto_1 = require("crypto");
let ScheduleService = class ScheduleService {
    async getAllSchedules() {
        if (!core_1.assetsDb)
            return [];
        return await core_1.assetsDb.select().from(core_1.schedules);
    }
    async getScheduleById(id) {
        if (!core_1.assetsDb)
            throw new Error('DB not initialized');
        const result = await core_1.assetsDb.select().from(core_1.schedules).where((0, drizzle_orm_1.eq)(core_1.schedules.id, id));
        if (result.length === 0) {
            throw new common_1.NotFoundException(`Schedule with ID ${id} not found`);
        }
        return result[0];
    }
    async createSchedule(data) {
        if (!core_1.assetsDb)
            throw new Error('DB not initialized');
        const newId = `sch_${(0, crypto_1.randomUUID)()}`;
        await core_1.assetsDb.insert(core_1.schedules).values({
            id: newId,
            fleetId: data.fleetId,
            workflowPath: data.workflowPath,
            cronExpr: data.cronExpr,
            concurrency: data.concurrency || 1,
            status: data.status || 'active',
        });
        return this.getScheduleById(newId);
    }
    async deleteSchedule(id) {
        if (!core_1.assetsDb)
            throw new Error('DB not initialized');
        const result = await core_1.assetsDb.delete(core_1.schedules).where((0, drizzle_orm_1.eq)(core_1.schedules.id, id)).returning();
        if (result.length === 0) {
            throw new common_1.NotFoundException(`Schedule with ID ${id} not found`);
        }
        return { success: true };
    }
    async updateScheduleStatus(id, status) {
        if (!core_1.assetsDb)
            throw new Error('DB not initialized');
        const result = await core_1.assetsDb.update(core_1.schedules).set({ status }).where((0, drizzle_orm_1.eq)(core_1.schedules.id, id)).returning();
        if (result.length === 0) {
            throw new common_1.NotFoundException(`Schedule with ID ${id} not found`);
        }
        return result[0];
    }
};
exports.ScheduleService = ScheduleService;
exports.ScheduleService = ScheduleService = __decorate([
    (0, common_1.Injectable)()
], ScheduleService);
//# sourceMappingURL=schedule.service.js.map