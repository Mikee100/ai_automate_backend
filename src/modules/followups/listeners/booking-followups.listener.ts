import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { FollowupsService } from '../followups.service';
import { BookingCancelledEvent } from '../../bookings/events/booking.events';

// New event for booking completion
export class BookingCompletedEvent {
    constructor(
        public readonly bookingId: string,
        public readonly customerId: string,
        public readonly service: string,
        public readonly completedAt: Date,
    ) { }
}

@Injectable()
export class BookingFollowupsListener {
    private readonly logger = new Logger(BookingFollowupsListener.name);

    constructor(private followupsService: FollowupsService) { }

    @OnEvent('booking.completed')
    async handleBookingCompleted(event: BookingCompletedEvent) {
        // this.logger.log(`Scheduling follow-ups for completed booking ${event.bookingId}`);
        try {
            await this.followupsService.scheduleFollowupsForBooking(event.bookingId);
        } catch (error) {
            this.logger.error(`Failed to schedule follow-ups for booking ${event.bookingId}`, error);
        }
    }

    @OnEvent('booking.cancelled')
    async handleBookingCancelled(event: BookingCancelledEvent) {
        // this.logger.log(`Cancelling follow-ups for booking ${event.bookingId}`);
        try {
            await this.followupsService.cancelFollowupsForBooking(event.bookingId);
        } catch (error) {
            this.logger.error(`Failed to cancel follow-ups for booking ${event.bookingId}`, error);
        }
    }
}
