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
var CliWorkerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CliWorkerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let CliWorkerService = CliWorkerService_1 = class CliWorkerService {
    configService;
    logger = new common_1.Logger(CliWorkerService_1.name);
    workerUrl;
    constructor(configService) {
        this.configService = configService;
        this.workerUrl = this.configService.get('CLI_WORKER_URL', 'http://127.0.0.1:3500/api/jobs/run');
    }
    async dispatchJob(payload) {
        this.logger.log(`Dispatching payload to CLI Worker at ${this.workerUrl}`);
        try {
            const response = await fetch(this.workerUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`CLI Worker responded with status ${response.status}: ${errorText}`);
            }
            const result = await response.json();
            this.logger.log(`Job queued successfully on CLI Worker. Job ID: ${result.jobId}`);
            return result;
        }
        catch (error) {
            const e = error;
            this.logger.error(`Failed to dispatch job to CLI Worker: ${e.message}`);
            throw new common_1.ServiceUnavailableException(`CLI Worker is unavailable: ${e.message}`);
        }
    }
};
exports.CliWorkerService = CliWorkerService;
exports.CliWorkerService = CliWorkerService = CliWorkerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CliWorkerService);
//# sourceMappingURL=cli-worker.service.js.map