import { Processor, Process, InjectQueue, OnQueueError, OnQueueFailed, OnQueueResumed } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AiService } from '../modules/ai/ai.service';
import { MessengerSendService } from '../modules/webhooks/messenger-send.service';
import { WhatsappService } from '../modules/whatsapp/whatsapp.service';
import { InstagramService } from '../modules/instagram/instagram.service';
import { MessagesService } from '../modules/messages/messages.service';
import { CustomersService } from '../modules/customers/customers.service';
import { BookingsService } from '../modules/bookings/bookings.service';
import { WebsocketGateway } from '../websockets/websocket.gateway';
import { PrismaService } from '../prisma/prisma.service';

@Processor('aiQueue')
@Injectable()
export class AiQueueProcessor implements OnModuleInit {
  private readonly logger = new Logger(AiQueueProcessor.name);

  constructor(
    @InjectQueue('aiQueue') private readonly aiQueue: Queue,
    private readonly aiService: AiService,
    private readonly messengerSendService: MessengerSendService,
    private readonly whatsappService: WhatsappService,
    private readonly instagramService: InstagramService,
    private readonly messagesService: MessagesService,
    private readonly customersService: CustomersService,
    private readonly bookingsService: BookingsService,
    private readonly websocketGateway: WebsocketGateway,
    private readonly prisma: PrismaService,
  ) {
    this.logger.log('[AI QUEUE] Constructor called - AiQueueProcessor being created');
  }

  onModuleInit() {
    this.logger.log('[AI QUEUE] OnModuleInit called - AiQueueProcessor initialized and ready to process jobs');
    this.logger.log('[AI QUEUE] Listening for jobs on queue: aiQueue');

    // Heartbeat to confirm it's alive periodically (every 1 min)
    setInterval(() => {
      this.logger.debug('[AI QUEUE] Worker heartbeat - active and listening');
    }, 60000);
  }

