import { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { AiService } from '../ai/ai.service';
export declare class MessagesService {
    private prisma;
    private messageQueue;
    private aiService;
    getCustomerById(customerId: string): Promise<{
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        whatsappId: string | null;
        instagramId: string | null;
        messengerId: string | null;
        aiEnabled: boolean;
        isAiPaused: boolean;
        lastInstagramMessageAt: Date | null;
        lastMessengerMessageAt: Date | null;
        dailyTokenUsage: number;
        tokenResetDate: Date | null;
        totalTokensUsed: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    static classifyIntentSimple(content: string): string;
    constructor(prisma: PrismaService, messageQueue: Queue, aiService: AiService);
    create(createMessageDto: CreateMessageDto): Promise<{
        id: string;
        createdAt: Date;
        customerId: string;
        content: string;
        platform: string;
        direction: string;
        externalId: string | null;
        handledBy: string | null;
        isResolved: boolean | null;
        isEscalated: boolean | null;
    }>;
    findAll(): Promise<({
        customer: {
            id: string;
            name: string;
            email: string | null;
            phone: string | null;
            whatsappId: string | null;
            instagramId: string | null;
            messengerId: string | null;
            aiEnabled: boolean;
            isAiPaused: boolean;
            lastInstagramMessageAt: Date | null;
            lastMessengerMessageAt: Date | null;
            dailyTokenUsage: number;
            tokenResetDate: Date | null;
            totalTokensUsed: number;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        customerId: string;
        content: string;
        platform: string;
        direction: string;
        externalId: string | null;
        handledBy: string | null;
        isResolved: boolean | null;
        isEscalated: boolean | null;
    })[]>;
    countMessages(args: any): Promise<number>;
    findByCustomer(customerId: string): Promise<({
        customer: {
            id: string;
            name: string;
            email: string | null;
            phone: string | null;
            whatsappId: string | null;
            instagramId: string | null;
            messengerId: string | null;
            aiEnabled: boolean;
            isAiPaused: boolean;
            lastInstagramMessageAt: Date | null;
            lastMessengerMessageAt: Date | null;
            dailyTokenUsage: number;
            tokenResetDate: Date | null;
            totalTokensUsed: number;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        customerId: string;
        content: string;
        platform: string;
        direction: string;
        externalId: string | null;
        handledBy: string | null;
        isResolved: boolean | null;
        isEscalated: boolean | null;
    })[]>;
    findOne(id: string): Promise<{
        customer: {
            id: string;
            name: string;
            email: string | null;
            phone: string | null;
            whatsappId: string | null;
            instagramId: string | null;
            messengerId: string | null;
            aiEnabled: boolean;
            isAiPaused: boolean;
            lastInstagramMessageAt: Date | null;
            lastMessengerMessageAt: Date | null;
            dailyTokenUsage: number;
            tokenResetDate: Date | null;
            totalTokensUsed: number;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        customerId: string;
        content: string;
        platform: string;
        direction: string;
        externalId: string | null;
        handledBy: string | null;
        isResolved: boolean | null;
        isEscalated: boolean | null;
    }>;
    findByExternalId(externalId: string): Promise<{
        customer: {
            id: string;
            name: string;
            email: string | null;
            phone: string | null;
            whatsappId: string | null;
            instagramId: string | null;
            messengerId: string | null;
            aiEnabled: boolean;
            isAiPaused: boolean;
            lastInstagramMessageAt: Date | null;
            lastMessengerMessageAt: Date | null;
            dailyTokenUsage: number;
            tokenResetDate: Date | null;
            totalTokensUsed: number;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        customerId: string;
        content: string;
        platform: string;
        direction: string;
        externalId: string | null;
        handledBy: string | null;
        isResolved: boolean | null;
        isEscalated: boolean | null;
    }>;
    classifyIntent(content: string, history?: string[]): Promise<string>;
    sendOutboundMessage(customerId: string, content: string, platform: string): Promise<{
        id: string;
        createdAt: Date;
        customerId: string;
        content: string;
        platform: string;
        direction: string;
        externalId: string | null;
        handledBy: string | null;
        isResolved: boolean | null;
        isEscalated: boolean | null;
    }>;
    getConversationHistory(customerId: string, limit?: number): Promise<Array<{
        role: 'user' | 'assistant';
        content: string;
    }>>;
    getEnrichedContext(customerId: string): Promise<{
        history: {
            role: "user" | "assistant";
            content: string;
        }[];
        customer: {
            name: string;
            totalBookings: number;
            recentBookings: {
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
            }[];
            isReturning: boolean;
        };
        bookingDraft: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: string;
            service: string;
            recipientName: string;
            recipientPhone: string;
            date: string;
            time: string;
            isForSomeoneElse: boolean;
            dateTimeIso: string;
            step: string;
            conflictResolution: string;
            version: number;
        };
    }>;
}
