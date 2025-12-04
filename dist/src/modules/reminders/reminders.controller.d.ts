import { RemindersService } from './reminders.service';
import { ReminderFilterDto, UpdateReminderDto } from './dto/reminder.dto';
export declare class RemindersController {
    private remindersService;
    constructor(remindersService: RemindersService);
    getReminders(filters: ReminderFilterDto): Promise<{
        reminders: ({
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
            messageContent: string | null;
            createdAt: Date;
        })[];
        total: number;
    }>;
    getBookingReminders(bookingId: string): Promise<{
        reminders: ({
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
            messageContent: string | null;
            createdAt: Date;
        })[];
        total: number;
    }>;
    getUpcomingReminders(limit?: string): Promise<({
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
        messageContent: string | null;
        createdAt: Date;
    })[]>;
    getReminder(id: string): Promise<{
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
        messageContent: string | null;
        createdAt: Date;
    }>;
    sendReminder(id: string): Promise<{
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
        messageContent: string | null;
        createdAt: Date;
    }>;
    updateReminder(id: string, data: UpdateReminderDto): Promise<{
        id: string;
        bookingId: string;
        type: string;
        scheduledFor: Date;
        sentAt: Date | null;
        status: string;
        messageContent: string | null;
        createdAt: Date;
    }>;
    cancelReminder(id: string): Promise<{
        id: string;
        bookingId: string;
        type: string;
        scheduledFor: Date;
        sentAt: Date | null;
        status: string;
        messageContent: string | null;
        createdAt: Date;
    }>;
}
