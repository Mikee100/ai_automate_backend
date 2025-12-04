import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { FollowupsService } from '../modules/followups/followups.service';

@Processor('followupsQueue')
export class FollowupsQueueProcessor {
    private readonly logger = new Logger(FollowupsQueueProcessor.name);

    constructor(private followupsService: FollowupsService) { }

    @Process('send-followup')
    async handleSendFollowup(job: Job) {
        const { followupId } = job.data;
        this.logger.log(`Processing follow-up ${followupId}`);

        try {
            await this.followupsService.sendFollowup(followupId);
            this.logger.log(`Successfully sent follow-up ${followupId}`);
        } catch (error) {
            this.logger.error(`Failed to send follow-up ${followupId}`, error);
            throw error; // Bull will retry based on configuration
        }
    }
}
