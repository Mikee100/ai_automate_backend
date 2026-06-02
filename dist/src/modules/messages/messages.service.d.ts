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
        createdAt: Date;
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
        updatedAt: Date;
    }>;
    static classifyIntentSimple(content: string): string;
    constructor(prisma: PrismaService, messageQueue: Queue, aiService: AiService);
    create(createMessageDto: CreateMessageDto): Promise<{
        id: string;
        content: string;
        platform: string;
        direction: string;
        customerId: string;
        externalId: string | null;
        createdAt: Date;
        handledBy: string | null;
        isResolved: boolean | null;
        isEscalated: boolean | null;
    }>;
    findAll(): Promise<({
        customer: {
            id: string;
            createdAt: Date;
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
            updatedAt: Date;
        };
    } & {
        id: string;
        content: string;
        platform: string;
        direction: string;
        customerId: string;
        externalId: string | null;
        createdAt: Date;
        handledBy: string | null;
        isResolved: boolean | null;
        isEscalated: boolean | null;
    })[]>;
    countMessages(args: any): Promise<number>;
    findByCustomer(customerId: string): Promise<({
        customer: {
            id: string;
            createdAt: Date;
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
            updatedAt: Date;
        };
    } & {
        id: string;
        content: string;
        platform: string;
        direction: string;
        customerId: string;
        externalId: string | null;
        createdAt: Date;
        handledBy: string | null;
        isResolved: boolean | null;
        isEscalated: boolean | null;
    })[]>;
    findOne(id: string): Promise<{
        customer: {
            id: string;
            createdAt: Date;
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
            updatedAt: Date;
        };
    } & {
        id: string;
        content: string;
        platform: string;
        direction: string;
        customerId: string;
        externalId: string | null;
        createdAt: Date;
        handledBy: string | null;
        isResolved: boolean | null;
        isEscalated: boolean | null;
    }>;
    findByExternalId(externalId: string): Promise<{
        customer: {
            id: string;
            createdAt: Date;
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
            updatedAt: Date;
        };
    } & {
        id: string;
        content: string;
        platform: string;
        direction: string;
        customerId: string;
        externalId: string | null;
        createdAt: Date;
        handledBy: string | null;
        isResolved: boolean | null;
        isEscalated: boolean | null;
    }>;
    classifyIntent(content: string, history?: string[]): Promise<string>;
    sendOutboundMessage(customerId: string, content: string, platform: string): Promise<{
        id: string;
        content: string;
        platform: string;
        direction: string;
        customerId: string;
        externalId: string | null;
        createdAt: Date;
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
                customerId: string;
                createdAt: Date;
                updatedAt: Date;
                status: string;
                googleEventId: string | null;
                service: string;
                dateTime: Date;
                durationMinutes: number | null;
                recipientName: string | null;
                recipientPhone: string | null;
            }[];
            isReturning: boolean;
        };
        bookingDraft: {
            id: string;
            customerId: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            service: string;
            recipientName: string;
            recipientPhone: string;
            date: string;
            time: string;
            dateTimeIso: string;
            isForSomeoneElse: boolean;
            step: string;
            conflictResolution: string;
            version: number;
        };
    }>;
}
