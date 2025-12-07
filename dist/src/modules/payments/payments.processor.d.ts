import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from './payments.service';
export declare class PaymentsProcessor {
    private readonly prisma;
    private paymentsService;
    private readonly logger;
    constructor(prisma: PrismaService, paymentsService: PaymentsService);
    handleTimeoutPayment(job: Job<{
        paymentId: string;
    }>): Promise<void>;
}
