import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { ProfileService } from './profile.service';

@Controller('api/profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getAllProfiles() {
    return this.profileService.getAllProfiles();
  }

  @Get(':id')
  async getProfileById(@Param('id') id: string) {
    return this.profileService.getProfileById(id);
  }

  @Post()
  async createProfile(@Body() body: any) {
    return this.profileService.createProfile(body);
  }

  @Delete(':id')
  async deleteProfile(@Param('id') id: string) {
    return this.profileService.deleteProfile(id);
  }
}
