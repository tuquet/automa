"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CampaignService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignService = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@automa/core");
const drizzle_orm_1 = require("drizzle-orm");
let CampaignService = CampaignService_1 = class CampaignService {
    logger = new common_1.Logger(CampaignService_1.name);
    async runCampaign(workflowPath, accountId) {
        if (!core_1.assetsDb)
            throw new Error("Assets DB not initialized");
        this.logger.log(`Starting campaign for workflow: ${workflowPath}`);
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
            throw new Error("No active accounts available");
        }
        const availableProxies = await core_1.assetsDb.select().from(core_1.proxies).where((0, drizzle_orm_1.eq)(core_1.proxies.status, 'alive')).limit(1);
        const selectedProxy = availableProxies.length > 0 ? availableProxies[0] : null;
        let selectedProfile;
        const boundProfiles = await core_1.assetsDb.select().from(core_1.browserProfiles).where((0, drizzle_orm_1.eq)(core_1.browserProfiles.accountId, selectedAccount.id)).limit(1);
        if (boundProfiles.length > 0) {
            selectedProfile = boundProfiles[0];
        }
        else {
            const freeProfiles = await core_1.assetsDb.select().from(core_1.browserProfiles).where((0, drizzle_orm_1.isNull)(core_1.browserProfiles.accountId)).limit(1);
            selectedProfile = freeProfiles.length > 0 ? freeProfiles[0] : { userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" };
        }
        const payload = {
            workflowPath,
            options: {
                keepBrowserOpen: false,
            },
            assets: {
                accountId: selectedAccount.id,
                cookies: selectedAccount.cookies,
                proxy: selectedProxy ? `${selectedProxy.protocol}://${selectedProxy.username ? selectedProxy.username + ':' + selectedProxy.password + '@' : ''}${selectedProxy.host}:${selectedProxy.port}` : null,
                browserProfile: selectedProfile
            }
        };
        this.logger.log(`Dispatching to CLI Worker: Account ${selectedAccount.id}, Proxy ${selectedProxy?.id || 'None'}`);
        try {
            const response = await fetch('http://127.0.0.1:3500/api/jobs/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`CLI Worker Error: ${errorText}`);
            }
            const result = await response.json();
            this.logger.log(`Job queued on CLI Worker. Job ID: ${result.jobId}`);
            return result;
        }
        catch (e) {
            this.logger.error(`Failed to dispatch to CLI Worker: ${e.message}`);
            throw e;
        }
    }
};
exports.CampaignService = CampaignService;
exports.CampaignService = CampaignService = CampaignService_1 = __decorate([
    (0, common_1.Injectable)()
], CampaignService);
//# sourceMappingURL=campaign.service.js.map