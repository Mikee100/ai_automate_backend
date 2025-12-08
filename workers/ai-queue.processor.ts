
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
    this.logger.log(`Processing job id=${job.id} with data: ${JSON.stringify(job.data)}`);
    try {
      const { question } = job.data;
      if (!question) {
        this.logger.warn(`Job id=${job.id} missing 'question' field. Data: ${JSON.stringify(job.data)}`);
        throw new Error("Job data missing 'question' field");
      }
      const answer = await this.aiService.processAiRequest(job.data);
      this.logger.log(`Job id=${job.id} processed successfully. Answer: ${JSON.stringify(answer)}`);
      return { answer };
    } catch (error) {
      this.logger.error(`Error processing job id=${job.id}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
