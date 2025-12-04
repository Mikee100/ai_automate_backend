import { Job } from 'bull';
import { FollowupsService } from '../modules/followups/followups.service';
export declare class FollowupsQueueProcessor {
    private followupsService;
    private readonly logger;
    constructor(followupsService: FollowupsService);
    handleSendFollowup(job: Job): Promise<void>;
}
