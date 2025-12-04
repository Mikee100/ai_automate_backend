import { PrismaService } from '../../../prisma/prisma.service';
interface HistoryMsg {
    role: 'user' | 'assistant' | 'system';
    content: string | any;
}
interface CircuitBreakerResult {
    shouldBreak: boolean;
    reason?: string;
    recovery: 'retry' | 'simplify' | 'escalate';
    repetitionCount?: number;
}
export declare class CircuitBreakerService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    checkAndBreak(customerId: string, recentMessages: HistoryMsg[]): Promise<CircuitBreakerResult>;
    private detectRepetition;
    private areSimilar;
    private detectUserFrustration;
    recordTrip(customerId: string, reason: string): Promise<void>;
}
export {};
