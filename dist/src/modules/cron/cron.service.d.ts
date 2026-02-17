import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { MessagesService } from '../messages/messages.service';
export declare class CronService {
    private prisma;
    private messagesService;
    private aiQueue;
    private configService;
    private readonly logger;
    private readonly studioTz;
    constructor(prisma: PrismaService, messagesService: MessagesService, aiQueue: Queue, configService: ConfigService);
    sendBookingReminders(): Promise<void>;
    sendPostShootFollowUps(): Promise<void>;
    checkAbandonedBookings(): Promise<void>;
    triggerRemindersManually(): Promise<void>;
    triggerFollowUpsManually(): Promise<void>;
    triggerNudgesManually(): Promise<void>;
}
