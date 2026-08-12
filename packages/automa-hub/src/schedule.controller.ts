import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { SchedulerDispatcherService } from './scheduler-dispatcher.service';

@Controller('api/schedules')
export class ScheduleController {
  constructor(
    private readonly scheduleService: ScheduleService,
    private readonly dispatcherService: SchedulerDispatcherService,
  ) {}

  @Get()
  async getAllSchedules() {
    return this.scheduleService.getAllSchedules();
  }

  @Get(':id')
  async getScheduleById(@Param('id') id: string) {
    return this.scheduleService.getScheduleById(id);
  }

  @Post()
  async createSchedule(@Body() body: any) {
    const newSchedule = await this.scheduleService.createSchedule(body);
    
    // Auto-register cron job if it is active
    if (newSchedule.status === 'active') {
      this.dispatcherService.addCronJobForSchedule(newSchedule);
    }
    
    return newSchedule;
  }

  @Delete(':id')
  async deleteSchedule(@Param('id') id: string) {
    const result = await this.scheduleService.deleteSchedule(id);
    this.dispatcherService.removeCronJob(id);
    return result;
  }

  @Put(':id/status')
  async updateScheduleStatus(@Param('id') id: string, @Body() body: { status: string }) {
    const updated = await this.scheduleService.updateScheduleStatus(id, body.status);
    
    if (updated.status === 'active') {
      this.dispatcherService.addCronJobForSchedule(updated);
    } else {
      this.dispatcherService.removeCronJob(id);
    }
    
    return updated;
  }
}
