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
var BookingFollowupsListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingFollowupsListener = exports.BookingCompletedEvent = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const followups_service_1 = require("../followups.service");
const booking_events_1 = require("../../bookings/events/booking.events");
class BookingCompletedEvent {
    constructor(bookingId, customerId, service, completedAt) {
        this.bookingId = bookingId;
        this.customerId = customerId;
        this.service = service;
        this.completedAt = completedAt;
    }
}
exports.BookingCompletedEvent = BookingCompletedEvent;
let BookingFollowupsListener = BookingFollowupsListener_1 = class BookingFollowupsListener {
    constructor(followupsService) {
        this.followupsService = followupsService;
        this.logger = new common_1.Logger(BookingFollowupsListener_1.name);
    }
    async handleBookingCompleted(event) {
        this.logger.log(`Scheduling follow-ups for completed booking ${event.bookingId}`);
        try {
            await this.followupsService.scheduleFollowupsForBooking(event.bookingId);
        }
        catch (error) {
            this.logger.error(`Failed to schedule follow-ups for booking ${event.bookingId}`, error);
        }
    }
    async handleBookingCancelled(event) {
        this.logger.log(`Cancelling follow-ups for booking ${event.bookingId}`);
        try {
            await this.followupsService.cancelFollowupsForBooking(event.bookingId);
        }
        catch (error) {
            this.logger.error(`Failed to cancel follow-ups for booking ${event.bookingId}`, error);
        }
    }
};
exports.BookingFollowupsListener = BookingFollowupsListener;
__decorate([
    (0, event_emitter_1.OnEvent)('booking.completed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [BookingCompletedEvent]),
    __metadata("design:returntype", Promise)
], BookingFollowupsListener.prototype, "handleBookingCompleted", null);
__decorate([
    (0, event_emitter_1.OnEvent)('booking.cancelled'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [booking_events_1.BookingCancelledEvent]),
    __metadata("design:returntype", Promise)
], BookingFollowupsListener.prototype, "handleBookingCancelled", null);
exports.BookingFollowupsListener = BookingFollowupsListener = BookingFollowupsListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [followups_service_1.FollowupsService])
], BookingFollowupsListener);
//# sourceMappingURL=booking-followups.listener.js.map