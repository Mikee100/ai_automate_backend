import { Controller, Get, Patch, Param, Query, Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
    private readonly logger = new Logger(NotificationsController.name);

    constructor(private notificationsService: NotificationsService) { }

    /**
     * GET /notifications
     * Fetch notifications with optional filters
     * Query params: read (boolean), type (string), limit (number), offset (number)
     */
    @Get()
    async getNotifications(
        @Query('read') read?: string,
        @Query('type') type?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        const options: any = {};

        if (read !== undefined) {
            options.read = read === 'true';
        }

        if (type) {
            options.type = type;
        }

        if (limit) {
            options.limit = parseInt(limit, 10);
        }

        if (offset) {
            options.offset = parseInt(offset, 10);
        }

        return this.notificationsService.getNotifications(options);
    }

    /**
     * GET /notifications/unread-count
     * Get count of unread notifications
     */
    @Get('unread-count')
    async getUnreadCount() {
        const count = await this.notificationsService.getUnreadCount();
        return { count };
    }

    /**
     * PATCH /notifications/:id/read
     * Mark a single notification as read
     */
    @Patch(':id/read')
    async markAsRead(@Param('id') id: string) {
        const notification = await this.notificationsService.markAsRead(id);
        return { success: true, notification };
    }

    /**
     * PATCH /notifications/mark-all-read
     * Mark all notifications as read
     */
    @Patch('mark-all-read')
    async markAllAsRead() {
        const result = await this.notificationsService.markAllAsRead();
        return { success: true, count: result.count };
    }
}
