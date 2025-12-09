
import { Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { AiService } from '../src/modules/ai/ai.service';

@Injectable()
@Processor('aiQueue')
export class AiQueueProcessor {
  private readonly logger = new Logger(AiQueueProcessor.name);

  constructor(private aiService: AiService) {}

  async process(job: Job<any>): Promise<any> {
    this.logger.log(`[AI QUEUE] Received job id=${job.id} with data: ${JSON.stringify(job.data)}`);
    try {
      const { message, customerId, platform } = job.data;
      this.logger.log(`[AI QUEUE] Extracted fields - message: ${message}, customerId: ${customerId}, platform: ${platform}`);
      if (!message) {
        this.logger.warn(`[AI QUEUE] Job id=${job.id} missing 'message' field. Data: ${JSON.stringify(job.data)}`);
        throw new Error("Job data missing 'message' field");
      }
      this.logger.log(`[AI QUEUE] Calling aiService.processAiRequest for job id=${job.id}`);
      const answer = await this.aiService.processAiRequest(job.data);
      this.logger.log(`[AI QUEUE] Job id=${job.id} processed successfully. Answer: ${JSON.stringify(answer)}`);
      return { answer };
    } catch (error) {
      this.logger.error(`[AI QUEUE] Error processing job id=${job.id}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
