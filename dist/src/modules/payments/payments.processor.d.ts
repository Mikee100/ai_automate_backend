import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
export declare class PaymentsProcessor {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    handleTimeoutPayment(job: Job<{
        paymentId: string;
    }>): Promise<void>;
}
