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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PaymentsProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const payments_service_1 = require("./payments.service");
let PaymentsProcessor = PaymentsProcessor_1 = class PaymentsProcessor {
    constructor(prisma, paymentsService) {
        this.prisma = prisma;
        this.paymentsService = paymentsService;
        this.logger = new common_1.Logger(PaymentsProcessor_1.name);
    }
    async handleTimeoutPayment(job) {
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
        }
        else {
            this.logger.debug(`Payment ${paymentId} status is ${payment.status}, skipping timeout`);
        }
    }
};
exports.PaymentsProcessor = PaymentsProcessor;
__decorate([
    (0, bull_1.Process)('timeoutPayment'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsProcessor.prototype, "handleTimeoutPayment", null);
exports.PaymentsProcessor = PaymentsProcessor = PaymentsProcessor_1 = __decorate([
    (0, bull_1.Processor)('paymentsQueue'),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => payments_service_1.PaymentsService))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        payments_service_1.PaymentsService])
], PaymentsProcessor);
//# sourceMappingURL=payments.processor.js.map