import { Injectable } from '@nestjs/common';
import { MessagesService } from '../messages/messages.service';
import { CustomersService } from '../customers/customers.service';
import { AiService } from '../ai/ai.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { WebsocketGateway } from '../../websockets/websocket.gateway';

@Injectable()
export class WebhooksService {
  constructor(
    private messagesService: MessagesService,
    private customersService: CustomersService,
    private aiService: AiService,
    @InjectQueue('messageQueue') private messageQueue: Queue,
    private websocketGateway: WebsocketGateway,
  ) {}

  async handleWhatsAppWebhook(body: any) {
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            await this.processWhatsAppMessage(change.value);
          }
        }
      }
    }
    return { status: 'ok' };
  }

  async processWhatsAppMessage(value: any) {

    // Only process if this is a messages notification (not status update)
    if (!value.messages || value.messages.length === 0) {
      console.log('No messages in webhook payload - ignoring');
      return;
    }

    const message = value.messages[0];
    console.log('Message type:', message.type, 'ID:', message.id);

    if (message.type === 'text') {
      const from = message.from;
      const text = message.text.body;
      const messageId = message.id;

      console.log('Received text message from', from, ':', text);

      // Check if message already exists to prevent duplicates
      const existingMessage = await this.messagesService.findByExternalId(messageId);
      if (existingMessage) {
        console.log('Message already processed, skipping duplicate');
        return;
      }

      // Find or create customer
      let customer = await this.customersService.findByWhatsappId(from);
      if (!customer) {
        console.log('Creating new customer for WhatsApp ID:', from);
        customer = await this.customersService.create({
          name: `WhatsApp User ${from}`,
          email: `${from}@whatsapp.local`,
          phone: from,
          whatsappId: from,
        });
      }

      console.log('Customer found/created:', customer.id);

      // Create inbound message with external ID to prevent duplicates
      const createdMessage = await this.messagesService.create({
        content: text,
        platform: 'whatsapp',
        direction: 'inbound',
        customerId: customer.id,
        externalId: messageId, // Add this field to schema if needed
      });

      console.log('Message created in database:', createdMessage.id);

      // Emit real-time update via WebSocket for inbound message
      this.websocketGateway.emitNewMessage('whatsapp', {
        id: createdMessage.id,
        from: from,
        to: '',
        content: text,
        timestamp: createdMessage.createdAt.toISOString(),
        direction: 'inbound',
        customerId: customer.id,
        customerName: customer.name,
      });

      // Queue the message for AI processing
      console.log('Adding message to queue for processing...');
      await this.messageQueue.add('processMessage', {
        messageId: createdMessage.id,
      });
      console.log('Message added to queue successfully');
    }
  }

  async handleInstagramWebhook(data: any) {
    console.log('Processing Instagram webhook:', JSON.stringify(data, null, 2));

    if (!data.entry || data.entry.length === 0) {
      console.log('No entry in Instagram webhook payload');
      return; // No entries to process
    }

    const entry = data.entry[0];
    if (!entry.messaging || entry.messaging.length === 0) {
      console.log('No messaging in Instagram webhook entry');
      return; // No messages to process
    }

    const message = entry.messaging[0];
    console.log('Instagram message type:', message.message?.text ? 'text' : 'other');

    if (message.message?.text) {
      const from = message.sender.id;
      const text = message.message.text;
      console.log('Received Instagram text message from', from, ':', text);

      // Find or create customer
      let customer = await this.customersService.findByInstagramId(from);
      if (!customer) {
        console.log('Creating new customer for Instagram ID:', from);
        customer = await this.customersService.create({
          name: `Instagram User ${from}`,
          email: `${from}@instagram.local`,
          instagramId: from,
        });
      }

      console.log('Customer found/created:', customer.id);

      // Create inbound message
      const createdMessage = await this.messagesService.create({
        content: text,
        platform: 'instagram',
        direction: 'inbound',
        customerId: customer.id,
      });

      console.log('Instagram message created in database:', createdMessage.id);

      // Emit real-time update via WebSocket for inbound message
      this.websocketGateway.emitNewMessage('instagram', {
        id: createdMessage.id,
        from: from,
        to: '',
        content: text,
        timestamp: createdMessage.createdAt.toISOString(),
        direction: 'inbound',
        customerId: customer.id,
        customerName: customer.name,
      });

      // Queue the message for AI processing
      console.log('Adding Instagram message to queue for processing...');
      await this.messageQueue.add('processMessage', {
        messageId: createdMessage.id,
      });
      console.log('Instagram message added to queue successfully');
    }
  }

  async verifyInstagramWebhook(mode: string, challenge: string, token: string) {
    if (mode === 'subscribe' && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
      return challenge;
    }
    return 'ERROR';
  }

  async handleMessengerWebhook(data: any) {
    // Similar
    const message = data.entry[0].messaging[0];
    const from = message.sender.id;
    const text = message.message.text;

    let customer = await this.customersService.findByEmail(`${from}@messenger.com`);
    if (!customer) {
      customer = await this.customersService.create({
        name: `Messenger User ${from}`,
        email: `${from}@messenger.com`,
      });
    }

    await this.messagesService.create({
      content: text,
      platform: 'messenger',
      direction: 'inbound',
      customerId: customer.id,
    });

    const intent = await this.messagesService.classifyIntent(text);
    if (intent === 'faq') {
      const answer = await this.aiService.answerFaq(text);
      console.log('Send Messenger response:', answer);
    }
  }

  async handleTelegramWebhook(data: any) {
    // Similar
    const message = data.message;
    const from = message.from.id;
    const text = message.text;

    let customer = await this.customersService.findByEmail(`${from}@telegram.org`);
    if (!customer) {
      customer = await this.customersService.create({
        name: `Telegram User ${from}`,
        email: `${from}@telegram.org`,
      });
    }

    await this.messagesService.create({
      content: text,
      platform: 'telegram',
      direction: 'inbound',
      customerId: customer.id,
    });

    const intent = await this.messagesService.classifyIntent(text);
    if (intent === 'faq') {
      const answer = await this.aiService.answerFaq(text);
      console.log('Send Telegram response:', answer);
    }
  }
}
