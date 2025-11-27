import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';
import { BookingsService } from '../bookings/bookings.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly bookingsService: BookingsService,
  ) {}

  @Post('answer')
  answerFaq(@Body() body: { question: string }) {
    return this.aiService.answerFaq(body.question);
  }

  @Post('knowledge')
  addKnowledge(@Body() body: { question: string; answer: string }) {
    return this.aiService.addKnowledge(body.question, body.answer);
  }

  @Post('conversation')
  async handleConversation(@Body() body: { message: string; customerId: string; history?: { role: 'user' | 'assistant'; content: string }[] }) {
    const { message, customerId, history = [] } = body;
    return this.aiService.handleConversation(message, customerId, history, this.bookingsService);
  }
}
