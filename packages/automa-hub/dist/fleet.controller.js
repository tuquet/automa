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
exports.FleetController = void 0;
const common_1 = require("@nestjs/common");
const fleet_service_1 = require("./fleet.service");
let FleetController = class FleetController {
    fleetService;
    constructor(fleetService) {
        this.fleetService = fleetService;
    }
    async getAllFleets() {
        return this.fleetService.getAllFleets();
    }
    async getFleetById(id) {
        return this.fleetService.getFleetById(id);
    }
    async createFleet(body) {
        return this.fleetService.createFleet(body);
    }
    async getFleetMembers(id) {
        return this.fleetService.getFleetMembers(id);
    }
    async addFleetMember(id, body) {
        return this.fleetService.addFleetMember(id, body.accountId);
    }
    async removeFleetMember(id, accountId) {
        return this.fleetService.removeFleetMember(id, accountId);
    }
};
exports.FleetController = FleetController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FleetController.prototype, "getAllFleets", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FleetController.prototype, "getFleetById", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FleetController.prototype, "createFleet", null);
__decorate([
    (0, common_1.Get)(':id/members'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FleetController.prototype, "getFleetMembers", null);
__decorate([
    (0, common_1.Post)(':id/members'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FleetController.prototype, "addFleetMember", null);
__decorate([
    (0, common_1.Delete)(':id/members/:accountId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FleetController.prototype, "removeFleetMember", null);
exports.FleetController = FleetController = __decorate([
    (0, common_1.Controller)('api/fleets'),
    __metadata("design:paramtypes", [fleet_service_1.FleetService])
], FleetController);
//# sourceMappingURL=fleet.controller.js.map