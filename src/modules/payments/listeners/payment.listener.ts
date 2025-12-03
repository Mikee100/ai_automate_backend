import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { BookingDraftCompletedEvent } from '../../bookings/events/booking.events';
import { PaymentsService } from '../payments.service';

@Injectable()
export class PaymentListener {
    private readonly logger = new Logger(PaymentListener.name);

    constructor(private paymentsService: PaymentsService) { }

    @OnEvent('booking.draft.completed')
    async handleBookingDraftCompleted(event: BookingDraftCompletedEvent) {
        this.logger.log(`[Event] BookingDraftCompleted: customerId=${event.customerId}, draftId=${event.draftId}`);

        try {
            // Format phone if needed
            let phone = event.recipientPhone;
            if (!phone.startsWith('254')) {
                phone = `254${phone.replace(/^0+/, '')}`;
            }

            // Initiate STK Push
            await this.paymentsService.initiateSTKPush(
                event.draftId,
                phone,
                event.depositAmount,
            );

            this.logger.log(`[Event] STK Push initiated for deposit of ${event.depositAmount} KSH for draft ${event.draftId}`);
        } catch (error) {
            this.logger.error(`[Event] Failed to initiate STK Push for draft ${event.draftId}`, error);
        }
    }
}
