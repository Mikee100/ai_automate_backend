import { IsString, IsDateString, IsOptional, IsIn } from 'class-validator';

export class CreateReminderDto {
    @IsString()
    bookingId: string;

    @IsString()
    @IsIn(['48hr', '24hr', 'confirmation'])
    type: '48hr' | '24hr' | 'confirmation';

    @IsDateString()
    scheduledFor: string;

    @IsOptional()
    @IsString()
    messageContent?: string;
}

export class UpdateReminderDto {
    @IsOptional()
    @IsDateString()
    scheduledFor?: string;

    @IsOptional()
    @IsString()
    @IsIn(['pending', 'sent', 'failed', 'cancelled'])
    status?: 'pending' | 'sent' | 'failed' | 'cancelled';

    @IsOptional()
    @IsString()
    messageContent?: string;
}

export class ReminderFilterDto {
    @IsOptional()
    @IsString()
    bookingId?: string;

    @IsOptional()
    @IsString()
    @IsIn(['48hr', '24hr', 'confirmation'])
    type?: '48hr' | '24hr' | 'confirmation';

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
