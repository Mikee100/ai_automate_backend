import { Controller, Get, Post, Patch, Delete, Param, Query, Body } from '@nestjs/common';
import { FollowupsService } from './followups.service';
import { FollowupFilterDto, UpdateFollowupDto, RecordFollowupResponseDto } from './dto/followup.dto';

@Controller('followups')
export class FollowupsController {
    constructor(private followupsService: FollowupsService) { }

    /**
     * Get all follow-ups with optional filters
     */
    @Get()
    async getFollowups(@Query() filters: FollowupFilterDto) {
        return this.followupsService.getFollowups(filters);
    }

    /**
     * Get follow-up analytics
     */
    @Get('analytics')
    async getAnalytics() {
        return this.followupsService.getFollowupAnalytics();
    }

    /**
     * Get follow-ups for a specific booking
     */
    @Get('booking/:bookingId')
    async getBookingFollowups(@Param('bookingId') bookingId: string) {
        return this.followupsService.getFollowups({ bookingId });
    }

    /**
     * Get upcoming follow-ups
     */
    @Get('upcoming')
    async getUpcomingFollowups(@Query('limit') limit?: string) {
        const limitNum = limit ? parseInt(limit) : 10;
        return this.followupsService.getUpcomingFollowups(limitNum);
    }

    /**
     * Get a specific follow-up
     */
    @Get(':id')
    async getFollowup(@Param('id') id: string) {
        return this.followupsService.getFollowupById(id);
    }

    /**
     * Manually send a follow-up
     */
    @Post(':id/send')
    async sendFollowup(@Param('id') id: string) {
        return this.followupsService.sendFollowup(id);
    }

    /**
     * Record customer response to follow-up
     */
    @Patch(':id/response')
    async recordResponse(
        @Param('id') id: string,
        @Body() response: RecordFollowupResponseDto,
    ) {
        return this.followupsService.recordResponse(id, response);
    }

    /**
     * Update a follow-up
     */
    @Patch(':id')
    async updateFollowup(
        @Param('id') id: string,
        @Body() data: UpdateFollowupDto,
    ) {
        return this.followupsService.updateFollowup(id, data);
    }

    /**
     * Cancel a follow-up
     */
    @Delete(':id')
    async cancelFollowup(@Param('id') id: string) {
        return this.followupsService.updateFollowup(id, { status: 'cancelled' });
    }
}
