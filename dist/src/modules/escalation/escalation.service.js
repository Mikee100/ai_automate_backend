"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EscalationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscalationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let EscalationService = EscalationService_1 = class EscalationService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(EscalationService_1.name);
    }
    async createEscalation(customerId, reason, escalationType = 'manual', metadata, sentimentScore) {
        this.logger.log(`Escalating customer ${customerId} for reason: ${reason} (type: ${escalationType})`);
        const escalation = await this.prisma.escalation.create({
            data: {
                customerId,
                reason,
                status: 'OPEN',
                escalationType,
                metadata: metadata || null,
                sentimentScore: sentimentScore || null,
            },
        });
        await this.prisma.customer.update({
            where: { id: customerId },
            data: { isAiPaused: true },
        });
        return escalation;
    }
    async resolveEscalation(escalationId) {
        this.logger.log(`Resolving escalation ${escalationId}`);
        const escalation = await this.prisma.escalation.update({
            where: { id: escalationId },
            data: { status: 'RESOLVED' },
        });
        await this.prisma.customer.update({
            where: { id: escalation.customerId },
            data: { isAiPaused: false },
        });
        return escalation;
    }
    async isCustomerEscalated(customerId) {
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
};
exports.EscalationService = EscalationService;
exports.EscalationService = EscalationService = EscalationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EscalationService);
//# sourceMappingURL=escalation.service.js.map