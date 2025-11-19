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
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const config_1 = require("@nestjs/config");
const openai_1 = require("openai");
const pinecone_1 = require("@pinecone-database/pinecone");
const prisma_service_1 = require("../../prisma/prisma.service");
let AiService = class AiService {
    constructor(configService, prisma, aiQueue) {
        this.configService = configService;
        this.prisma = prisma;
        this.aiQueue = aiQueue;
        this.openai = new openai_1.OpenAI({
            apiKey: this.configService.get('OPENAI_API_KEY'),
        });
        this.pinecone = new pinecone_1.Pinecone({
            apiKey: this.configService.get('PINECONE_API_KEY'),
            environment: this.configService.get('PINECONE_ENVIRONMENT'),
        });
        this.index = this.pinecone.index(this.configService.get('PINECONE_INDEX_NAME', 'business-kb'));
    }
    async generateEmbedding(text) {
        const response = await this.openai.embeddings.create({
            model: this.configService.get('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small'),
            input: text,
        });
        return response.data[0].embedding;
    }
    async retrieveRelevantDocs(query, topK = 5) {
        const queryEmbedding = await this.generateEmbedding(query);
        const response = await this.index.query({
            vector: queryEmbedding,
            topK,
            includeMetadata: true,
        });
        return response.matches;
    }
    async answerFaq(question, history = []) {
        try {
            const relevantDocs = await this.retrieveRelevantDocs(question, 3);
            const messages = [
                { role: 'system', content: 'You are a helpful salon assistant. Answer questions based ONLY on the provided context. If the context doesn\'t contain the answer, say "I\'m not sure about that but I can check for you." Keep answers concise and friendly.' }
            ];
            relevantDocs.forEach((doc, index) => {
                messages.push({ role: 'system', content: `Context ${index + 1}: ${doc.metadata.answer}` });
            });
            messages.push(...history.map(h => ({ role: h.role, content: h.content })));
            messages.push({ role: 'user', content: question });
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o',
                messages,
                max_tokens: 200,
            });
            return response.choices[0].message.content || 'I\'m not sure about that but I can check for you.';
        }
        catch (error) {
            console.error('FAQ retrieval failed:', error);
            return 'I\'m not sure about that but I can check for you.';
        }
    }
    async extractBookingDetails(message, history = []) {
        const messages = [
            { role: 'system', content: `You are a booking detail extractor for a salon assistant. Analyze the message and return ONLY this JSON format:
{
  "service": string | undefined,
  "date": string | undefined,
  "time": string | undefined,
  "name": string | undefined,
  "subIntent": "start" | "provide" | "confirm" | "cancel" | "unknown"
}

Rules:
- Extract ONLY explicitly mentioned details from the CURRENT message (not history).
- service: e.g., "haircut", "manicure"
- date: e.g., "tomorrow", "next Friday", "2024-01-15"
- time: e.g., "9 AM", "afternoon"
- name: customer's name
- subIntent: "start" if user wants to book, "provide" if giving details, "confirm" if agreeing, "cancel" if canceling, "unknown" otherwise
- Do NOT assume or invent values
- Do NOT add extra fields or commentary` }
        ];
        messages.push(...history.slice(-4).map(h => ({ role: h.role, content: h.content })));
        messages.push({ role: 'user', content: message });
        const response = await this.openai.chat.completions.create({
            model: 'gpt-4o',
            messages,
            max_tokens: 150,
            temperature: 0.1,
        });
        const content = response.choices[0].message.content?.trim();
        try {
            const parsed = JSON.parse(content || '{}');
            return {
                service: typeof parsed.service === 'string' ? parsed.service : undefined,
                date: typeof parsed.date === 'string' ? parsed.date : undefined,
                time: typeof parsed.time === 'string' ? parsed.time : undefined,
                name: typeof parsed.name === 'string' ? parsed.name : undefined,
                subIntent: ['start', 'provide', 'confirm', 'cancel', 'unknown'].includes(parsed.subIntent) ? parsed.subIntent : 'unknown'
            };
        }
        catch {
            return { subIntent: 'unknown' };
        }
    }
    async generateBookingResponse(message, draft, extraction) {
        const missingFields = [];
        if (!draft.service)
            missingFields.push('service');
        if (!draft.date)
            missingFields.push('date');
        if (!draft.time)
            missingFields.push('time');
        if (!draft.name)
            missingFields.push('name');
        let currentStep = draft.step || 'service';
        if (missingFields.length === 0)
            currentStep = 'confirm';
        const systemPrompt = `You are a warm, friendly salon receptionist. 
Your goal is to COMPLETE the booking by asking ONE missing detail at a time.

RULES:
- Never repeat a question if the user already answered.
- Never introduce new information not provided.
- Keep responses short (1–2 sentences).
- Stay friendly and natural.
- If all details are collected, summarize and ask for confirmation.
- If the user confirms, finalize the booking.
- If the user cancels, politely reset.

BOOKING STATE:
Service: ${draft.service || 'missing'}
Date: ${draft.date || 'missing'}
Time: ${draft.time || 'missing'}
Name: ${draft.name || 'missing'}
Current Step: ${currentStep}

USER JUST SAID:
${message}

EXTRACTED FROM USER MESSAGE:
${JSON.stringify(extraction)}

OUTPUT:
Your next conversational response.
Ask ONLY for the next missing detail.`;
        const messages = [{ role: 'system', content: systemPrompt }];
        messages.push({ role: 'user', content: message });
        const response = await this.openai.chat.completions.create({
            model: 'gpt-4o',
            messages,
            max_tokens: 200,
            temperature: 0.7,
        });
        return response.choices[0].message.content || 'Great, how can I assist?';
    }
    async addKnowledge(question, answer) {
        const embedding = await this.generateEmbedding(question + ' ' + answer);
        await this.prisma.knowledgeBase.create({
            data: {
                question,
                answer,
                embedding,
            },
        });
        await this.index.upsert([{
                id: `kb-${Date.now()}`,
                values: embedding,
                metadata: { question, answer },
            }]);
    }
    async processAiRequest(data) {
        const answer = await this.answerFaq(data.question, []);
        return answer;
    }
    async getOrCreateDraft(customerId) {
        let draft = await this.prisma.bookingDraft.findUnique({
            where: { customerId }
        });
        if (!draft) {
            draft = await this.prisma.bookingDraft.create({
                data: {
                    customerId,
                    step: 'service',
                    version: 1
                }
            });
        }
        return draft;
    }
    async updateDraft(customerId, updates) {
        return this.prisma.bookingDraft.upsert({
            where: { customerId },
            update: {
                ...updates,
                version: { increment: 1 },
                updatedAt: new Date()
            },
            create: {
                customerId,
                step: 'service',
                version: 1,
                ...updates
            }
        });
    }
    async completeBooking(draft, customerId, bookingsService) {
        const dateTime = new Date(`${draft.date} ${draft.time}`);
        const availability = await bookingsService.checkAvailability(dateTime, draft.service);
        if (!availability.available) {
            throw new Error('The requested time slot is not available. Please choose another time.');
        }
        const bookingData = {
            customerId,
            service: draft.service,
            dateTime,
            status: 'confirmed'
        };
        const booking = await bookingsService.createBooking(bookingData);
        await this.prisma.bookingDraft.delete({ where: { customerId } });
        return booking;
    }
    async classifyIntent(message, history = [], hasDraft = false) {
        if (hasDraft) {
            return 'booking';
        }
        const messages = [
            { role: 'system', content: `Classify the user intent as "faq" (general question about salon/services), "booking" (wants to book, provide details, confirm/cancel appointment), or "other". Return ONLY: {"intent": "faq" | "booking" | "other"}

Strong rules:
- If message contains booking-related words (book, appointment, schedule, service, date, time, name), classify as "booking"
- If message is a question about salon/services/pricing/hours, classify as "faq"
- If message is short responses like dates ("tomorrow", "next Friday", "9 AM", "John"), classify as "booking"
- Otherwise "other"` }
        ];
        messages.push(...history.slice(-3).map(h => ({ role: h.role, content: h.content })));
        messages.push({ role: 'user', content: message });
        const response = await this.openai.chat.completions.create({
            model: 'gpt-4o',
            messages,
            max_tokens: 50,
            temperature: 0.1,
        });
        const content = response.choices[0].message.content?.trim();
        try {
            const parsed = JSON.parse(content || '{}');
            return parsed.intent || 'other';
        }
        catch {
            return 'other';
        }
    }
    async handleConversation(message, customerId, history = [], bookingsService) {
        const existingDraft = await this.prisma.bookingDraft.findUnique({
            where: { customerId }
        });
        const hasDraft = !!existingDraft;
        let intent;
        if (hasDraft) {
            intent = 'booking';
        }
        else {
            intent = await this.classifyIntent(message, history.slice(-3), false);
        }
        let response;
        let updatedHistory = [...history, { role: 'user', content: message }];
        let draft = undefined;
        if (intent === 'faq') {
            response = await this.answerFaq(message, history.slice(-3));
        }
        else if (intent === 'booking') {
            draft = existingDraft || await this.getOrCreateDraft(customerId);
            const extraction = await this.extractBookingDetails(message, history.slice(-3));
            const updates = {};
            if (extraction.service)
                updates.service = extraction.service;
            if (extraction.date)
                updates.date = extraction.date;
            if (extraction.time)
                updates.time = extraction.time;
            if (extraction.name)
                updates.name = extraction.name;
            const missing = [];
            if (!draft.service && !extraction.service)
                missing.push('service');
            if (!draft.date && !extraction.date)
                missing.push('date');
            if (!draft.time && !extraction.time)
                missing.push('time');
            if (!draft.name && !extraction.name)
                missing.push('name');
            if (missing.length > 0) {
                updates.step = missing[0];
            }
            else {
                updates.step = 'confirm';
            }
            if (extraction.subIntent === 'confirm' && missing.length === 0) {
                try {
                    await this.completeBooking(draft, customerId, bookingsService);
                    response = `Wonderful! Your ${draft.service} appointment on ${draft.date} at ${draft.time} for ${draft.name} is confirmed. See you soon!`;
                }
                catch (error) {
                    response = `I'm sorry, ${error.message} Would you like to choose a different time?`;
                }
            }
            else if (extraction.subIntent === 'cancel') {
                await this.prisma.bookingDraft.delete({ where: { customerId } });
                response = `No problem, booking cancelled. How else can I help?`;
            }
            else {
                const updatedDraft = await this.updateDraft(customerId, updates);
                draft = updatedDraft;
                response = await this.generateBookingResponse(message, draft, extraction);
            }
        }
        else {
            if (hasDraft) {
                return this.handleConversation(message, customerId, history, bookingsService);
            }
            const bookings = await bookingsService.getBookings(customerId);
            const upcoming = bookings.bookings.filter((b) => new Date(b.dateTime) > new Date());
            const context = upcoming.length > 0
                ? `Upcoming: ${upcoming.map(b => `${b.service} on ${new Date(b.dateTime).toLocaleDateString()}`).join(', ')}`
                : 'No upcoming';
            const systemPrompt = `You are a warm salon receptionist. Respond helpfully to general queries. Context: ${context}. Keep it 1-2 sentences, friendly.`;
            const messages = [{ role: 'system', content: systemPrompt }];
            messages.push({ role: 'user', content: message });
            const openaiResponse = await this.openai.chat.completions.create({
                model: 'gpt-4o',
                messages,
                max_tokens: 150,
            });
            response = openaiResponse.choices[0].message.content || 'How can I help you today?';
        }
        updatedHistory.push({ role: 'assistant', content: response });
        return { response, updatedHistory, draft };
    }
    async generateResponse(message, customerId, bookingsService, history, extractedBooking, faqContext) {
        const result = await this.handleConversation(message, customerId, history || [], bookingsService);
        return result.response;
    }
    async extractStepBasedBookingDetails(message, currentStep, history) {
        return { nextStep: currentStep };
    }
    async generateStepBasedBookingResponse(message, customerId, bookingsService, history = [], draft, bookingResult) {
        const result = await this.handleConversation(message, customerId, history, bookingsService);
        return result.response;
    }
    async generateGeneralResponse(message, customerId, bookingsService, history) {
        const result = await this.handleConversation(message, customerId, history || [], bookingsService);
        return result.response;
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bull_1.InjectQueue)('aiQueue')),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService, Object])
], AiService);
//# sourceMappingURL=ai.service.js.map