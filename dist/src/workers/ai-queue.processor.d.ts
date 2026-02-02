import { Job, Queue } from 'bull';
import { OnModuleInit } from '@nestjs/common';
import { AiService } from '../modules/ai/ai.service';
import { MessengerSendService } from '../modules/webhooks/messenger-send.service';
import { WhatsappService } from '../modules/whatsapp/whatsapp.service';
import { InstagramService } from '../modules/instagram/instagram.service';
import { MessagesService } from '../modules/messages/messages.service';
import { CustomersService } from '../modules/customers/customers.service';
import { BookingsService } from '../modules/bookings/bookings.service';
import { WebsocketGateway } from '../websockets/websocket.gateway';
import { PrismaService } from '../prisma/prisma.service';
export declare class AiQueueProcessor implements OnModuleInit {
    private readonly aiQueue;
    private readonly aiService;
    private readonly messengerSendService;
    private readonly whatsappService;
    private readonly instagramService;
    private readonly messagesService;
    private readonly customersService;
    private readonly bookingsService;
    private readonly websocketGateway;
    private readonly prisma;
    private readonly logger;
    constructor(aiQueue: Queue, aiService: AiService, messengerSendService: MessengerSendService, whatsappService: WhatsappService, instagramService: InstagramService, messagesService: MessagesService, customersService: CustomersService, bookingsService: BookingsService, websocketGateway: WebsocketGateway, prisma: PrismaService);
    onModuleInit(): void;
    onError(error: Error): void;
    onFailed(job: Job, error: Error): void;
    onResumed(): void;
    handleSendReminder(job: Job): Promise<{
        sent: boolean;
    }>;
    handleAiJob(job: Job): Promise<{
        success: boolean;
        platform: any;
        customerId: any;
    }>;
    private sendResponseByPlatform;
}
