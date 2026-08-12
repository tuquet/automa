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
exports.ScheduleController = void 0;
const common_1 = require("@nestjs/common");
const schedule_service_1 = require("./schedule.service");
const scheduler_dispatcher_service_1 = require("./scheduler-dispatcher.service");
let ScheduleController = class ScheduleController {
    scheduleService;
    dispatcherService;
    constructor(scheduleService, dispatcherService) {
        this.scheduleService = scheduleService;
        this.dispatcherService = dispatcherService;
    }
    async getAllSchedules() {
        return this.scheduleService.getAllSchedules();
    }
    async getScheduleById(id) {
        return this.scheduleService.getScheduleById(id);
    }
    async createSchedule(body) {
        const newSchedule = await this.scheduleService.createSchedule(body);
        if (newSchedule.status === 'active') {
            this.dispatcherService.addCronJobForSchedule(newSchedule);
        }
        return newSchedule;
    }
    async deleteSchedule(id) {
        const result = await this.scheduleService.deleteSchedule(id);
        this.dispatcherService.removeCronJob(id);
        return result;
    }
    async updateScheduleStatus(id, body) {
        const updated = await this.scheduleService.updateScheduleStatus(id, body.status);
        if (updated.status === 'active') {
            this.dispatcherService.addCronJobForSchedule(updated);
        }
        else {
            this.dispatcherService.removeCronJob(id);
        }
        return updated;
    }
};
exports.ScheduleController = ScheduleController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScheduleController.prototype, "getAllSchedules", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ScheduleController.prototype, "getScheduleById", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ScheduleController.prototype, "createSchedule", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ScheduleController.prototype, "deleteSchedule", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ScheduleController.prototype, "updateScheduleStatus", null);
exports.ScheduleController = ScheduleController = __decorate([
    (0, common_1.Controller)('api/schedules'),
    __metadata("design:paramtypes", [schedule_service_1.ScheduleService,
        scheduler_dispatcher_service_1.SchedulerDispatcherService])
], ScheduleController);
//# sourceMappingURL=schedule.controller.js.map