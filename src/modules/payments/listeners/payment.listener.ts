import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { BookingDraftCompletedEvent } from '../../bookings/events/booking.events';
import { PaymentsService } from '../payments.service';
import { MessagesService } from '../../messages/messages.service';

@Injectable()
export class PaymentListener {
    private readonly logger = new Logger(PaymentListener.name);

    constructor(
        private paymentsService: PaymentsService,
        private messagesService: MessagesService,
    ) { }

    @OnEvent('booking.draft.completed')
    async handleBookingDraftCompleted(event: BookingDraftCompletedEvent) {
        this.logger.log(`[Event] BookingDraftCompleted: customerId=${event.customerId}, draftId=${event.draftId}`);

        try {
            // Format phone if needed
            let phone = event.recipientPhone;
            if (!phone.startsWith('254')) {
                phone = `254${phone.replace(/^0+/, '')}`;
            }

            // ENHANCEMENT: Send pre-payment notification
            const prepaymentMsg = `⏱️ *Get Ready!*\n\nYou'll receive an M-Pesa payment prompt on your phone in the next 3 seconds for *KSH ${event.depositAmount}*.\n\nPlease have your M-Pesa PIN ready! 📲✨`;

            try {
                await this.messagesService.sendOutboundMessage(
                    event.customerId,
                    prepaymentMsg,
                    'whatsapp'
                );
                this.logger.log(`[Event] Pre-payment notification sent to ${event.customerId}`);

                // Small delay to ensure message is delivered before STK push
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (msgError) {
                this.logger.warn(`[Event] Failed to send pre-payment notification, continuing with STK push:`, msgError);
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
