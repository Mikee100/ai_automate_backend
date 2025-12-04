import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { RemindersService } from '../modules/reminders/reminders.service';

@Processor('remindersQueue')
export class RemindersQueueProcessor {
    private readonly logger = new Logger(RemindersQueueProcessor.name);

    constructor(private remindersService: RemindersService) { }

    @Process('send-reminder')
    async handleSendReminder(job: Job) {
        const { reminderId } = job.data;
        this.logger.log(`Processing reminder ${reminderId}`);

        try {
            await this.remindersService.sendReminder(reminderId);
            this.logger.log(`Successfully sent reminder ${reminderId}`);
        } catch (error) {
            this.logger.error(`Failed to send reminder ${reminderId}`, error);
            throw error; // Bull will retry based on configuration
        }
    }
}
