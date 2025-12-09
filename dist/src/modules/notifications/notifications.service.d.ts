import { PrismaService } from '../../prisma/prisma.service';
export declare class NotificationsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createNotification(data: {
        type: 'booking' | 'reschedule' | 'payment';
        title: string;
        message: string;
        metadata?: any;
    }): Promise<{
        id: string;
        createdAt: Date;
        type: string;
        title: string;
        message: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        read: boolean;
    }>;
    getNotifications(options?: {
        read?: boolean;
        type?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
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
    getUnreadCount(): Promise<number>;
    markAsRead(id: string): Promise<{
        id: string;
        createdAt: Date;
        type: string;
        title: string;
        message: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        read: boolean;
    }>;
    markAllAsRead(): Promise<import(".prisma/client").Prisma.BatchPayload>;
    deleteOldReadNotifications(daysOld?: number): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
