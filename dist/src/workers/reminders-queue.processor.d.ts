import { Job } from 'bull';
import { RemindersService } from '../modules/reminders/reminders.service';
export declare class RemindersQueueProcessor {
    private remindersService;
    private readonly logger;
    constructor(remindersService: RemindersService);
    handleSendReminder(job: Job<{
        reminderId: string;
    }>): Promise<void>;
}