  @OnQueueError()
  onError(error: Error) {
    this.logger.error('[AI QUEUE] Queue Error', error);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`[AI QUEUE] Job ${job.id} failed`, error);
  }

  @OnQueueResumed()
  onResumed() {
    this.logger.log('[AI QUEUE] Queue resumed');
  }

  @Process('sendReminder')
  async handleSendReminder(job: Job) {
    const { customerId, bookingId, date, time, recipientName, daysBefore } = job.data || {};
    if (!customerId) {
      this.logger.warn('[AI QUEUE] sendReminder job missing customerId');
      return;
    }
    const dayText =
      daysBefore === '2' ? 'in *2 days*' : daysBefore === '1' ? 'tomorrow' : 'soon';
    const reminderMessage =
      `Hi ${recipientName || 'there'}! 💖\n\n` +
      `Just a sweet reminder that your maternity photoshoot ` +
      `is coming up ${dayText} — on *${date || 'your booking'} at ${time || 'the scheduled time'}*. ` +
      `We're excited to capture your beautiful moments! ✨📸`;
    await this.messagesService.sendOutboundMessage(customerId, reminderMessage, 'whatsapp');
    const customer = await this.customersService.findOne(customerId);
    const phone = customer?.whatsappId || customer?.phone;
    if (phone) {
      await this.whatsappService.sendMessage(phone, reminderMessage);
      this.logger.log(`[AI QUEUE] sendReminder sent for customer ${customerId}`);
    } else {
      this.logger.warn(`[AI QUEUE] sendReminder: no WhatsApp/phone for customer ${customerId}`);
    }
    return { sent: !!phone };
  }

  @Process('handleAiJob')
  async handleAiJob(job: Job) {
    try {
      this.logger.log(`[AI QUEUE] ===== JOB RECEIVED =====`);
      this.logger.log(`[AI QUEUE] Job ID: ${job.id}`);
      this.logger.log(`[AI QUEUE] Job Name: ${job.name}`);
      this.logger.log(`[AI QUEUE] Job Data: ${JSON.stringify(job.data)}`);

      if (!job.data) {
        const errorMsg = 'Job data is missing';
        this.logger.error(`[AI QUEUE] ${errorMsg}`);
        throw new Error(errorMsg);
      }

      const { customerId, message, platform } = job.data;
      this.logger.log(`[AI QUEUE] Processing centralized AI job: customerId=${customerId}, platform=${platform}, message=${message}, jobId=${job.id}`);

      const jobStartedAt = Date.now();
      let queueWaitingCount: number | null = null;
      try {
        const counts = await this.aiQueue.getJobCounts();
        queueWaitingCount = counts.waiting ?? null;
      } catch {
        // ignore
      }

      let aiResponse = "Sorry, I couldn't process your request.";
      let aiResult: any = null;
      let aiSuccess = false;
      let aiFailureReason: string | undefined;

      try {
        // Get conversation history for context
        const history = await this.messagesService.getConversationHistory(customerId, 10);

        // Generate AI response with timeout (pass platform for humanizer)
        const enrichedContext = { platform };
        const aiPromise = this.aiService.handleConversation(message, customerId, history, this.bookingsService, 0, enrichedContext);

        aiPromise.catch((err) => {
          this.logger.debug(`[AI QUEUE] AI promise rejected (may be after timeout): ${err.message}`);
        });

        let timeoutId: NodeJS.Timeout;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('AI processing timeout forced after 30s')), 30000);
        });

        this.logger.log(`[AI QUEUE] Awaiting AI response for job ${job.id}...`);
        aiResult = await Promise.race([aiPromise, timeoutPromise]);
        clearTimeout(timeoutId);
        this.logger.log(`[AI QUEUE] AI response received for job ${job.id}.`);
        aiSuccess = true;

        if (aiResult?.response) {
          if (typeof aiResult.response === 'string') {
            aiResponse = aiResult.response;
          } else if (typeof aiResult.response === 'object' && aiResult.response !== null) {
            if ('text' in aiResult.response) {
              aiResponse = aiResult.response.text;
            } else {
              this.logger.warn(`AI result has unexpected object format: ${JSON.stringify(aiResult.response)}`);
              aiResponse = "Sorry, I couldn't process your request.";
            }
          } else {
            this.logger.warn(`AI result response is in unexpected format: ${typeof aiResult.response}`);
            aiResponse = "Sorry, I couldn't process your request.";
          }
        } else {
          this.logger.warn(`AI result has no response. Full result: ${JSON.stringify(aiResult)}`);
          aiResponse = "Sorry, I couldn't process your request.";
        }
      } catch (error) {
        this.logger.error('AI processing failed, using fallback response', error);
        this.logger.error('Error details:', error instanceof Error ? error.stack : error);
        aiSuccess = false;
        aiFailureReason = error instanceof Error ? (error.message?.includes('timeout') ? 'timeout' : error.message?.slice(0, 200) || 'exception') : 'exception';
      }

      // Record observability metric (Tier 1 + strategy + fallback + circuit breaker)
      const latencyMs = Date.now() - jobStartedAt;
      try {
        const m = aiResult?.metrics;
        await this.prisma.aiJobMetric.create({
          data: {
            customerId: customerId ?? undefined,
            platform: platform ?? undefined,
            latencyMs,
            success: aiSuccess,
            failureReason: aiSuccess ? undefined : aiFailureReason,
            strategyUsed: m?.strategyUsed ?? undefined,
            isFallback: m?.isFallback ?? false,
            circuitBreakerTrip: m?.circuitBreakerTrip ?? false,
            circuitBreakerReason: m?.circuitBreakerReason ?? undefined,
            queueWaitingCount: queueWaitingCount ?? undefined,
          },
        });
      } catch (metricErr) {
        this.logger.warn(`[AI QUEUE] Failed to record AiJobMetric: ${(metricErr as Error).message}`);
      }

      // Send response based on platform - wrap in try-catch to prevent job crashes
      try {
        this.logger.log(`[AI QUEUE] Attempting to send ${platform} response to customer ${customerId}...`);
        await this.sendResponseByPlatform(customerId, aiResponse, platform);
        this.logger.log(`[AI QUEUE] ✅ AI response sent to ${platform} successfully.`);
      } catch (error) {
        this.logger.error(`[AI QUEUE] ❌ Failed to send response to ${platform}`, error);
        this.logger.error('[AI QUEUE] Error details:', error instanceof Error ? error.stack : error);
        // Don't re-throw - job should complete even if sending fails
      }

      // Return a value so Bull knows the job completed successfully
      return { success: true, platform, customerId };
    } catch (outerError) {
      // Catch any errors that weren't caught in inner try-catch blocks
      this.logger.error('[AI QUEUE] CRITICAL ERROR in handleAiJob', outerError);
      throw outerError; // Re-throw so Bull marks the job as failed
    }
  }

  private async sendResponseByPlatform(customerId: string, response: string, platform: string) {
    const customer = await this.customersService.findOne(customerId);
    if (!customer) {
      this.logger.error('Customer not found, cannot send response');
      return;
    }

    try {
      // Create outbound message record
      const outboundMessage = await this.messagesService.create({
        content: response,
        platform: platform,
        direction: 'outbound',
        customerId,
      });

      // Send via appropriate platform service
      switch (platform) {
        case 'whatsapp':
          if (customer.whatsappId) {
            await this.whatsappService.sendMessage(customer.whatsappId, response);
          } else {
            this.logger.error('Customer does not have WhatsApp ID');
            return;
          }
          break;

        case 'instagram':
          if (customer.instagramId) {
            this.logger.log(`[AI QUEUE] Sending Instagram response to customer ${customerId} (instagramId: ${customer.instagramId})`);
            await this.instagramService.sendMessage(customer.instagramId, response);
            this.logger.log(`[AI QUEUE] Instagram response sent successfully`);
          } else {
            this.logger.error(`[AI QUEUE] Customer ${customerId} does not have Instagram ID - cannot send response`);
            return;
          }
          break;

        case 'messenger':
          if (customer.messengerId) {
            await this.messengerSendService.sendMessage(customer.messengerId, response);
          } else {
            this.logger.error('Customer does not have Messenger ID');
            return;
          }
          break;

        default:
          this.logger.warn(`Unknown platform: ${platform}, cannot send response`);
          return;
      }

      // Emit WebSocket update
      this.websocketGateway.emitNewMessage(platform, {
        id: outboundMessage.id,
        from: '',
        to: customer.whatsappId || customer.instagramId || customer.messengerId || '',
        content: response,
        timestamp: outboundMessage.createdAt.toISOString(),
        direction: 'outbound',
        customerId,
        customerName: customer.name,
      });

    } catch (error) {
      this.logger.error(`Error sending ${platform} response`, error);
    }
  }

}
