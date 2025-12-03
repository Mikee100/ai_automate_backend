import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('paymentsQueue')
export class PaymentsProcessor {
    private readonly logger = new Logger(PaymentsProcessor.name);

    constructor(private readonly prisma: PrismaService) { }

    @Process('timeoutPayment')
    async handleTimeoutPayment(job: Job<{ paymentId: string }>) {
        const { paymentId } = job.data;
        this.logger.debug(`Processing timeout for payment ${paymentId}`);

        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
        });

        if (!payment) {
            this.logger.warn(`Payment ${paymentId} not found during timeout check`);
            return;
        }

        if (payment.status === 'pending') {
            await this.prisma.payment.update({
                where: { id: paymentId },
                data: { status: 'failed' },
            });
            this.logger.log(`Payment ${paymentId} timed out and marked as failed`);
        } else {
            this.logger.debug(`Payment ${paymentId} status is ${payment.status}, skipping timeout`);
        }
    }
}
