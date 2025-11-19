import { Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { AiService } from '../src/modules/ai/ai.service';

@Injectable()
@Processor('aiQueue')
export class AiQueueProcessor {
  constructor(private aiService: AiService) {}

  async process(job: Job<any>): Promise<any> {
    const { question } = job.data;
    const answer = await this.aiService.processAiRequest(job.data);
    return { answer };
  }
}
