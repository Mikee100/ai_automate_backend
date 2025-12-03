import { BookingDraftCompletedEvent } from '../../bookings/events/booking.events';
import { PaymentsService } from '../payments.service';
export declare class PaymentListener {
    private paymentsService;
    private readonly logger;
    constructor(paymentsService: PaymentsService);
    handleBookingDraftCompleted(event: BookingDraftCompletedEvent): Promise<void>;
}
