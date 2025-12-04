import { EscalationService } from './escalation.service';
export declare class EscalationController {
    private readonly escalationService;
    constructor(escalationService: EscalationService);
    getOpenEscalations(): Promise<({
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
            dailyTokenUsage: number;
            tokenResetDate: Date | null;
            totalTokensUsed: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        status: string;
        reason: string | null;
        description: string | null;
        escalationType: string;
        sentimentScore: number | null;
    })[]>;
    resolveEscalation(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        status: string;
        reason: string | null;
        description: string | null;
        escalationType: string;
        sentimentScore: number | null;
    }>;
}
