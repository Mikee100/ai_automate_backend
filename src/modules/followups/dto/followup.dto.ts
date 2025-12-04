import { IsString, IsDateString, IsOptional, IsIn, IsObject } from 'class-validator';

export class CreateFollowupDto {
    @IsString()
    bookingId: string;

    @IsString()
    @IsIn(['delivery', 'review_request', 'upsell'])
    type: 'delivery' | 'review_request' | 'upsell';

    @IsDateString()
    scheduledFor: string;

    @IsOptional()
    @IsObject()
    metadata?: any;

    @IsOptional()
    @IsString()
    messageContent?: string;
}

export class UpdateFollowupDto {
    @IsOptional()
    @IsDateString()
    scheduledFor?: string;

    @IsOptional()
    @IsString()
    @IsIn(['pending', 'sent', 'failed', 'cancelled'])
    status?: 'pending' | 'sent' | 'failed' | 'cancelled';

    @IsOptional()
    @IsObject()
    metadata?: any;

    @IsOptional()
    @IsString()
    messageContent?: string;
}

export class FollowupFilterDto {
    @IsOptional()
    @IsString()
    bookingId?: string;

    @IsOptional()
    @IsString()
    @IsIn(['delivery', 'review_request', 'upsell'])
    type?: 'delivery' | 'review_request' | 'upsell';

    @IsOptional()
    @IsString()
    @IsIn(['pending', 'sent', 'failed', 'cancelled'])
    status?: 'pending' | 'sent' | 'failed' | 'cancelled';

    @IsOptional()
    @IsString()
    limit?: string;

    @IsOptional()
    @IsString()
    offset?: string;
}

export class RecordFollowupResponseDto {
    @IsOptional()
    @IsString()
    rating?: string; // For review requests: 1-5

    @IsOptional()
    @IsString()
    feedback?: string; // Customer feedback text

    @IsOptional()
    @IsString()
    upsellInterest?: string; // For upsell: 'interested', 'not_interested', 'maybe'
}
