import { Job } from 'bullmq';
import { AiService } from '../src/modules/ai/ai.service';
export declare class AiQueueProcessor {
    private aiService;
    constructor(aiService: AiService);
    process(job: Job<any>): Promise<any>;
}
