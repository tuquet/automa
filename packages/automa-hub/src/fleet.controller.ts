import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { FleetService } from './fleet.service';

@Controller('api/fleets')
export class FleetController {
  constructor(private readonly fleetService: FleetService) {}

  @Get()
  async getAllFleets() {
    return this.fleetService.getAllFleets();
  }

  @Get(':id')
  async getFleetById(@Param('id') id: string) {
    return this.fleetService.getFleetById(id);
  }

  @Post()
  async createFleet(@Body() body: any) {
    return this.fleetService.createFleet(body);
  }

  @Get(':id/members')
  async getFleetMembers(@Param('id') id: string) {
    return this.fleetService.getFleetMembers(id);
  }

  @Post(':id/members')
  async addFleetMember(@Param('id') id: string, @Body() body: { accountId: string }) {
    return this.fleetService.addFleetMember(id, body.accountId);
  }

  @Delete(':id/members/:accountId')
  async removeFleetMember(@Param('id') id: string, @Param('accountId') accountId: string) {
    return this.fleetService.removeFleetMember(id, accountId);
  }
}
