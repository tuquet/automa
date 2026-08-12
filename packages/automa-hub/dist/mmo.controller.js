"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MmoController = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@automa/core");
let MmoController = class MmoController {
    async getAccounts() {
        if (!core_1.assetsDb)
            return [];
        return await core_1.assetsDb.select().from(core_1.accounts);
    }
    async createAccount(body) {
        if (!core_1.assetsDb)
            throw new Error("DB not initialized");
        const newId = `acc_${Date.now()}`;
        await core_1.assetsDb.insert(core_1.accounts).values({
            id: newId,
            platform: body.platform || 'unknown',
            username: body.username,
            password: body.password,
        });
        return { id: newId, success: true };
    }
    async getProxies() {
        if (!core_1.assetsDb)
            return [];
        return await core_1.assetsDb.select().from(core_1.proxies);
    }
    async createProxy(body) {
        if (!core_1.assetsDb)
            throw new Error("DB not initialized");
        const newId = `proxy_${Date.now()}`;
        await core_1.assetsDb.insert(core_1.proxies).values({
            id: newId,
            host: body.host,
            port: body.port,
        });
        return { id: newId, success: true };
    }
};
exports.MmoController = MmoController;
__decorate([
    (0, common_1.Get)('accounts'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MmoController.prototype, "getAccounts", null);
__decorate([
    (0, common_1.Post)('accounts'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MmoController.prototype, "createAccount", null);
__decorate([
    (0, common_1.Get)('proxies'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MmoController.prototype, "getProxies", null);
__decorate([
    (0, common_1.Post)('proxies'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MmoController.prototype, "createProxy", null);
exports.MmoController = MmoController = __decorate([
    (0, common_1.Controller)('api/mmo')
], MmoController);
//# sourceMappingURL=mmo.controller.js.map