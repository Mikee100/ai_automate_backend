import { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { CreateReminderDto, UpdateReminderDto, ReminderFilterDto } from './dto/reminder.dto';
export declare class RemindersService {
    private prisma;
    private whatsappService;
    private remindersQueue;
    private readonly logger;
    private readonly STUDIO_TZ;
    constructor(prisma: PrismaService, whatsappService: WhatsappService, remindersQueue: Queue);
    scheduleRemindersForBooking(bookingId: string): Promise<any[]>;
    createReminder(data: CreateReminderDto): Promise<{
        id: string;
        type: string;
        scheduledFor: Date;
        sentAt: Date | null;
        status: string;
        messageContent: string | null;
        createdAt: Date;
        bookingId: string;
    }>;
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
            type: string;
            scheduledFor: Date;
            sentAt: Date | null;
            status: string;
            messageContent: string | null;
            createdAt: Date;
            bookingId: string;
        })[];
        total: number;
    }>;
    getReminderById(id: string): Promise<{
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
        type: string;
        scheduledFor: Date;
        sentAt: Date | null;
        status: string;
        messageContent: string | null;
        createdAt: Date;
        bookingId: string;
    }>;
    updateReminder(id: string, data: UpdateReminderDto): Promise<{
        id: string;
        type: string;
        scheduledFor: Date;
        sentAt: Date | null;
        status: string;
        messageContent: string | null;
        createdAt: Date;
        bookingId: string;
    }>;
    cancelRemindersForBooking(bookingId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    rescheduleRemindersForBooking(bookingId: string, newDateTime: Date): Promise<any[]>;
    sendReminder(reminderId: string): Promise<{
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
        type: string;
        scheduledFor: Date;
        sentAt: Date | null;
        status: string;
        messageContent: string | null;
        createdAt: Date;
        bookingId: string;
    }>;
    private generateReminderMessage;
    getUpcomingReminders(limit?: number): Promise<({
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
        type: string;
        scheduledFor: Date;
        sentAt: Date | null;
        status: string;
        messageContent: string | null;
        createdAt: Date;
        bookingId: string;
    })[]>;
}
