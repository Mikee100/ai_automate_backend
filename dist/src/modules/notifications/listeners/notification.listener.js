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
var NotificationListener_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const booking_events_1 = require("../../bookings/events/booking.events");
const notifications_service_1 = require("../notifications.service");
const luxon_1 = require("luxon");
let NotificationListener = NotificationListener_1 = class NotificationListener {
    constructor(notificationsService) {
        this.notificationsService = notificationsService;
        this.logger = new common_1.Logger(NotificationListener_1.name);
    }
    async handleBookingCreated(event) {
        this.logger.log(`[Event] BookingCreated: bookingId=${event.bookingId}`);
        try {
            const formattedDateTime = luxon_1.DateTime.fromJSDate(event.dateTime)
                .setZone('Africa/Nairobi')
                .toFormat('LLL dd, yyyy h:mm a');
            await this.notificationsService.createNotification({
                type: 'booking',
                title: `New Booking - ${event.service}`,
                message: `${event.customerName || 'Customer'} booked ${event.service} for ${formattedDateTime}`,
                metadata: {
                    bookingId: event.bookingId,
                    customerId: event.customerId,
                    service: event.service,
                    dateTime: event.dateTime.toISOString(),
                },
            });
            this.logger.log(`[Event] Booking notification created for ${event.bookingId}`);
        }
        catch (error) {
            this.logger.error(`[Event] Failed to create booking notification for ${event.bookingId}`, error);
        }
    }
    async handleBookingRescheduled(event) {
        this.logger.log(`[Event] BookingRescheduled: bookingId=${event.bookingId}`);
        try {
            const oldDateTime = luxon_1.DateTime.fromJSDate(event.oldDateTime).setZone('Africa/Nairobi');
            const newDateTime = luxon_1.DateTime.fromJSDate(event.newDateTime).setZone('Africa/Nairobi');
            await this.notificationsService.createNotification({
                type: 'reschedule',
                title: `Booking Rescheduled - ${event.service}`,
                message: `${event.customerName || 'Customer'} rescheduled from ${oldDateTime.toFormat('LLL dd, yyyy h:mm a')} to ${newDateTime.toFormat('LLL dd, yyyy h:mm a')}`,
                metadata: {
                    bookingId: event.bookingId,
                    customerId: event.customerId,
                    customerName: event.customerName,
                    service: event.service,
                    oldDateTime: event.oldDateTime.toISOString(),
                    newDateTime: event.newDateTime.toISOString(),
                },
            });
            this.logger.log(`[Event] Reschedule notification created for ${event.bookingId}`);
        }
        catch (error) {
            this.logger.error(`[Event] Failed to create reschedule notification for ${event.bookingId}`, error);
        }
    }
    async handleBookingCancelled(event) {
        this.logger.log(`[Event] BookingCancelled: bookingId=${event.bookingId}`);
        try {
            const formattedDateTime = luxon_1.DateTime.fromJSDate(event.dateTime)
                .setZone('Africa/Nairobi')
                .toFormat('LLL dd, yyyy h:mm a');
            await this.notificationsService.createNotification({
                type: 'booking',
                title: `Booking Cancelled - ${event.service}`,
                message: `Booking for ${event.service} on ${formattedDateTime} was cancelled`,
                metadata: {
                    bookingId: event.bookingId,
                    customerId: event.customerId,
                    service: event.service,
                    dateTime: event.dateTime.toISOString(),
                },
            });
            this.logger.log(`[Event] Cancellation notification created for ${event.bookingId}`);
        }
        catch (error) {
            this.logger.error(`[Event] Failed to create cancellation notification for ${event.bookingId}`, error);
        }
    }
};
exports.NotificationListener = NotificationListener;
__decorate([
    (0, event_emitter_1.OnEvent)('booking.created'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [booking_events_1.BookingCreatedEvent]),
    __metadata("design:returntype", Promise)
], NotificationListener.prototype, "handleBookingCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)('booking.rescheduled'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [booking_events_1.BookingRescheduledEvent]),
    __metadata("design:returntype", Promise)
], NotificationListener.prototype, "handleBookingRescheduled", null);
__decorate([
    (0, event_emitter_1.OnEvent)('booking.cancelled'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [booking_events_1.BookingCancelledEvent]),
    __metadata("design:returntype", Promise)
], NotificationListener.prototype, "handleBookingCancelled", null);
exports.NotificationListener = NotificationListener = NotificationListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], NotificationListener);
//# sourceMappingURL=notification.listener.js.map