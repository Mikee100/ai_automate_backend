import { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { AiService } from '../ai/ai.service';
export declare class MessagesService {
    private prisma;
    private messageQueue;
    private aiService;
    constructor(prisma: PrismaService, messageQueue: Queue, aiService: AiService);
    create(createMessageDto: CreateMessageDto): Promise<{
        id: string;
        content: string;
        platform: string;
        direction: string;
        externalId: string | null;
        createdAt: Date;
        customerId: string;
    }>;
    findAll(): Promise<({
        customer: {
            id: string;
            createdAt: Date;
            name: string;
            email: string;
            phone: string | null;
            whatsappId: string | null;
            instagramId: string | null;
            updatedAt: Date;
        };
    } & {
        id: string;
        content: string;
        platform: string;
        direction: string;
        externalId: string | null;
        createdAt: Date;
        customerId: string;
    })[]>;
    findByCustomer(customerId: string): Promise<({
        customer: {
            id: string;
            createdAt: Date;
            name: string;
            email: string;
            phone: string | null;
            whatsappId: string | null;
            instagramId: string | null;
            updatedAt: Date;
        };
    } & {
        id: string;
        content: string;
        platform: string;
        direction: string;
        externalId: string | null;
        createdAt: Date;
        customerId: string;
    })[]>;
    findOne(id: string): Promise<{
        customer: {
            id: string;
            createdAt: Date;
            name: string;
            email: string;
            phone: string | null;
            whatsappId: string | null;
            instagramId: string | null;
            updatedAt: Date;
        };
    } & {
        id: string;
        content: string;
        platform: string;
        direction: string;
        externalId: string | null;
        createdAt: Date;
        customerId: string;
    }>;
    findByExternalId(externalId: string): Promise<{
        customer: {
            id: string;
            createdAt: Date;
            name: string;
            email: string;
            phone: string | null;
            whatsappId: string | null;
            instagramId: string | null;
            updatedAt: Date;
        };
    } & {
        id: string;
        content: string;
        platform: string;
        direction: string;
        externalId: string | null;
        createdAt: Date;
        customerId: string;
    }>;
    classifyIntent(content: string, history?: string[]): Promise<string>;
    sendOutboundMessage(customerId: string, content: string, platform: string): Promise<{
        id: string;
        content: string;
        platform: string;
        direction: string;
        externalId: string | null;
        createdAt: Date;
        customerId: string;
    }>;
}
