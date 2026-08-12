"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TelemetryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemetryService = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@automa/core");
let TelemetryService = TelemetryService_1 = class TelemetryService {
    logger = new common_1.Logger(TelemetryService_1.name);
    async processTelemetry(payload) {
        this.logger.log(`Received telemetry for job ${payload.jobId} - Status: ${payload.status}`);
        try {
            if (payload.accountId) {
                await this.updateAccountTrustScore(payload.accountId, payload.status);
            }
            if (payload.proxyId) {
                await this.updateProxyTrustScore(payload.proxyId, payload.status);
            }
        }
        catch (err) {
            this.logger.error('Failed to process telemetry', err);
        }
    }
    async updateAccountTrustScore(accountId, status) {
        if (!core_1.assetsDb)
            return;
        const modifier = status === 'success' ? 5 : -10;
        const result = await core_1.assetsDb.update(core_1.accounts).set({
            trustScore: (0, core_1.sql) `${core_1.accounts.trustScore} + ${modifier}`,
        }).where((0, core_1.eq)(core_1.accounts.id, accountId)).returning();
        if (result[0] && (result[0].trustScore ?? 0) < 0) {
            this.logger.warn(`Account ${accountId} trust score below 0. Disabling account.`);
            await core_1.assetsDb.update(core_1.accounts).set({ status: 'banned' }).where((0, core_1.eq)(core_1.accounts.id, accountId));
        }
    }
    async updateProxyTrustScore(proxyId, status) {
        if (!core_1.assetsDb)
            return;
        const modifier = status === 'success' ? 2 : -20;
        const result = await core_1.assetsDb.update(core_1.proxies).set({
            trustScore: (0, core_1.sql) `${core_1.proxies.trustScore} + ${modifier}`,
        }).where((0, core_1.eq)(core_1.proxies.id, proxyId)).returning();
        if (result[0] && (result[0].trustScore ?? 0) < 0) {
            this.logger.warn(`Proxy ${proxyId} trust score below 0. Marking dead.`);
            await core_1.assetsDb.update(core_1.proxies).set({ status: 'dead' }).where((0, core_1.eq)(core_1.proxies.id, proxyId));
        }
    }
};
exports.TelemetryService = TelemetryService;
exports.TelemetryService = TelemetryService = TelemetryService_1 = __decorate([
    (0, common_1.Injectable)()
], TelemetryService);
//# sourceMappingURL=telemetry.service.js.map