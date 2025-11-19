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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageQueueProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const messages_service_1 = require("../src/modules/messages/messages.service");
const ai_service_1 = require("../src/modules/ai/ai.service");
const bookings_service_1 = require("../src/modules/bookings/bookings.service");
const whatsapp_service_1 = require("../src/modules/whatsapp/whatsapp.service");
const instagram_service_1 = require("../src/modules/instagram/instagram.service");
const customers_service_1 = require("../src/modules/customers/customers.service");
const websocket_gateway_1 = require("../src/websockets/websocket.gateway");
const chrono = require("chrono-node");
const booking_1 = require("../src/utils/booking");
let MessageQueueProcessor = class MessageQueueProcessor {
    constructor(messagesService, aiService, bookingsService, whatsappService, customersService, instagramService, websocketGateway) {
        this.messagesService = messagesService;
        this.aiService = aiService;
        this.bookingsService = bookingsService;
        this.whatsappService = whatsappService;
        this.customersService = customersService;
        this.instagramService = instagramService;
        this.websocketGateway = websocketGateway;
    }
    async process(job) {
        let customerId;
        let messageContent;
        let platform;
        let from;
        if (job.data.messageId) {
            const message = await this.messagesService.findOne(job.data.messageId);
            if (!message) {
                return { processed: false, error: 'Message not found' };
            }
            customerId = message.customerId;
            messageContent = message.content;
            platform = message.platform;
            from = message.customer.whatsappId || message.customer.instagramId || message.customer.phone;
        }
        else {
            ({ customerId, message: messageContent, platform, from } = job.data);
        }
        const historyMessages = await this.messagesService.findByCustomer(customerId);
        const history = historyMessages
            .filter(m => m.direction === 'inbound' || m.direction === 'outbound')
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .slice(-10)
            .map(m => ({
            role: m.direction === 'inbound' ? 'user' : 'assistant',
            content: m.content
        }))
            .filter((msg, index, arr) => {
            if (index > 0) {
                const prev = arr[index - 1];
                if (msg.content.includes('Hey there! 😊') && prev.content.includes('Hey there! 😊'))
                    return false;
                if (msg.content.includes('Hello! Thank you for your message.') && prev.content.includes('Hello! Thank you for your message.'))
                    return false;
            }
            return true;
        });
        let response = '';
        try {
            let extracted = null;
            try {
                const parsedDates = chrono.parse(messageContent);
                const dateHints = parsedDates.map(p => p.text).join(' ');
                const enhancedMessage = dateHints ? `${messageContent} (parsed dates: ${dateHints})` : messageContent;
                extracted = await this.aiService.extractBookingDetails(enhancedMessage, history);
            }
            catch (e) {
                console.warn('AI extraction failed, falling back to keyword intent');
            }
            let intent = 'general';
            if (extracted?.intent && extracted.intent !== 'unknown') {
                intent = extracted.intent;
            }
            else {
                const lower = messageContent.toLowerCase();
                if (lower.includes('book') || lower.includes('appointment') || lower.includes('booked'))
                    intent = 'booking_details';
                else if (lower.includes('price') || lower.includes('cost') || lower.includes('how much'))
                    intent = 'faq';
            }
            if (intent === 'booking_details' || intent === 'book' || intent === 'provide-info' || intent === 'confirm' || intent === 'cancel') {
                console.log('LOG: Processing booking-related intent:', intent);
                let draft = await this.bookingsService.getBookingDraft(customerId);
                if (!draft) {
                    draft = await this.bookingsService.createBookingDraft(customerId);
                }
                const updates = {};
                if (extracted?.service)
                    updates.service = extracted.service;
                if (extracted?.name)
                    updates.name = extracted.name;
                if (extracted?.date || extracted?.time) {
                    const normalized = (0, booking_1.normalizeExtractedDateTime)({ date: extracted.date, time: extracted.time });
                    if (normalized.dateObj) {
                        updates.date = normalized.dateOnly;
                        updates.time = normalized.timeOnly;
                    }
                    else {
                        updates.date = extracted.date ?? null;
                        updates.time = extracted.time ?? null;
                    }
                }
                if (Object.keys(updates).length > 0) {
                    draft = await this.bookingsService.updateBookingDraft(customerId, updates);
                }
                let bookingResult = null;
                if (extracted?.intent === 'cancel') {
                    await this.bookingsService.deleteBookingDraft(customerId);
                    bookingResult = { action: 'cancelled' };
                }
                else if (extracted?.intent === 'confirm' && draft.service && draft.date && draft.time && draft.name) {
                    const dateTime = new Date(`${draft.date}T${draft.time}`);
                    const availability = await this.bookingsService.checkAvailability(dateTime, draft.service);
                    if (!availability.available) {
                        bookingResult = { action: 'error', error: 'Time slot not available' };
                    }
                    else {
                        try {
                            const booking = await this.bookingsService.completeBookingDraft(customerId);
                            bookingResult = { action: 'confirmed', booking };
                        }
                        catch (error) {
                            bookingResult = { action: 'error', error: error.message };
                        }
                    }
                }
                else {
                    bookingResult = { action: 'in_progress', draft };
                }
                response = await this.aiService.generateStepBasedBookingResponse(messageContent, customerId, this.bookingsService, history, draft, bookingResult);
                history.push({ role: 'assistant', content: response });
            }
            else if (intent === 'faq') {
                response = await this.aiService.answerFaq(messageContent, history);
            }
            else {
                response = await this.aiService.generateGeneralResponse(messageContent, customerId, this.bookingsService, history);
            }
        }
        catch (error) {
            console.error('Error generating AI response:', error);
            response = 'Hello! Thank you for your message. How can I help you today?';
        }
        if (platform === 'whatsapp' && from) {
            try {
                await this.whatsappService.sendMessage(from, response);
            }
            catch (sendError) {
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
            }
            catch (createError) {
                console.error('Error creating outbound message record:', createError);
            }
        }
        else if (platform === 'instagram' && from) {
            try {
                await this.instagramService.sendMessage(from, response);
            }
            catch (sendError) {
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
            }
            catch (createError) {
                console.error('Error creating outbound message record:', createError);
            }
        }
        return { processed: true };
    }
};
exports.MessageQueueProcessor = MessageQueueProcessor;
__decorate([
    (0, bull_1.Process)('processMessage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MessageQueueProcessor.prototype, "process", null);
exports.MessageQueueProcessor = MessageQueueProcessor = __decorate([
    (0, common_1.Injectable)(),
    (0, bull_1.Processor)('messageQueue'),
    __metadata("design:paramtypes", [messages_service_1.MessagesService,
        ai_service_1.AiService,
        bookings_service_1.BookingsService,
        whatsapp_service_1.WhatsappService,
        customers_service_1.CustomersService,
        instagram_service_1.InstagramService,
        websocket_gateway_1.WebsocketGateway])
], MessageQueueProcessor);
//# sourceMappingURL=message-queue.processor.js.map