"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const mmo_controller_1 = require("./mmo.controller");
const campaign_controller_1 = require("./campaign.controller");
const campaign_service_1 = require("./campaign.service");
const cli_worker_service_1 = require("./cli-worker.service");
const profile_controller_1 = require("./profile.controller");
const profile_service_1 = require("./profile.service");
const fleet_controller_1 = require("./fleet.controller");
const fleet_service_1 = require("./fleet.service");
const schedule_controller_1 = require("./schedule.controller");
const schedule_service_1 = require("./schedule.service");
const scheduler_dispatcher_service_1 = require("./scheduler-dispatcher.service");
const telemetry_service_1 = require("./telemetry.service");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule.forRoot({ isGlobal: true }), schedule_1.ScheduleModule.forRoot()],
        controllers: [app_controller_1.AppController, mmo_controller_1.MmoController, campaign_controller_1.CampaignController, profile_controller_1.ProfileController, fleet_controller_1.FleetController, schedule_controller_1.ScheduleController],
        providers: [app_service_1.AppService, campaign_service_1.CampaignService, cli_worker_service_1.CliWorkerService, profile_service_1.ProfileService, fleet_service_1.FleetService, schedule_service_1.ScheduleService, scheduler_dispatcher_service_1.SchedulerDispatcherService, telemetry_service_1.TelemetryService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map