export declare class CreateFollowupDto {
    bookingId: string;
    type: 'delivery' | 'review_request' | 'upsell';
    scheduledFor: string;
    metadata?: any;
    messageContent?: string;
}
export declare class UpdateFollowupDto {
    scheduledFor?: string;
    status?: 'pending' | 'sent' | 'failed' | 'cancelled';
    metadata?: any;
    messageContent?: string;
}
export declare class FollowupFilterDto {
    bookingId?: string;
    type?: 'delivery' | 'review_request' | 'upsell';
    status?: 'pending' | 'sent' | 'failed' | 'cancelled';
    limit?: string;
    offset?: string;
}
export declare class RecordFollowupResponseDto {
    rating?: string;
    feedback?: string;
    upsellInterest?: string;
}
