import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private notificationsService;
    private readonly logger;
    constructor(notificationsService: NotificationsService);
    getNotifications(read?: string, type?: string, limit?: string, offset?: string): Promise<{
        notifications: {
            id: string;
            createdAt: Date;
            type: string;
            title: string;
            message: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            read: boolean;
        }[];
        total: number;
        unreadCount: number;
    }>;
    getUnreadCount(): Promise<{
        count: number;
    }>;
    markAsRead(id: string): Promise<{
        success: boolean;
        notification: {
            id: string;
            createdAt: Date;
            type: string;
            title: string;
            message: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            read: boolean;
        };
    }>;
    markAllAsRead(): Promise<{
        success: boolean;
        count: number;
    }>;
}
