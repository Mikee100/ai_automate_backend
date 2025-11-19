import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('answer')
  answerFaq(@Body() body: { question: string }) {
    return this.aiService.answerFaq(body.question);
  }

  @Post('knowledge')
  addKnowledge(@Body() body: { question: string; answer: string }) {
    return this.aiService.addKnowledge(body.question, body.answer);
  }
}
