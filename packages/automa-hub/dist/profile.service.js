"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileService = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@automa/core");
const drizzle_orm_1 = require("drizzle-orm");
const crypto_1 = require("crypto");
let ProfileService = class ProfileService {
    async getAllProfiles() {
        if (!core_1.assetsDb)
            return [];
        return await core_1.assetsDb.select().from(core_1.browserProfiles);
    }
    async getProfileById(id) {
        if (!core_1.assetsDb)
            throw new Error('DB not initialized');
        const result = await core_1.assetsDb.select().from(core_1.browserProfiles).where((0, drizzle_orm_1.eq)(core_1.browserProfiles.id, id));
        if (result.length === 0) {
            throw new common_1.NotFoundException(`Profile with ID ${id} not found`);
        }
        return result[0];
    }
    async createProfile(data) {
        if (!core_1.assetsDb)
            throw new Error('DB not initialized');
        const newId = `prof_${(0, crypto_1.randomUUID)()}`;
        await core_1.assetsDb.insert(core_1.browserProfiles).values({
            id: newId,
            name: data.name,
            userAgent: data.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            timezone: data.timezone || 'UTC',
            language: data.language || 'en-US',
            screenResolution: data.screenResolution || '1920x1080',
            accountId: data.accountId,
        });
        return this.getProfileById(newId);
    }
    async deleteProfile(id) {
        if (!core_1.assetsDb)
            throw new Error('DB not initialized');
        const result = await core_1.assetsDb.delete(core_1.browserProfiles).where((0, drizzle_orm_1.eq)(core_1.browserProfiles.id, id)).returning();
        if (result.length === 0) {
            throw new common_1.NotFoundException(`Profile with ID ${id} not found`);
        }
        return { success: true };
    }
};
exports.ProfileService = ProfileService;
exports.ProfileService = ProfileService = __decorate([
    (0, common_1.Injectable)()
], ProfileService);
//# sourceMappingURL=profile.service.js.map