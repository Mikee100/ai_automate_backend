import { EscalationService } from './escalation.service';
export declare class EscalationController {
    private readonly escalationService;
    constructor(escalationService: EscalationService);
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
    resolveEscalation(id: string): Promise<{
        id: string;
        reason: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
    }>;
}
