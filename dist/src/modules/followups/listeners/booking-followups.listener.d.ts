import { FollowupsService } from '../followups.service';
import { BookingCancelledEvent } from '../../bookings/events/booking.events';
export declare class BookingCompletedEvent {
    readonly bookingId: string;
    readonly customerId: string;
    readonly service: string;
    readonly completedAt: Date;
    constructor(bookingId: string, customerId: string, service: string, completedAt: Date);
}
export declare class BookingFollowupsListener {
    private followupsService;
    private readonly logger;
    constructor(followupsService: FollowupsService);
    handleBookingCompleted(event: BookingCompletedEvent): Promise<void>;
    handleBookingCancelled(event: BookingCancelledEvent): Promise<void>;
}
