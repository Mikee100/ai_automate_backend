import { Process, Processor } from '@nestjs/bull';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from './payments.service';

@Processor('paymentsQueue')
export class PaymentsProcessor {
    private readonly logger = new Logger(PaymentsProcessor.name);

    constructor(
        private readonly prisma: PrismaService,
        @Inject(forwardRef(() => PaymentsService)) private paymentsService: PaymentsService,
    ) { }

    @Process('timeoutPayment')
    async handleTimeoutPayment(job: Job<{ paymentId: string }>) {
        const { paymentId } = job.data;
        this.logger.debug(`Processing timeout for payment ${paymentId}`);

        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: { bookingDraft: { include: { customer: true } } },
        });

        if (!payment) {
            this.logger.warn(`Payment ${paymentId} not found during timeout check`);
            return;
        }

        if (payment.status === 'pending') {
            this.logger.warn(`Payment ${paymentId} timed out. Marking as failed and notifying user.`);
            await this.paymentsService.handlePaymentFailure(payment, 'Payment confirmation timed out (no callback received)');
        } else {
            this.logger.debug(`Payment ${paymentId} status is ${payment.status}, skipping timeout`);
        }
    }
}
