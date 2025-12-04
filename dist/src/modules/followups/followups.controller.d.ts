import { FollowupsService } from './followups.service';
import { FollowupFilterDto, UpdateFollowupDto, RecordFollowupResponseDto } from './dto/followup.dto';
export declare class FollowupsController {
    private followupsService;
    constructor(followupsService: FollowupsService);
    getFollowups(filters: FollowupFilterDto): Promise<{
        followups: ({
            booking: {
                customer: {
                    id: string;
                    createdAt: Date;
                    name: string;
                    updatedAt: Date;
                    email: string | null;
                    phone: string | null;
                    whatsappId: string | null;
                    instagramId: string | null;
                    messengerId: string | null;
                    aiEnabled: boolean;
                    isAiPaused: boolean;
                    lastInstagramMessageAt: Date | null;
                    dailyTokenUsage: number;
                    tokenResetDate: Date | null;
                    totalTokensUsed: number;
                };
            } & {
                id: string;
                status: string;
                createdAt: Date;
                customerId: string;
                service: string;
                dateTime: Date;
                durationMinutes: number | null;
                recipientName: string | null;
                recipientPhone: string | null;
                googleEventId: string | null;
                updatedAt: Date;
            };
        } & {
            id: string;
            bookingId: string;
            type: string;
            scheduledFor: Date;
            sentAt: Date | null;
            status: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            messageContent: string | null;
            createdAt: Date;
        })[];
        total: number;
    }>;
    getAnalytics(): Promise<{
        total: number;
        sent: number;
        pending: number;
        responseRate: number;
        averageRating: number;
        totalReviews: number;
        upsellConversionRate: number;
    }>;
    getBookingFollowups(bookingId: string): Promise<{
        followups: ({
            booking: {
                customer: {
                    id: string;
                    createdAt: Date;
                    name: string;
                    updatedAt: Date;
                    email: string | null;
                    phone: string | null;
                    whatsappId: string | null;
                    instagramId: string | null;
                    messengerId: string | null;
                    aiEnabled: boolean;
                    isAiPaused: boolean;
                    lastInstagramMessageAt: Date | null;
                    dailyTokenUsage: number;
                    tokenResetDate: Date | null;
                    totalTokensUsed: number;
                };
            } & {
                id: string;
                status: string;
                createdAt: Date;
                customerId: string;
                service: string;
                dateTime: Date;
                durationMinutes: number | null;
                recipientName: string | null;
                recipientPhone: string | null;
                googleEventId: string | null;
                updatedAt: Date;
            };
        } & {
            id: string;
            bookingId: string;
            type: string;
            scheduledFor: Date;
            sentAt: Date | null;
            status: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            messageContent: string | null;
            createdAt: Date;
        })[];
        total: number;
    }>;
    getUpcomingFollowups(limit?: string): Promise<({
        booking: {
            customer: {
                id: string;
                createdAt: Date;
                name: string;
                updatedAt: Date;
                email: string | null;
                phone: string | null;
                whatsappId: string | null;
                instagramId: string | null;
                messengerId: string | null;
                aiEnabled: boolean;
                isAiPaused: boolean;
                lastInstagramMessageAt: Date | null;
                dailyTokenUsage: number;
                tokenResetDate: Date | null;
                totalTokensUsed: number;
            };
        } & {
            id: string;
            status: string;
            createdAt: Date;
            customerId: string;
            service: string;
            dateTime: Date;
            durationMinutes: number | null;
            recipientName: string | null;
            recipientPhone: string | null;
            googleEventId: string | null;
            updatedAt: Date;
        };
    } & {
        id: string;
        bookingId: string;
        type: string;
        scheduledFor: Date;
        sentAt: Date | null;
        status: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        messageContent: string | null;
        createdAt: Date;
    })[]>;
    getFollowup(id: string): Promise<{
        booking: {
            customer: {
                id: string;
                createdAt: Date;
                name: string;
                updatedAt: Date;
                email: string | null;
                phone: string | null;
                whatsappId: string | null;
                instagramId: string | null;
                messengerId: string | null;
                aiEnabled: boolean;
                isAiPaused: boolean;
                lastInstagramMessageAt: Date | null;
                dailyTokenUsage: number;
                tokenResetDate: Date | null;
                totalTokensUsed: number;
            };
        } & {
            id: string;
            status: string;
            createdAt: Date;
            customerId: string;
            service: string;
            dateTime: Date;
            durationMinutes: number | null;
            recipientName: string | null;
            recipientPhone: string | null;
            googleEventId: string | null;
            updatedAt: Date;
        };
    } & {
        id: string;
        bookingId: string;
        type: string;
        scheduledFor: Date;
        sentAt: Date | null;
        status: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        messageContent: string | null;
        createdAt: Date;
    }>;
    sendFollowup(id: string): Promise<{
        booking: {
            customer: {
                id: string;
                createdAt: Date;
                name: string;
                updatedAt: Date;
                email: string | null;
                phone: string | null;
                whatsappId: string | null;
                instagramId: string | null;
                messengerId: string | null;
                aiEnabled: boolean;
                isAiPaused: boolean;
                lastInstagramMessageAt: Date | null;
                dailyTokenUsage: number;
                tokenResetDate: Date | null;
                totalTokensUsed: number;
            };
        } & {
            id: string;
            status: string;
            createdAt: Date;
            customerId: string;
            service: string;
            dateTime: Date;
            durationMinutes: number | null;
            recipientName: string | null;
            recipientPhone: string | null;
            googleEventId: string | null;
            updatedAt: Date;
        };
    } & {
        id: string;
        bookingId: string;
        type: string;
        scheduledFor: Date;
        sentAt: Date | null;
        status: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        messageContent: string | null;
        createdAt: Date;
    }>;
    recordResponse(id: string, response: RecordFollowupResponseDto): Promise<{
        id: string;
        bookingId: string;
        type: string;
        scheduledFor: Date;
        sentAt: Date | null;
        status: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        messageContent: string | null;
        createdAt: Date;
    }>;
    updateFollowup(id: string, data: UpdateFollowupDto): Promise<{
        id: string;
        bookingId: string;
        type: string;
        scheduledFor: Date;
        sentAt: Date | null;
        status: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        messageContent: string | null;
        createdAt: Date;
    }>;
    cancelFollowup(id: string): Promise<{
        id: string;
        bookingId: string;
        type: string;
        scheduledFor: Date;
        sentAt: Date | null;
        status: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        messageContent: string | null;
        createdAt: Date;
    }>;
}
