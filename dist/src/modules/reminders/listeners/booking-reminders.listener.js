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
var BookingRemindersListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingRemindersListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const reminders_service_1 = require("../reminders.service");
const booking_events_1 = require("../../bookings/events/booking.events");
let BookingRemindersListener = BookingRemindersListener_1 = class BookingRemindersListener {
    constructor(remindersService) {
        this.remindersService = remindersService;
        this.logger = new common_1.Logger(BookingRemindersListener_1.name);
    }
    async handleBookingCreated(event) {
        this.logger.log(`Scheduling reminders for new booking ${event.bookingId}`);
        try {
            await this.remindersService.scheduleRemindersForBooking(event.bookingId);
        }
        catch (error) {
            this.logger.error(`Failed to schedule reminders for booking ${event.bookingId}`, error);
        }
    }
    async handleBookingRescheduled(event) {
        try {
            await this.remindersService.rescheduleRemindersForBooking(event.bookingId, event.newDateTime);
        }
        catch (error) {
            this.logger.error(`Failed to reschedule reminders for booking ${event.bookingId}`, error);
        }
    }
    async handleBookingCancelled(event) {
        try {
            await this.remindersService.cancelRemindersForBooking(event.bookingId);
        }
        catch (error) {
            this.logger.error(`Failed to cancel reminders for booking ${event.bookingId}`, error);
        }
    }
};
exports.BookingRemindersListener = BookingRemindersListener;
__decorate([
    (0, event_emitter_1.OnEvent)('booking.created'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [booking_events_1.BookingCreatedEvent]),
    __metadata("design:returntype", Promise)
], BookingRemindersListener.prototype, "handleBookingCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)('booking.rescheduled'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [booking_events_1.BookingRescheduledEvent]),
    __metadata("design:returntype", Promise)
], BookingRemindersListener.prototype, "handleBookingRescheduled", null);
__decorate([
    (0, event_emitter_1.OnEvent)('booking.cancelled'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [booking_events_1.BookingCancelledEvent]),
    __metadata("design:returntype", Promise)
], BookingRemindersListener.prototype, "handleBookingCancelled", null);
exports.BookingRemindersListener = BookingRemindersListener = BookingRemindersListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [reminders_service_1.RemindersService])
], BookingRemindersListener);
//# sourceMappingURL=booking-reminders.listener.js.map