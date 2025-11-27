import { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { MessagesService } from '../messages/messages.service';
export declare class CronService {
    private prisma;
    private messagesService;
    private aiQueue;
    private readonly logger;
    private readonly studioTz;
    constructor(prisma: PrismaService, messagesService: MessagesService, aiQueue: Queue);
    sendBookingReminders(): Promise<void>;
    sendPostShootFollowUps(): Promise<void>;
    triggerRemindersManually(): Promise<void>;
    triggerFollowUpsManually(): Promise<void>;
}
