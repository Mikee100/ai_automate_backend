import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EscalationService {
    private readonly logger = new Logger(EscalationService.name);

    constructor(private prisma: PrismaService) { }

    async createEscalation(customerId: string, reason?: string) {
        this.logger.log(`Escalating customer ${customerId} for reason: ${reason}`);

        // 1. Create Escalation record
        const escalation = await this.prisma.escalation.create({
            data: {
                customerId,
                reason,
                status: 'OPEN',
            },
        });

        // 2. Pause AI for this customer
        await this.prisma.customer.update({
            where: { id: customerId },
            data: { isAiPaused: true },
        });

        return escalation;
    }

    async resolveEscalation(escalationId: string) {
        this.logger.log(`Resolving escalation ${escalationId}`);

        const escalation = await this.prisma.escalation.update({
            where: { id: escalationId },
            data: { status: 'RESOLVED' },
        });

        // Unpause AI for this customer
        await this.prisma.customer.update({
            where: { id: escalation.customerId },
            data: { isAiPaused: false },
        });

        return escalation;
    }

    async isCustomerEscalated(customerId: string): Promise<boolean> {
        const customer = await this.prisma.customer.findUnique({
            where: { id: customerId },
            select: { isAiPaused: true },
        });
        return customer?.isAiPaused || false;
    }

    async getOpenEscalations() {
        return this.prisma.escalation.findMany({
            where: { status: 'OPEN' },
            include: { customer: true },
            orderBy: { createdAt: 'desc' },
        });
    }
}
