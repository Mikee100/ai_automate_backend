import { PrismaService } from '../../prisma/prisma.service';
export declare class EscalationService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createEscalation(customerId: string, reason?: string, escalationType?: string, metadata?: any, sentimentScore?: number): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        customerId: string;
        reason: string | null;
        description: string | null;
        status: string;
        escalationType: string;
        sentimentScore: number | null;
    }>;
    resolveEscalation(escalationId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        customerId: string;
        reason: string | null;
        description: string | null;
        status: string;
        escalationType: string;
        sentimentScore: number | null;
    }>;
    isCustomerEscalated(customerId: string): Promise<boolean>;
    getOpenEscalations(): Promise<({
        customer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
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
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        customerId: string;
        reason: string | null;
        description: string | null;
        status: string;
        escalationType: string;
        sentimentScore: number | null;
    })[]>;
}
