export declare class CreateReminderDto {
    bookingId: string;
    type: '48hr' | '24hr' | 'confirmation';
    scheduledFor: string;
    messageContent?: string;
}
export declare class UpdateReminderDto {
    scheduledFor?: string;
    status?: 'pending' | 'sent' | 'failed' | 'cancelled';
    messageContent?: string;
}
export declare class ReminderFilterDto {
    bookingId?: string;
    type?: '48hr' | '24hr' | 'confirmation';
    status?: 'pending' | 'sent' | 'failed' | 'cancelled';
    limit?: string;
    offset?: string;
}
