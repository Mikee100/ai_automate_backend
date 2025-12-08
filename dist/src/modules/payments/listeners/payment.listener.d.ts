import { BookingDraftCompletedEvent } from '../../bookings/events/booking.events';
import { PaymentsService } from '../payments.service';
import { MessagesService } from '../../messages/messages.service';
import { PrismaService } from '../../../prisma/prisma.service';
export declare class PaymentListener {
    private paymentsService;
    private messagesService;
    private prisma;
    private readonly logger;
    constructor(paymentsService: PaymentsService, messagesService: MessagesService, prisma: PrismaService);
    handleBookingDraftCompleted(event: BookingDraftCompletedEvent): Promise<void>;
}
