"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksService = void 0;
const common_1 = require("@nestjs/common");
const messages_service_1 = require("../messages/messages.service");
const customers_service_1 = require("../customers/customers.service");
const ai_service_1 = require("../ai/ai.service");
const bull_1 = require("@nestjs/bull");
const websocket_gateway_1 = require("../../websockets/websocket.gateway");
let WebhooksService = class WebhooksService {
    constructor(messagesService, customersService, aiService, messageQueue, websocketGateway) {
        this.messagesService = messagesService;
        this.customersService = customersService;
        this.aiService = aiService;
        this.messageQueue = messageQueue;
        this.websocketGateway = websocketGateway;
    }
    async handleWhatsAppWebhook(body) {
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
    async processWhatsAppMessage(value) {
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
            const existingMessage = await this.messagesService.findByExternalId(messageId);
            if (existingMessage) {
                console.log('Message already processed, skipping duplicate');
                return;
            }
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
            const createdMessage = await this.messagesService.create({
                content: text,
                platform: 'whatsapp',
                direction: 'inbound',
                customerId: customer.id,
                externalId: messageId,
            });
            console.log('Message created in database:', createdMessage.id);
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
            console.log('Adding message to queue for processing...');
            await this.messageQueue.add('processMessage', {
                messageId: createdMessage.id,
            });
            console.log('Message added to queue successfully');
        }
    }
    async handleInstagramWebhook(data) {
        console.log('Processing Instagram webhook:', JSON.stringify(data, null, 2));
        if (!data.entry || data.entry.length === 0) {
            console.log('No entry in Instagram webhook payload');
            return;
        }
        const entry = data.entry[0];
        if (!entry.messaging || entry.messaging.length === 0) {
            console.log('No messaging in Instagram webhook entry');
            return;
        }
        const message = entry.messaging[0];
        console.log('Instagram message type:', message.message?.text ? 'text' : 'other');
        if (message.message?.text) {
            const from = message.sender.id;
            const text = message.message.text;
            console.log('Received Instagram text message from', from, ':', text);
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
            const createdMessage = await this.messagesService.create({
                content: text,
                platform: 'instagram',
                direction: 'inbound',
                customerId: customer.id,
            });
            console.log('Instagram message created in database:', createdMessage.id);
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
            console.log('Adding Instagram message to queue for processing...');
            await this.messageQueue.add('processMessage', {
                messageId: createdMessage.id,
            });
            console.log('Instagram message added to queue successfully');
        }
    }
    async verifyInstagramWebhook(mode, challenge, token) {
        if (mode === 'subscribe' && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
            return challenge;
        }
        return 'ERROR';
    }
    async handleMessengerWebhook(data) {
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
    async handleTelegramWebhook(data) {
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
};
exports.WebhooksService = WebhooksService;
exports.WebhooksService = WebhooksService = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, bull_1.InjectQueue)('messageQueue')),
    __metadata("design:paramtypes", [messages_service_1.MessagesService,
        customers_service_1.CustomersService,
        ai_service_1.AiService, Object, websocket_gateway_1.WebsocketGateway])
], WebhooksService);
//# sourceMappingURL=webhooks.service.js.map