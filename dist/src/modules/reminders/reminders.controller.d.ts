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
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    email: string | null;
                    whatsappId: string | null;
                    instagramId: string | null;
                    messengerId: string | null;
                    phone: string | null;
                    aiEnabled: boolean;
                    isAiPaused: boolean;
                    lastInstagramMessageAt: Date | null;
                    lastMessengerMessageAt: Date | null;
                    dailyTokenUsage: number;
                    tokenResetDate: Date | null;
                    totalTokensUsed: number;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                customerId: string;
                service: string;
                dateTime: Date;
                status: string;
                durationMinutes: number | null;
                recipientName: string | null;
                recipientPhone: string | null;
                googleEventId: string | null;
            };
        } & {
            id: string;
            type: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            bookingId: string;
            sentAt: Date | null;
            scheduledFor: Date;
            messageContent: string | null;
        })[];
        total: number;
    }>;
    getBookingReminders(bookingId: string): Promise<{
        reminders: ({
            booking: {
                customer: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    email: string | null;
                    whatsappId: string | null;
                    instagramId: string | null;
                    messengerId: string | null;
                    phone: string | null;
                    aiEnabled: boolean;
                    isAiPaused: boolean;
                    lastInstagramMessageAt: Date | null;
                    lastMessengerMessageAt: Date | null;
                    dailyTokenUsage: number;
                    tokenResetDate: Date | null;
                    totalTokensUsed: number;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                customerId: string;
                service: string;
                dateTime: Date;
                status: string;
                durationMinutes: number | null;
                recipientName: string | null;
                recipientPhone: string | null;
                googleEventId: string | null;
            };
        } & {
            id: string;
            type: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            bookingId: string;
            sentAt: Date | null;
            scheduledFor: Date;
            messageContent: string | null;
        })[];
        total: number;
    }>;
    getUpcomingReminders(limit?: string): Promise<({
        booking: {
            customer: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                email: string | null;
                whatsappId: string | null;
                instagramId: string | null;
                messengerId: string | null;
                phone: string | null;
                aiEnabled: boolean;
                isAiPaused: boolean;
                lastInstagramMessageAt: Date | null;
                lastMessengerMessageAt: Date | null;
                dailyTokenUsage: number;
                tokenResetDate: Date | null;
                totalTokensUsed: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: string;
            service: string;
            dateTime: Date;
            status: string;
            durationMinutes: number | null;
            recipientName: string | null;
            recipientPhone: string | null;
            googleEventId: string | null;
        };
    } & {
        id: string;
        type: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        bookingId: string;
        sentAt: Date | null;
        scheduledFor: Date;
        messageContent: string | null;
    })[]>;
    getReminder(id: string): Promise<{
        booking: {
            customer: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                email: string | null;
                whatsappId: string | null;
                instagramId: string | null;
                messengerId: string | null;
                phone: string | null;
                aiEnabled: boolean;
                isAiPaused: boolean;
                lastInstagramMessageAt: Date | null;
                lastMessengerMessageAt: Date | null;
                dailyTokenUsage: number;
                tokenResetDate: Date | null;
                totalTokensUsed: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: string;
            service: string;
            dateTime: Date;
            status: string;
            durationMinutes: number | null;
            recipientName: string | null;
            recipientPhone: string | null;
            googleEventId: string | null;
        };
    } & {
        id: string;
        type: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        bookingId: string;
        sentAt: Date | null;
        scheduledFor: Date;
        messageContent: string | null;
    }>;
    sendReminder(id: string): Promise<{
        booking: {
            customer: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                email: string | null;
                whatsappId: string | null;
                instagramId: string | null;
                messengerId: string | null;
                phone: string | null;
                aiEnabled: boolean;
                isAiPaused: boolean;
                lastInstagramMessageAt: Date | null;
                lastMessengerMessageAt: Date | null;
                dailyTokenUsage: number;
                tokenResetDate: Date | null;
                totalTokensUsed: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: string;
            service: string;
            dateTime: Date;
            status: string;
            durationMinutes: number | null;
            recipientName: string | null;
            recipientPhone: string | null;
            googleEventId: string | null;
        };
    } & {
        id: string;
        type: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        bookingId: string;
        sentAt: Date | null;
        scheduledFor: Date;
        messageContent: string | null;
    }>;
    updateReminder(id: string, data: UpdateReminderDto): Promise<{
        id: string;
        type: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        bookingId: string;
        sentAt: Date | null;
        scheduledFor: Date;
        messageContent: string | null;
    }>;
    cancelReminder(id: string): Promise<{
        id: string;
        type: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        bookingId: string;
        sentAt: Date | null;
        scheduledFor: Date;
        messageContent: string | null;
    }>;
}
