import { Processor, Process } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { MessagesService } from '../src/modules/messages/messages.service';
import { AiService } from '../src/modules/ai/ai.service';
import { BookingsService } from '../src/modules/bookings/bookings.service';
import { WhatsappService } from '../src/modules/whatsapp/whatsapp.service';
import { InstagramService } from '../src/modules/instagram/instagram.service';
import { CustomersService } from '../src/modules/customers/customers.service';
import { WebsocketGateway } from '../src/websockets/websocket.gateway';
import * as chrono from 'chrono-node';
import { normalizeExtractedDateTime } from '../src/utils/booking';

@Injectable()
@Processor('messageQueue')
export class MessageQueueProcessor {
  constructor(
    private messagesService: MessagesService,
    private aiService: AiService,
    private bookingsService: BookingsService,
    private whatsappService: WhatsappService,
    private customersService: CustomersService,
    private instagramService: InstagramService,
    private websocketGateway: WebsocketGateway,
  ) {
  }

  @Process('processMessage')
  async process(job: Job<any>): Promise<any> {
    let customerId: string;
    let messageContent: string;
    let platform: string;
    let from: string;

    if (job.data.messageId) {
      const message = await this.messagesService.findOne(job.data.messageId);
      if (!message) {
        return { processed: false, error: 'Message not found' };
      }
      customerId = message.customerId;
      messageContent = message.content;
      platform = message.platform;
      from = (message.customer as any).whatsappId || (message.customer as any).instagramId || (message.customer as any).phone;
    } else {
      ({ customerId, message: messageContent, platform, from } = job.data);
    }

    // Fetch conversation history (last 10 messages for context)
    const historyMessages = await this.messagesService.findByCustomer(customerId);
    const history = historyMessages
      .filter(m => m.direction === 'inbound' || m.direction === 'outbound')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(-10) // Last 10 messages
      .map(m => ({
        role: m.direction === 'inbound' ? 'user' as const : 'assistant' as const,
        content: m.content
      }))
      .filter((msg, index, arr) => {
        // Remove duplicates: if current message is similar to previous, skip
        if (index > 0) {
          const prev = arr[index - 1];
          if (msg.content.includes('Hey there! 😊') && prev.content.includes('Hey there! 😊')) return false;
          if (msg.content.includes('Hello! Thank you for your message.') && prev.content.includes('Hello! Thank you for your message.')) return false;
        }
        return true;
      });

    let response = '';

    try {
        // Single extraction call with chrono pre-parsing for better date handling
        let extracted: any = null;
        try {
          // Pre-parse dates with chrono for better extraction
          const parsedDates = chrono.parse(messageContent);
          const dateHints = parsedDates.map(p => p.text).join(' ');
          const enhancedMessage = dateHints ? `${messageContent} (parsed dates: ${dateHints})` : messageContent;

          extracted = await this.aiService.extractBookingDetails(enhancedMessage, history);
        } catch (e) {
          console.warn('AI extraction failed, falling back to keyword intent');
        }

        // Determine intent with fallback
        let intent = 'general';
        if (extracted?.intent && extracted.intent !== 'unknown') {
          intent = extracted.intent;
        } else {
          const lower = messageContent.toLowerCase();
          if (lower.includes('book') || lower.includes('appointment') || lower.includes('booked')) intent = 'booking_details';
          else if (lower.includes('price') || lower.includes('cost') || lower.includes('how much')) intent = 'faq';
        }

      if (intent === 'booking_details' || intent === 'book' || intent === 'provide-info' || intent === 'confirm' || intent === 'cancel') {
        console.log('LOG: Processing booking-related intent:', intent);

        // Get or create draft
        let draft = await this.bookingsService.getBookingDraft(customerId);
        if (!draft) {
          draft = await this.bookingsService.createBookingDraft(customerId);
        }

        // Merge extracted details into draft
        const updates: any = {};
        if (extracted?.service) updates.service = extracted.service;
        if (extracted?.name) updates.name = extracted.name;

        // Handle date/time with normalization
        if (extracted?.date || extracted?.time) {
          const normalized = normalizeExtractedDateTime({ date: extracted.date, time: extracted.time });
          if (normalized.dateObj) {
            updates.date = normalized.dateOnly;
            updates.time = normalized.timeOnly;
          } else {
            updates.date = extracted.date ?? null;
            updates.time = extracted.time ?? null;
          }
        }

        // Apply updates if any
        if (Object.keys(updates).length > 0) {
          draft = await this.bookingsService.updateBookingDraft(customerId, updates);
        }

        // Determine booking result for AI response generation
        let bookingResult = null;
        if (extracted?.intent === 'cancel') {
          await this.bookingsService.deleteBookingDraft(customerId);
          bookingResult = { action: 'cancelled' };
        } else if (extracted?.intent === 'confirm' && draft.service && draft.date && draft.time && draft.name) {
          // Check availability before confirming
          const dateTime = new Date(`${draft.date}T${draft.time}`);
          const availability = await this.bookingsService.checkAvailability(dateTime, draft.service);
          if (!availability.available) {
            bookingResult = { action: 'error', error: 'Time slot not available' };
          } else {
            try {
              const booking = await this.bookingsService.completeBookingDraft(customerId);
              bookingResult = { action: 'confirmed', booking };
            } catch (error) {
              bookingResult = { action: 'error', error: error.message };
            }
          }
        } else {
          bookingResult = { action: 'in_progress', draft };
        }

        // Generate natural response using AI
        response = await this.aiService.generateStepBasedBookingResponse(messageContent, customerId, this.bookingsService, history, draft, bookingResult);

        // Add response to history for future context
        history.push({ role: 'assistant', content: response });

      } else if (intent === 'faq') {
        response = await this.aiService.answerFaq(messageContent, history);
      } else {
        response = await this.aiService.generateGeneralResponse(messageContent, customerId, this.bookingsService, history);
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      response = 'Hello! Thank you for your message. How can I help you today?';
    }

    // Send response back via appropriate platform
    if (platform === 'whatsapp' && from) {
      try {
        await this.whatsappService.sendMessage(from, response);
      } catch (sendError) {
        console.error('Error sending WhatsApp message:', sendError);
        return { processed: false, error: 'Failed to send WhatsApp message' };
      }

      try {
        const outboundMessage = await this.messagesService.create({
          content: response,
          platform: 'whatsapp',
          direction: 'outbound',
          customerId,
        });

        // Emit real-time update via WebSocket
        this.websocketGateway.emitNewMessage('whatsapp', {
          id: outboundMessage.id,
          from: '',
          to: from,
          content: response,
          timestamp: outboundMessage.createdAt.toISOString(),
          direction: 'outbound',
          customerId,
          customerName: (await this.customersService.findOne(customerId))?.name,
        });
      } catch (createError) {
        console.error('Error creating outbound message record:', createError);
      }
    } else if (platform === 'instagram' && from) {
      try {
        await this.instagramService.sendMessage(from, response);
      } catch (sendError) {
        console.error('Error sending Instagram message:', sendError);
        return { processed: false, error: 'Failed to send Instagram message' };
      }

      try {
        const outboundMessage = await this.messagesService.create({
          content: response,
          platform: 'instagram',
          direction: 'outbound',
          customerId,
        });

        // Emit real-time update via WebSocket
        this.websocketGateway.emitNewMessage('instagram', {
          id: outboundMessage.id,
          from: '',
          to: from,
          content: response,
          timestamp: outboundMessage.createdAt.toISOString(),
          direction: 'outbound',
          customerId,
          customerName: (await this.customersService.findOne(customerId))?.name,
        });
      } catch (createError) {
        console.error('Error creating outbound message record:', createError);
      }
    }

    return { processed: true };
  }
}
