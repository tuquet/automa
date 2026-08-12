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
var CampaignService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignService = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@automa/core");
const drizzle_orm_1 = require("drizzle-orm");
const cli_worker_service_1 = require("./cli-worker.service");
let CampaignService = CampaignService_1 = class CampaignService {
    cliWorkerService;
    logger = new common_1.Logger(CampaignService_1.name);
    constructor(cliWorkerService) {
        this.cliWorkerService = cliWorkerService;
    }
    async runCampaign(dto) {
        if (!core_1.assetsDb)
            throw new Error('Assets DB not initialized');
        const { workflowPath, accountId } = dto;
        this.logger.log(`Starting campaign for workflow: ${workflowPath}`);
        const selectedAccount = await this.getAvailableAccount(accountId);
        const selectedProxy = await this.getAliveProxy();
        const selectedProfile = await this.getBrowserProfile(selectedAccount.id);
        const payload = this.buildPayload(workflowPath, selectedAccount, selectedProxy, selectedProfile);
        return await this.cliWorkerService.dispatchJob(payload);
    }
    async getAvailableAccount(accountId) {
        let selectedAccount;
        if (accountId) {
            const results = await core_1.assetsDb.select().from(core_1.accounts).where((0, drizzle_orm_1.eq)(core_1.accounts.id, accountId));
            selectedAccount = results[0];
        }
        else {
            const results = await core_1.assetsDb.select().from(core_1.accounts).where((0, drizzle_orm_1.eq)(core_1.accounts.status, 'active')).limit(1);
            selectedAccount = results[0];
        }
        if (!selectedAccount) {
            throw new common_1.NotFoundException(accountId
                ? `Account ${accountId} not found`
                : 'No active accounts available');
        }
        return selectedAccount;
    }
    async getAliveProxy() {
        const availableProxies = await core_1.assetsDb.select().from(core_1.proxies).where((0, drizzle_orm_1.eq)(core_1.proxies.status, 'alive')).limit(1);
        return availableProxies.length > 0 ? availableProxies[0] : null;
    }
    async getBrowserProfile(accountId) {
        const boundProfiles = await core_1.assetsDb.select().from(core_1.browserProfiles).where((0, drizzle_orm_1.eq)(core_1.browserProfiles.accountId, accountId)).limit(1);
        if (boundProfiles.length > 0) {
            return boundProfiles[0];
        }
        const freeProfiles = await core_1.assetsDb.select().from(core_1.browserProfiles).where((0, drizzle_orm_1.isNull)(core_1.browserProfiles.accountId)).limit(1);
        return freeProfiles.length > 0
            ? freeProfiles[0]
            : {
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            };
    }
    buildPayload(workflowPath, account, proxy, profile) {
        return {
            workflowPath,
            options: {
                keepBrowserOpen: false,
            },
            assets: {
                accountId: account.id,
                cookies: account.cookies,
                proxyUrl: proxy
                    ? `${proxy.protocol}://${proxy.username ? proxy.username + ':' + proxy.password + '@' : ''}${proxy.host}:${proxy.port}`
                    : null,
                proxyId: proxy ? proxy.id : null,
                browserProfile: profile,
            },
        };
    }
};
exports.CampaignService = CampaignService;
exports.CampaignService = CampaignService = CampaignService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cli_worker_service_1.CliWorkerService])
], CampaignService);
//# sourceMappingURL=campaign.service.js.map