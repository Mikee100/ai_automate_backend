import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../modules/ai/ai.service';
import { MessengerSendService } from '../modules/webhooks/messenger-send.service';
import { MessagesService } from '../modules/messages/messages.service';

@Processor('aiQueue')
@Injectable()
export class AiQueueProcessor {
  private readonly logger = new Logger(AiQueueProcessor.name);

  constructor(
    private readonly aiService: AiService,
    private readonly messengerSendService: MessengerSendService,
    private readonly messagesService: MessagesService,
  ) {}

  @Process()
  async handleMessengerAiJob(job: Job) {
    const { customerId, message, platform } = job.data;
    this.logger.log(`Processing AI job for Messenger: customerId=${customerId}, message=${message}`);

    if (platform !== 'messenger') {
      this.logger.warn('Job platform is not messenger, skipping.');
      return;
    }

    // Get conversation history for context
    const history = await this.messagesService.getConversationHistory(customerId, 10);

    // Generate AI response
    const aiResult = await this.aiService.handleConversation(message, customerId, history);
    const aiResponse = aiResult?.response || "Sorry, I couldn't process your request.";

    // Find Messenger ID for customer
    const customer = await this.messagesService.getCustomerById(customerId);
    if (!customer?.messengerId) {
      this.logger.error('Customer does not have a Messenger ID, cannot send response.');
      return;
    }

    // Send response via Messenger
    await this.messengerSendService.sendMessage(customer.messengerId, aiResponse);
    this.logger.log('AI response sent to Messenger.');
  }
}
