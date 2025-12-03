"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingCancelledEvent = exports.BookingRescheduledEvent = exports.BookingCreatedEvent = exports.BookingDraftCompletedEvent = void 0;
class BookingDraftCompletedEvent {
    constructor(customerId, draftId, service, dateTime, recipientPhone, depositAmount) {
        this.customerId = customerId;
        this.draftId = draftId;
        this.service = service;
        this.dateTime = dateTime;
        this.recipientPhone = recipientPhone;
        this.depositAmount = depositAmount;
    }
}
exports.BookingDraftCompletedEvent = BookingDraftCompletedEvent;
class BookingCreatedEvent {
    constructor(bookingId, customerId, service, dateTime, customerName) {
        this.bookingId = bookingId;
        this.customerId = customerId;
        this.service = service;
        this.dateTime = dateTime;
        this.customerName = customerName;
    }
}
exports.BookingCreatedEvent = BookingCreatedEvent;
class BookingRescheduledEvent {
    constructor(bookingId, customerId, service, oldDateTime, newDateTime, customerName) {
        this.bookingId = bookingId;
        this.customerId = customerId;
        this.service = service;
        this.oldDateTime = oldDateTime;
        this.newDateTime = newDateTime;
        this.customerName = customerName;
    }
}
exports.BookingRescheduledEvent = BookingRescheduledEvent;
class BookingCancelledEvent {
    constructor(bookingId, customerId, service, dateTime) {
        this.bookingId = bookingId;
        this.customerId = customerId;
        this.service = service;
        this.dateTime = dateTime;
    }
}
exports.BookingCancelledEvent = BookingCancelledEvent;
//# sourceMappingURL=booking.events.js.map