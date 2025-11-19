import { Controller, Get, Post, Query } from '@nestjs/common';
import { CalendarService } from './calendar.service';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('slots')
  getAvailableSlots(@Query('date') date: string, @Query('service') service?: string) {
    const dateObj = new Date(date);
    return this.calendarService.getAvailableSlots(dateObj, service);
  }

  @Post('sync')
  syncCalendar() {
    return this.calendarService.syncCalendar();
  }
}
