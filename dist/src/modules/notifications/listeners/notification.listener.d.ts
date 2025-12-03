import { BookingCreatedEvent, BookingRescheduledEvent, BookingCancelledEvent } from '../../bookings/events/booking.events';
import { NotificationsService } from '../notifications.service';
export declare class NotificationListener {
    private notificationsService;
    private readonly logger;
    constructor(notificationsService: NotificationsService);
    handleBookingCreated(event: BookingCreatedEvent): Promise<void>;
    handleBookingRescheduled(event: BookingRescheduledEvent): Promise<void>;
    handleBookingCancelled(event: BookingCancelledEvent): Promise<void>;
}
