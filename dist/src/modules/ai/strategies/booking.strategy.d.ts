import { ResponseStrategy } from './response-strategy.interface';
export declare class BookingStrategy implements ResponseStrategy {
    readonly priority = 10;
    canHandle(intent: string, context: any): boolean;
    generateResponse(message: string, context: any): Promise<any>;
    private readonly STUDIO_TIMEZONE;
    private readonly ACKNOWLEDGMENT_PATTERNS;
    private readonly RESEND_PAYMENT_PATTERNS;
    private handlePlatformRedirection;
    private isSimpleAcknowledgment;
    private handlePaymentLogic;
    private handleSlotSuggestions;
    private handleBookingCompletion;
}
