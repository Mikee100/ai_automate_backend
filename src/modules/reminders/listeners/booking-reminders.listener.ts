import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RemindersService } from '../reminders.service';
import {
    BookingCreatedEvent,
    BookingRescheduledEvent,
    BookingCancelledEvent
} from '../../bookings/events/booking.events';

@Injectable()
export class BookingRemindersListener {
    private readonly logger = new Logger(BookingRemindersListener.name);

    constructor(private remindersService: RemindersService) { }

    @OnEvent('booking.created')
    async handleBookingCreated(event: BookingCreatedEvent) {
        // this.logger.log(`Scheduling reminders for new booking ${event.bookingId}`);
        try {
            await this.remindersService.scheduleRemindersForBooking(event.bookingId);
        } catch (error) {
            this.logger.error(`Failed to schedule reminders for booking ${event.bookingId}`, error);
        }
    }

    @OnEvent('booking.rescheduled')
    async handleBookingRescheduled(event: BookingRescheduledEvent) {
        // this.logger.log(`Rescheduling reminders for booking ${event.bookingId}`);
        try {
            await this.remindersService.rescheduleRemindersForBooking(
                event.bookingId,
                event.newDateTime,
            );
        } catch (error) {
            this.logger.error(`Failed to reschedule reminders for booking ${event.bookingId}`, error);
        }
    }

    @OnEvent('booking.cancelled')
    async handleBookingCancelled(event: BookingCancelledEvent) {
        // this.logger.log(`Cancelling reminders for booking ${event.bookingId}`);
        try {
            await this.remindersService.cancelRemindersForBooking(event.bookingId);
        } catch (error) {
            this.logger.error(`Failed to cancel reminders for booking ${event.bookingId}`, error);
        }
    }
}
