import { BookingDraftCompletedEvent } from '../../bookings/events/booking.events';
import { PaymentsService } from '../payments.service';
import { MessagesService } from '../../messages/messages.service';
export declare class PaymentListener {
    private paymentsService;
    private messagesService;
    private readonly logger;
    constructor(paymentsService: PaymentsService, messagesService: MessagesService);
    handleBookingDraftCompleted(event: BookingDraftCompletedEvent): Promise<void>;
}
