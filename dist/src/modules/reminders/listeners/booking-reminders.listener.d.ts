import { RemindersService } from '../reminders.service';
import { BookingCreatedEvent, BookingRescheduledEvent, BookingCancelledEvent } from '../../bookings/events/booking.events';
export declare class BookingRemindersListener {
    private remindersService;
    private readonly logger;
    constructor(remindersService: RemindersService);
    handleBookingCreated(event: BookingCreatedEvent): Promise<void>;
    handleBookingRescheduled(event: BookingRescheduledEvent): Promise<void>;
    handleBookingCancelled(event: BookingCancelledEvent): Promise<void>;
}
