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
var PaymentListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const booking_events_1 = require("../../bookings/events/booking.events");
const payments_service_1 = require("../payments.service");
let PaymentListener = PaymentListener_1 = class PaymentListener {
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
        this.logger = new common_1.Logger(PaymentListener_1.name);
    }
    async handleBookingDraftCompleted(event) {
        this.logger.log(`[Event] BookingDraftCompleted: customerId=${event.customerId}, draftId=${event.draftId}`);
        try {
            let phone = event.recipientPhone;
            if (!phone.startsWith('254')) {
                phone = `254${phone.replace(/^0+/, '')}`;
            }
            await this.paymentsService.initiateSTKPush(event.draftId, phone, event.depositAmount);
            this.logger.log(`[Event] STK Push initiated for deposit of ${event.depositAmount} KSH for draft ${event.draftId}`);
        }
        catch (error) {
            this.logger.error(`[Event] Failed to initiate STK Push for draft ${event.draftId}`, error);
        }
    }
};
exports.PaymentListener = PaymentListener;
__decorate([
    (0, event_emitter_1.OnEvent)('booking.draft.completed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [booking_events_1.BookingDraftCompletedEvent]),
    __metadata("design:returntype", Promise)
], PaymentListener.prototype, "handleBookingDraftCompleted", null);
exports.PaymentListener = PaymentListener = PaymentListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentListener);
//# sourceMappingURL=payment.listener.js.map