import { PrismaService } from '../../prisma/prisma.service';
export declare class EscalationService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createEscalation(customerId: string, reason?: string): Promise<{
        id: string;
        reason: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
    }>;
    resolveEscalation(escalationId: string): Promise<{
        id: string;
        reason: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
    }>;
    isCustomerEscalated(customerId: string): Promise<boolean>;
    getOpenEscalations(): Promise<({
        customer: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            email: string | null;
            phone: string | null;
            whatsappId: string | null;
            instagramId: string | null;
            messengerId: string | null;
            aiEnabled: boolean;
            isAiPaused: boolean;
        };
    } & {
        id: string;
        reason: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
    })[]>;
}
