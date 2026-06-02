import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { BookingDraftCompletedEvent } from '../../bookings/events/booking.events';
import { PaymentsService } from '../payments.service';
import { MessagesService } from '../../messages/messages.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PaymentListener {
    private readonly logger = new Logger(PaymentListener.name);

    constructor(
        private paymentsService: PaymentsService,
        private messagesService: MessagesService,
        private prisma: PrismaService,
    ) { }

    @OnEvent('booking.draft.completed')
    async handleBookingDraftCompleted(event: BookingDraftCompletedEvent) {
        this.logger.error(`[DEBUG-TRACE] ⚡ BookingDraftCompleted event received: customerId=${event.customerId}`);
        this.logger.log(`[Event] ⚡ BookingDraftCompleted event received: customerId=${event.customerId}, draftId=${event.draftId}, amount=${event.depositAmount}`);
        // Payment logic is paused. No STK push or pre-payment notification will be sent.
    }
}
