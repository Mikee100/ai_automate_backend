import { Controller, Get, Post, Patch, Delete, Param, Query, Body } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { ReminderFilterDto, UpdateReminderDto } from './dto/reminder.dto';

@Controller('reminders')
export class RemindersController {
    constructor(private remindersService: RemindersService) { }

    /**
     * Get all reminders with optional filters
     */
    @Get()
    async getReminders(@Query() filters: ReminderFilterDto) {
        return this.remindersService.getReminders(filters);
    }

    /**
     * Get reminders for a specific booking
     */
    @Get('booking/:bookingId')
    async getBookingReminders(@Param('bookingId') bookingId: string) {
        return this.remindersService.getReminders({ bookingId });
    }

    /**
     * Get upcoming reminders
     */
    @Get('upcoming')
    async getUpcomingReminders(@Query('limit') limit?: string) {
        const limitNum = limit ? parseInt(limit) : 10;
        return this.remindersService.getUpcomingReminders(limitNum);
    }

    /**
     * Get a specific reminder
     */
    @Get(':id')
    async getReminder(@Param('id') id: string) {
        return this.remindersService.getReminderById(id);
    }

    /**
     * Manually send a reminder
     */
    @Post(':id/send')
    async sendReminder(@Param('id') id: string) {
        return this.remindersService.sendReminder(id);
    }

    /**
     * Update a reminder
     */
    @Patch(':id')
    async updateReminder(
        @Param('id') id: string,
        @Body() data: UpdateReminderDto,
    ) {
        return this.remindersService.updateReminder(id, data);
    }

    /**
     * Cancel a reminder
     */
    @Delete(':id')
    async cancelReminder(@Param('id') id: string) {
        return this.remindersService.updateReminder(id, { status: 'cancelled' });
    }
}
