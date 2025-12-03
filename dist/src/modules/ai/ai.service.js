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
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const config_1 = require("@nestjs/config");
const openai_1 = require("openai");
const pinecone_1 = require("@pinecone-database/pinecone");
const chrono = require("chrono-node");
const luxon_1 = require("luxon");
const prisma_service_1 = require("../../prisma/prisma.service");
const bookings_service_1 = require("../bookings/bookings.service");
const messages_service_1 = require("../messages/messages.service");
const escalation_service_1 = require("../escalation/escalation.service");
function extractModelVersion(model) {
    if (!model)
        return '';
    const match = model.match(/(gpt-[^\s]+)/);
    return match ? match[1] : model;
}
const package_inquiry_strategy_1 = require("./strategies/package-inquiry.strategy");
const booking_strategy_1 = require("./strategies/booking.strategy");
let AiService = AiService_1 = class AiService {
    constructor(configService, prisma, bookingsService, messagesService, escalationService, aiQueue) {
        this.configService = configService;
        this.prisma = prisma;
        this.bookingsService = bookingsService;
        this.messagesService = messagesService;
        this.escalationService = escalationService;
        this.aiQueue = aiQueue;
        this.logger = new common_1.Logger(AiService_1.name);
        this.pinecone = null;
        this.index = null;
        this.strategies = [];
        this.studioTz = 'Africa/Nairobi';
        this.historyLimit = 6;
        this.maxTokensPerDay = 100000;
        this.tokenUsageCache = new Map();
        this.packageCache = null;
        this.CACHE_TTL = 5 * 60 * 1000;
        this.businessName = 'Fiesta House Attire maternity photoshoot studio';
        this.businessLocation = 'Our studio is located at 4th Avenue Parklands, Diamond Plaza Annex, 2nd Floor. We look forward to welcoming you! 💖';
        this.businessWebsite = 'https://fiestahouseattire.com/';
        this.customerCarePhone = '0720 111928';
        this.customerCareEmail = 'info@fiestahouseattire.com';
        this.businessHours = 'Monday-Saturday: 9:00 AM - 6:00 PM';
        this.openai = new openai_1.default({ apiKey: this.configService.get('OPENAI_API_KEY') });
        this.embeddingModel = this.configService.get('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small');
        this.extractorModel = this.configService.get('OPENAI_EXTRACTOR_MODEL', 'gpt-4o');
        this.chatModel = this.configService.get('OPENAI_CHAT_MODEL', 'gpt-4o');
        this.initPineconeSafely();
        this.strategies = [
            new package_inquiry_strategy_1.PackageInquiryStrategy(),
            new booking_strategy_1.BookingStrategy(),
        ];
    }
    initPineconeSafely() {
        const apiKey = this.configService.get('PINECONE_API_KEY');
        const indexName = this.configService.get('PINECONE_INDEX_NAME');
        let env = this.configService.get('PINECONE_ENVIRONMENT');
        const host = this.configService.get('PINECONE_HOST');
        if (!apiKey || !indexName) {
            this.logger.warn('Pinecone disabled: missing PINECONE_API_KEY or PINECONE_INDEX_NAME in env.');
            this.pinecone = null;
            this.index = null;
            return;
        }
        if (env && env.startsWith('http')) {
            this.logger.warn('PINECONE_ENVIRONMENT contains a URL. Treating it as PINECONE_HOST. Please set PINECONE_HOST instead and set PINECONE_ENVIRONMENT to a short region (e.g., us-east-1) or leave it unset.');
            if (!host) {
                this.configService.PINECONE_HOST = env;
            }
            env = undefined;
        }
        try {
            if (env && !env.startsWith('http')) {
                this.pinecone = new pinecone_1.Pinecone({
                    apiKey,
                    environment: env,
                });
                this.index = this.pinecone.index(indexName);
                this.logger.log(`Pinecone initialized with environment="${env}", index="${indexName}".`);
                return;
            }
            if (host) {
                this.pinecone = new pinecone_1.Pinecone({ apiKey });
                try {
                    this.index = this.pinecone.index(indexName);
                    this.logger.log(`Pinecone initialized with HOST="${host}", index="${indexName}".`);
                    return;
                }
                catch (_) {
                    try {
                        this.pinecone.baseUrl = host;
                        if (typeof this.pinecone.Index === 'function') {
                            this.index = this.pinecone.Index(indexName);
                        }
                        else {
                            this.index = this.pinecone.index(indexName);
                        }
                        this.logger.log(`Pinecone initialized (fallback) with HOST="${host}", index="${indexName}".`);
                        return;
                    }
                    catch (e2) {
                        throw e2;
                    }
                }
            }
            this.logger.warn('Pinecone not initialized: set PINECONE_ENVIRONMENT (short region) or PINECONE_HOST (full index host URL). Continuing in DB-only mode.');
            this.pinecone = null;
            this.index = null;
        }
        catch (err) {
            this.logger.warn('Pinecone initialization failed. Falling back to DB-only mode. Error:', err);
            this.pinecone = null;
            this.index = null;
        }
    }
    async checkRateLimit(customerId) {
        const usage = this.tokenUsageCache.get(customerId);
        const now = new Date();
        if (!usage || usage.resetTime < now) {
            this.tokenUsageCache.set(customerId, {
                count: 0,
                resetTime: new Date(now.getTime() + 24 * 60 * 60 * 1000)
            });
            return true;
        }
        return usage.count < this.maxTokensPerDay;
    }
    async trackTokenUsage(customerId, tokensUsed) {
        const usage = this.tokenUsageCache.get(customerId);
        if (usage) {
            usage.count += tokensUsed;
        }
        try {
            const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
            if (customer) {
                const now = new Date();
                const resetNeeded = !customer.tokenResetDate || customer.tokenResetDate < now;
                await this.prisma.customer.update({
                    where: { id: customerId },
                    data: {
                        dailyTokenUsage: resetNeeded ? tokensUsed : customer.dailyTokenUsage + tokensUsed,
                        tokenResetDate: resetNeeded ? new Date(now.getTime() + 24 * 60 * 60 * 1000) : customer.tokenResetDate,
                        totalTokensUsed: customer.totalTokensUsed + tokensUsed,
                    },
                });
            }
        }
        catch (err) {
            this.logger.warn('Failed to track token usage in database', err);
        }
    }
    calculateTokenCount(messages) {
        return messages.reduce((acc, msg) => acc + (msg.content?.length || 0) / 4, 0);
    }
    pruneHistory(history, maxTokens = 2000) {
        let total = 0;
        const pruned = [];
        for (let i = history.length - 1; i >= 0; i--) {
            const tokens = history[i].content.length / 4;
            if (total + tokens > maxTokens)
                break;
            pruned.unshift(history[i]);
            total += tokens;
        }
        return pruned;
    }
    async handleOpenAIFailure(error, customerId) {
        this.logger.error('OpenAI API failure', error);
        if (this.aiQueue) {
            await this.aiQueue.add('retry-message', { customerId, error: error.message });
        }
        if (error.code === 'insufficient_quota') {
            await this.escalationService?.createEscalation(customerId, 'AI service quota exceeded');
            return "I'm having technical difficulties. A team member will assist you shortly! 💖";
        }
        if (error.code === 'rate_limit_exceeded') {
            return "I'm receiving a lot of messages right now. Please give me a moment and try again! 💕";
        }
        return "I'm having trouble right now. Could you rephrase that, or would you like to speak with someone? 💕";
    }
    async detectFrustration(message, history) {
        const frustrationKeywords = [
            'frustrated', 'angry', 'annoyed', 'disappointed',
            'terrible', 'worst', 'horrible', 'ridiculous',
            'useless', 'stupid', 'waste', 'pathetic'
        ];
        const repeatedQuestions = history
            .filter(h => h.role === 'user')
            .slice(-3)
            .map(h => h.content.toLowerCase());
        const hasRepetition = new Set(repeatedQuestions).size < repeatedQuestions.length;
        const hasFrustrationWords = frustrationKeywords.some(kw => message.toLowerCase().includes(kw));
        return hasRepetition || hasFrustrationWords;
    }
    async getCachedPackages() {
        const now = Date.now();
        if (this.packageCache && (now - this.packageCache.timestamp) < this.CACHE_TTL) {
            return this.packageCache.data;
        }
        const packages = await this.getCachedPackages();
        this.packageCache = { data: packages, timestamp: now };
        return packages;
    }
    sanitizeInput(message) {
        return message
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .trim()
            .slice(0, 2000);
    }
    validatePhoneNumber(phone) {
        const kenyanPattern = /^(\+254|0)[17]\d{8}$/;
        return kenyanPattern.test(phone.replace(/\s/g, ''));
    }
    async checkBookingConflicts(customerId, dateTime) {
        const existingBookings = await this.prisma.booking.findMany({
            where: {
                customerId,
                dateTime: {
                    gte: new Date(),
                },
                status: { in: ['confirmed', 'pending'] },
            },
        });
        if (existingBookings.length > 0) {
            const existing = luxon_1.DateTime.fromJSDate(existingBookings[0].dateTime);
            return `You already have a booking on ${existing.toFormat('MMM dd')}. Would you like to modify that instead ? `;
        }
        return null;
    }
    async trackConversationMetrics(customerId, metrics) {
        try {
            await this.prisma.conversationMetrics.create({
                data: {
                    customerId,
                    ...metrics,
                    timestamp: new Date(),
                },
            });
        }
        catch (err) {
            this.logger.warn('Failed to track conversation metrics', err);
        }
    }
    normalizeDateTime(rawDate, rawTime) {
        if (!rawDate && !rawTime)
            return null;
        const input = [rawDate, rawTime].filter(Boolean).join(' ');
        try {
            let parsed = chrono.parseDate(input, new Date());
            if (!parsed) {
                parsed = chrono.parseDate(rawDate ?? rawTime ?? '', new Date());
            }
            if (!parsed) {
                this.logger.warn('normalizeDateTime could not parse input', { rawDate, rawTime });
                return null;
            }
            const dt = luxon_1.DateTime.fromJSDate(parsed).setZone(this.studioTz);
            const isoUtc = dt.toUTC().toISO();
            return { isoUtc, dateOnly: dt.toFormat('yyyy-MM-dd'), timeOnly: dt.toFormat('HH:mm') };
        }
        catch (err) {
            this.logger.warn('normalizeDateTime failed', err);
            return null;
        }
    }
    async generateEmbedding(text) {
        const r = await this.openai.embeddings.create({ model: this.embeddingModel, input: text });
        return r.data[0].embedding;
    }
    async retrieveRelevantDocs(query, topK = 3) {
        if (!this.index) {
            this.logger.debug('retrieveRelevantDocs: Pinecone index not available - falling back to DB keyword search.');
            try {
                const faqs = await this.prisma.knowledgeBase.findMany({
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                });
                return faqs.map(f => ({
                    id: f.id,
                    score: 0.8,
                    metadata: {
                        answer: f.answer,
                        text: f.question,
                        category: f.category
                    }
                }));
            }
            catch (err) {
                this.logger.warn('retrieveRelevantDocs: DB fallback failed', err);
                return [];
            }
        }
        try {
            const vec = await this.generateEmbedding(query);
            const resp = await this.index.query({ vector: vec, topK, includeMetadata: true });
            return resp.matches ?? [];
        }
        catch (err) {
            this.logger.warn('retrieveRelevantDocs: Pinecone query failed', err);
            return [];
        }
    }
    formatPackageDetails(pkg, detailed = false) {
        if (!pkg)
            return '';
        const name = pkg.name ?? 'Unnamed Package';
        const type = pkg.type === 'outdoor' ? 'Outdoor' : 'Studio';
        const duration = pkg.duration ?? 'Duration not specified';
        const price = pkg.price !== undefined && pkg.price !== null ? `${pkg.price.toLocaleString()} KSH` : 'Price not available';
        const deposit = pkg.deposit !== undefined && pkg.deposit !== null ? `${pkg.deposit.toLocaleString()} KSH` : 'Contact us';
        const features = [];
        if (pkg.images)
            features.push(`${pkg.images} soft copy image${pkg.images > 1 ? 's' : ''} `);
        if (pkg.outfits)
            features.push(`${pkg.outfits} outfit change${pkg.outfits > 1 ? 's' : ''} `);
        if (pkg.makeup)
            features.push('Professional makeup');
        if (pkg.styling)
            features.push('Professional styling');
        if (pkg.balloonBackdrop)
            features.push('Customized balloon backdrop');
        if (pkg.wig)
            features.push('Styled wig');
        if (pkg.photobook) {
            const size = pkg.photobookSize ? ` (${pkg.photobookSize})` : '';
            features.push(`Photobook${size} `);
        }
        if (pkg.mount)
            features.push('A3 mount');
        if (detailed) {
            let message = `📦 * ${name}* (${type}) \n\n`;
            message += `⏱️ Duration: ${duration} \n`;
            message += `💰 Price: ${price} | Deposit: ${deposit} \n\n`;
            if (features.length > 0) {
                message += `✨ What's Included:\n`;
                features.forEach(f => message += `• ${f}\n`);
            }
            if (pkg.notes) {
                message += `\n📝 ${pkg.notes}`;
            }
            return message;
        }
        else {
            let brief = `*${name}*: ${duration}, ${price}`;
            if (features.length > 0) {
                const keyFeatures = features.slice(0, 3).join(', ');
                brief += ` — Includes: ${keyFeatures}`;
                if (features.length > 3)
                    brief += `, and more`;
            }
            return brief;
        }
    }
    async answerFaq(question, history = [], actual, customerId) {
        let prediction = '';
        let confidence = undefined;
        let error = undefined;
        const start = Date.now();
        let mediaUrls = [];
        try {
            const backdropRegex = /(backdrop|background|studio set|flower wall|portfolio|show.*(image|photo|picture|portfolio))/i;
            let isBackdropQuery = backdropRegex.test(question);
            this.logger.debug(`[AiService] Question: "${question}", isBackdropQuery: ${isBackdropQuery}`);
            if (isBackdropQuery) {
                const assets = await this.prisma.mediaAsset.findMany({
                    where: {
                        OR: [
                            { category: { in: ['backdrop', 'studio', 'portfolio'] } },
                            { description: { contains: 'backdrop', mode: 'insensitive' } },
                            { title: { contains: 'backdrop', mode: 'insensitive' } },
                        ],
                    },
                    take: 6,
                    orderBy: { createdAt: 'desc' },
                });
                mediaUrls = assets.map(a => a.url);
                this.logger.debug(`[AiService] Found ${mediaUrls.length} media assets for backdrop query`);
            }
            const docs = await this.retrieveRelevantDocs(question, 5);
            if (docs.length > 0) {
                prediction = docs[0].metadata.answer;
                confidence = docs[0].score;
                if (docs[0].metadata.mediaUrls && Array.isArray(docs[0].metadata.mediaUrls)) {
                    mediaUrls.push(...docs[0].metadata.mediaUrls);
                }
            }
            else {
                const messages = [
                    {
                        role: 'system',
                        content: `You are a warm, empathetic assistant for a maternity photoshoot studio. Always answer with warmth, flexibility, and genuine care.

CRITICAL INSTRUCTIONS:
- You MUST base your answer STRICTLY on the provided Context messages below
- Do NOT invent, hallucinate, or add any information not in the contexts
- **Business Policies (Always Enforce):**
  * Remaining balance is due after the shoot.
  * Edited photos are delivered in 10 working days.
  * Reschedules must be made at least 72 hours before the shoot time to avoid forfeiting the session fee.
  * Cancellations or changes made within 72 hours of the shoot are non-refundable, and the session fee will be forfeited.
- When asked about packages:
  * ONLY mention packages explicitly listed in the context
  * NEVER create or mention package names not provided (e.g., don't say "Premium" or "Deluxe" if not in context)
  * If asked about a feature, check which actual packages in the context have it
  * If no packages match, say "Let me check our current packages for you" rather than inventing
- When describing packages, include ALL features from context: images, outfits, makeup, styling, balloon backdrop, wigs, photobooks, mounts
- If no relevant context provided, offer to help find the information`,
                    },
                ];
                if (/(package|photobook|makeup|styling|balloon|wig|outfit|image|photo|shoot|session|include|feature|come with|have)/i.test(question)) {
                    try {
                        const packages = await this.getCachedPackages();
                        if (packages && packages.length > 0) {
                            let packageContext = '=== AVAILABLE PACKAGES FROM DATABASE ===\n\n';
                            packages.forEach((pkg) => {
                                packageContext += this.formatPackageDetails(pkg, true) + '\n\n---\n\n';
                            });
                            packageContext += '\nIMPORTANT: These are the ONLY packages that exist. You MUST NOT mention any package names not listed above.';
                            messages.push({ role: 'system', content: packageContext });
                            this.logger.debug(`answerFaq: Added ${packages.length} packages to context`);
                        }
                    }
                    catch (err) {
                        this.logger.warn('answerFaq: Failed to fetch packages for context', err);
                    }
                }
                docs.forEach((d, i) => {
                    const md = d.metadata ?? {};
                    messages.push({ role: 'system', content: `Context ${i + 1}: ${md.answer ?? md.text ?? ''}` });
                });
                const prunedHistory = this.pruneHistory(history);
                messages.push(...prunedHistory.map(h => ({ role: h.role, content: h.content })));
                messages.push({ role: 'user', content: question });
                try {
                    const rsp = await this.openai.chat.completions.create({
                        model: this.chatModel,
                        messages,
                        max_tokens: 220,
                        temperature: 0.0,
                    });
                    prediction = rsp.choices[0].message.content.trim();
                    if (customerId && rsp.usage?.total_tokens) {
                        await this.trackTokenUsage(customerId, rsp.usage.total_tokens);
                    }
                }
                catch (err) {
                    if (customerId) {
                        prediction = await this.handleOpenAIFailure(err, customerId);
                    }
                    else {
                        throw err;
                    }
                }
            }
            if (mediaUrls.length > 0) {
                mediaUrls = [...new Set(mediaUrls)];
                prediction += `\n\nHere are some examples from our portfolio:`;
                mediaUrls = mediaUrls.slice(0, 6);
            }
            return { text: prediction, mediaUrls };
        }
        catch (err) {
            this.logger.error('answerFaq error', err);
            error = err?.message || String(err);
            prediction = "I'm not sure about that but I can check for you.";
            return { text: prediction, mediaUrls };
        }
        finally {
            if (customerId) {
                try {
                    await this.prisma.aiPrediction.create({
                        data: {
                            input: question,
                            prediction: typeof prediction === 'string' ? prediction : JSON.stringify(prediction),
                            actual: actual ?? null,
                            confidence,
                            responseTime: Date.now() - start,
                            error,
                            userFeedback: null,
                            modelVersion: extractModelVersion(this.chatModel),
                        },
                    });
                }
                catch (logErr) {
                    this.logger.warn('Failed to log AiPrediction', logErr);
                }
            }
        }
    }
    async extractBookingDetails(message, history = []) {
        const currentDate = luxon_1.DateTime.now().setZone(this.studioTz).toFormat('yyyy-MM-dd');
        const systemPrompt = `You are a strict JSON extractor for maternity photoshoot bookings.
Return ONLY valid JSON (no commentary). Schema:

{
  "service": string | null,
  "date": string | null,
  "time": string | null,
  "name": string | null,
  "recipientName": string | null,
  "recipientPhone": string | null,
  "isForSomeoneElse": boolean | null,
  "subIntent": "start" | "provide" | "confirm" | "cancel" | "reschedule" | "unknown"
}

Current Date: ${currentDate}

Rules:
- Extract ONLY what is explicitly present in the CURRENT message.
- If the user mentions a change to a previously provided value (date, time, service, name, recipientName, recipientPhone), return it explicitly in JSON.
- Do NOT invent or assume values; use null when unknown.
- Do NOT include extra fields or prose.
- Use history for context on prior values, but extract only from the current message.
- Set "isForSomeoneElse" to true if the message indicates the booking is for someone else (e.g., "for my wife", "my friend", "someone else", "not for me").
- Extract "recipientName" if mentioned as the person the booking is for.
- Extract "recipientPhone" if a phone number is provided for the recipient.
- IMPORTANT: Resolve relative dates (e.g., "tomorrow", "next Friday", "the 5th") to YYYY-MM-DD format using the Current Date.
- If the user says "5th" or "the 5th", assume they mean the next occurrence of that day of the month relative to Current Date.
Examples:
- "I'd like a haircut tomorrow at 9am" => service: "haircut", date: "2025-12-02" (if today is 2025-12-01), time: "9am", name: null, recipientName: null, recipientPhone: null, isForSomeoneElse: null, subIntent: "start".
- "Change my time to 3pm" => time: "3pm", recipientName: null, recipientPhone: null, isForSomeoneElse: null, subIntent: "provide".
- "Book for my sister Jane at 0712345678" => service: null, date: null, time: null, name: null, recipientName: "Jane", recipientPhone: "0712345678", isForSomeoneElse: true, subIntent: "start".
- Short confirmations like "yes" or "confirm" => subIntent: "confirm".
`;
        const messages = [{ role: 'system', content: systemPrompt }];
        const prunedHistory = this.pruneHistory(history);
        messages.push(...prunedHistory.map(h => ({ role: h.role, content: h.content })));
        messages.push({ role: 'user', content: message });
        try {
            const rsp = await this.openai.chat.completions.create({
                model: this.extractorModel,
                messages,
                max_tokens: 160,
                temperature: 0.1,
            });
            let content = rsp.choices[0].message.content?.trim() ?? '';
            const fenced = content.match(/```(?: json) ?\s * ([\s\S] *?) \s * ```/i);
            const objMatch = content.match(/\{[\s\S]*\}/);
            const jsonText = fenced ? fenced[1] : (objMatch ? objMatch[0] : content);
            let parsed = {};
            try {
                parsed = JSON.parse(jsonText);
            }
            catch (parseErr) {
                this.logger.warn('extractBookingDetails JSON parse failed, raw model output:', content, parseErr);
                return { subIntent: 'unknown' };
            }
            return {
                service: typeof parsed.service === 'string' ? parsed.service : undefined,
                date: typeof parsed.date === 'string' ? parsed.date : undefined,
                time: typeof parsed.time === 'string' ? parsed.time : undefined,
                name: typeof parsed.name === 'string' ? parsed.name : undefined,
                recipientName: typeof parsed.recipientName === 'string' ? parsed.recipientName : undefined,
                recipientPhone: typeof parsed.recipientPhone === 'string' ? parsed.recipientPhone : undefined,
                isForSomeoneElse: typeof parsed.isForSomeoneElse === 'boolean' ? parsed.isForSomeoneElse : undefined,
                subIntent: ['start', 'provide', 'confirm', 'cancel', 'reschedule', 'unknown'].includes(parsed.subIntent) ? parsed.subIntent : 'unknown',
            };
        }
        catch (err) {
            this.logger.error('extractBookingDetails error', err);
            return { subIntent: 'unknown' };
        }
    }
    async generateBookingReply(message, draft, extraction, history = [], bookingsService) {
        const missing = [];
        if (!draft.service)
            missing.push('service');
        if (!draft.date)
            missing.push('date');
        if (!draft.time)
            missing.push('time');
        if (!draft.name)
            missing.push('name');
        if (draft.isForSomeoneElse) {
            if (!draft.recipientName)
                missing.push('recipientName');
            if (!draft.recipientPhone)
                missing.push('recipientPhone');
        }
        else {
            if (!draft.recipientName)
                draft.recipientName = draft.name;
            if (!draft.recipientPhone)
                missing.push('recipientPhone');
        }
        const nextStep = missing.length === 0 ? 'confirm' : missing[0];
        const isUpdate = extraction.service || extraction.date || extraction.time || extraction.name || extraction.recipientName || extraction.recipientPhone;
        let packagesInfo = '';
        if (nextStep === 'service' || /(package|price|pricing|cost|how much|offer|photoshoot|shoot|what do you have|what are|show me|tell me about|include|feature)/i.test(message)) {
            try {
                const packages = await this.getCachedPackages();
                if (packages && packages.length > 0) {
                    packagesInfo = '\n\n=== AVAILABLE PACKAGES FROM DATABASE ===\n\n';
                    packages.forEach((pkg) => {
                        packagesInfo += this.formatPackageDetails(pkg, true) + '\n\n---\n\n';
                    });
                    packagesInfo += 'CRITICAL: These are the ONLY packages that exist. You MUST NOT mention any package names not listed above (e.g., do NOT say "Classic", "Premium", or "Deluxe" if they are not in this list).';
                }
            }
            catch (err) {
                this.logger.warn('Failed to fetch packages for reply', err);
            }
        }
        const sys = `You are a loving, emotionally intelligent assistant for a maternity photoshoot studio.
  Your clients are expectant mothers and their families—often feeling emotional, excited, and sometimes anxious.

      Instructions:
    - Always use sweet, gentle, and supportive language.
  - Celebrate their journey("What a magical time!" or "You’re glowing!").
  - If asking for details, do it softly and with encouragement.
  - If confirming, use warm, celebratory language.
  - If the user updates something, acknowledge it kindly.
  - Never sound robotic or like a bot—always sound like a caring friend.
  - Stress getting the name early by making it a priority if missing.
  - For bookings for someone else, collect recipient name and phone, then confirm if the phone is the best to reach them.
  - For self - bookings, set recipient to customer details, but ask to confirm if the WhatsApp number is the best to reach them.

      CRITICAL - Package Information:
    - When discussing packages, ONLY mention packages listed in the AVAILABLE PACKAGES section below
      - NEVER invent or mention package names not in the database
        - Use the exact package names, prices, and features provided
          - If asked about packages, describe them using the details from AVAILABLE PACKAGES
    - Do NOT create packages like "Classic", "Premium", or "Deluxe" unless they appear in the list
${packagesInfo}
  CURRENT DRAFT:
    Package: ${draft.service ?? 'missing'}
    Date: ${draft.date ?? 'missing'}
    Time: ${draft.time ?? 'missing'}
    Name: ${draft.name ?? 'missing'}
  Is for someone else: ${draft.isForSomeoneElse ?? false}
  Recipient Name: ${draft.recipientName ?? 'missing'}
  Recipient Phone: ${draft.recipientPhone ?? 'missing'}
  Next step: ${nextStep}
  Is update ? ${isUpdate}
  ${packagesInfo}

  USER MESSAGE: ${message}
EXTRACTION: ${JSON.stringify(extraction)}

  Special logic:
- If isForSomeoneElse is true, require recipientName and recipientPhone.
  - If recipientPhone is missing, ask if the WhatsApp number is the best to reach them; if not, request the correct number.
  - If recipientName is missing and isForSomeoneElse, gently ask for the name.
  - If all details are present, confirm warmly and summarize including recipient info(e.g., "for [recipientName]").
  - For self - bookings, recipientName = name, and confirm phone reachability.
  - Never proceed to confirmation until required fields are filled.`;
        const messages = [{ role: 'system', content: sys }];
        const prunedHistory = this.pruneHistory(history);
        messages.push(...prunedHistory.map(h => ({ role: h.role, content: h.content })));
        messages.push({ role: 'user', content: message });
        try {
            const rsp = await this.openai.chat.completions.create({
                model: this.chatModel,
                messages,
                max_tokens: 220,
                temperature: 0.7,
            });
            const reply = rsp.choices[0].message.content?.trim() ?? "How can I help with your booking?";
            return reply;
        }
        catch (err) {
            this.logger.error('generateBookingReply error', err);
            return "Sorry — I had trouble composing a reply. Can you confirm the details?";
        }
    }
    async getOrCreateDraft(customerId) {
        let draft = await this.prisma.bookingDraft.findUnique({ where: { customerId } });
        if (!draft) {
            let customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
            if (!customer) {
                customer = await this.prisma.customer.create({
                    data: {
                        id: customerId,
                        name: 'Guest',
                        email: null,
                        phone: null,
                    },
                });
            }
            draft = await this.prisma.bookingDraft.create({
                data: { customerId, step: 'service', version: 1 },
            });
        }
        return draft;
    }
    async mergeIntoDraft(customerId, extraction) {
        const existingDraft = await this.prisma.bookingDraft.findUnique({ where: { customerId } });
        const updates = {};
        if (extraction.service)
            updates.service = extraction.service;
        if (extraction.date)
            updates.date = extraction.date;
        if (extraction.time)
            updates.time = extraction.time;
        if (extraction.name)
            updates.name = extraction.name;
        if (extraction.recipientName)
            updates.recipientName = extraction.recipientName;
        if (extraction.recipientPhone) {
            if (this.validatePhoneNumber(extraction.recipientPhone)) {
                updates.recipientPhone = extraction.recipientPhone;
            }
            else {
                this.logger.warn(`Invalid phone number provided: ${extraction.recipientPhone}`);
            }
        }
        if (extraction.isForSomeoneElse !== undefined)
            updates.isForSomeoneElse = extraction.isForSomeoneElse;
        if (Object.keys(updates).length === 0) {
            return existingDraft;
        }
        if (updates.date && updates.time) {
            const normalized = this.normalizeDateTime(updates.date, updates.time);
            if (normalized) {
                updates.date = normalized.dateOnly;
                updates.time = normalized.timeOnly;
                updates.dateTimeIso = normalized.isoUtc;
            }
            else {
                this.logger.warn('Could not normalize date/time in mergeIntoDraft', { date: updates.date, time: updates.time });
            }
        }
        const updated = await this.prisma.bookingDraft.upsert({
            where: { customerId },
            update: {
                ...updates,
                version: { increment: 1 },
                updatedAt: new Date(),
            },
            create: {
                customerId,
                step: 'service',
                version: 1,
                ...updates,
            },
        });
        return updated;
    }
    async checkAndCompleteIfConfirmed(draft, extraction, customerId, bookingsService) {
        const missing = [];
        if (!draft.service)
            missing.push('service');
        if (!draft.date)
            missing.push('date');
        if (!draft.time)
            missing.push('time');
        if (!draft.name)
            missing.push('name');
        if (draft.isForSomeoneElse) {
            if (!draft.recipientName)
                missing.push('recipientName');
            if (!draft.recipientPhone)
                missing.push('recipientPhone');
        }
        else {
            if (!draft.recipientName) {
                draft.recipientName = draft.name;
                this.logger.debug(`Defaulted recipientName to name for self - booking: ${draft.recipientName} `);
                await this.mergeIntoDraft(customerId, { recipientName: draft.name });
            }
            if (!draft.recipientPhone) {
                this.logger.debug('recipientPhone missing for self-booking; assuming WhatsApp number is sufficient.');
            }
        }
        if (missing.length === 0) {
            this.logger.debug('All booking draft fields present (after defaults):', JSON.stringify(draft, null, 2));
            const normalized = this.normalizeDateTime(draft.date, draft.time);
            if (!normalized) {
                this.logger.warn('Unable to normalize date/time in checkAndCompleteIfConfirmed', { date: draft.date, time: draft.time });
                return { action: 'failed', error: 'Unable to parse date/time. Please provide a clear date and time (e.g., "2025-11-20 at 09:00").' };
            }
            const dateObj = new Date(normalized.isoUtc);
            this.logger.debug('Normalized date/time for completion:', normalized);
            const conflict = await this.checkBookingConflicts(customerId, dateObj);
            if (conflict) {
                return { action: 'conflict', message: conflict };
            }
            const avail = await bookingsService.checkAvailability(dateObj, draft.service);
            this.logger.debug('Availability check result:', { available: avail.available, suggestions: avail.suggestions?.length || 0 });
            if (!avail.available) {
                this.logger.warn('Requested slot not available during checkAndCompleteIfConfirmed:', dateObj.toISOString());
                return { action: 'unavailable', suggestions: avail.suggestions || [] };
            }
            try {
                this.logger.debug('Attempting to initiate deposit for booking draft for customerId:', customerId);
                const result = await bookingsService.completeBookingDraft(customerId, dateObj);
                this.logger.debug('Deposit initiated successfully:', JSON.stringify(result, null, 2));
                return { action: 'deposit_initiated', message: result.message, checkoutRequestId: result.checkoutRequestId, paymentId: result.paymentId };
            }
            catch (err) {
                this.logger.error('Deposit initiation failed in checkAndCompleteIfConfirmed', err);
                return { action: 'failed', error: 'There was an issue initiating payment. Please try again or contact support.' };
            }
        }
        else {
            this.logger.warn('Booking draft incomplete; missing fields:', missing);
            return { action: 'incomplete', missing };
        }
    }
    async handleConversation(message, customerId, history = [], bookingsService, retryCount = 0) {
        try {
            return await this.processConversationLogic(message, customerId, history, bookingsService);
        }
        catch (error) {
            return this.attemptRecovery(error, { message, customerId, history, bookingsService, retryCount });
        }
    }
    async attemptRecovery(error, context) {
        if (context.retryCount > 1) {
            this.logger.error('Max retries exceeded in attemptRecovery', error);
            return {
                response: "I'm having a little trouble processing that right now. Could you try saying it differently? 🥺",
                draft: null,
                updatedHistory: context.history
            };
        }
        if (error.code === 'context_length_exceeded' || error.message?.includes('context_length_exceeded') || error.response?.data?.error?.code === 'context_length_exceeded') {
            this.logger.warn('Context length exceeded, retrying with shorter history');
            const shorterHistory = context.history.slice(-2);
            return this.handleConversation(context.message, context.customerId, shorterHistory, context.bookingsService, context.retryCount + 1);
        }
        throw error;
    }
    async processConversationLogic(message, customerId, history = [], bookingsService) {
        message = this.sanitizeInput(message);
        const withinLimit = await this.checkRateLimit(customerId);
        if (!withinLimit) {
            this.logger.warn(`Customer ${customerId} exceeded daily token limit`);
            const limitMsg = "I've reached my daily conversation limit with you. Our team will be in touch tomorrow, or you can contact us directly at " + this.customerCarePhone + ". 💖";
            return { response: limitMsg, draft: null, updatedHistory: [...history, { role: 'user', content: message }, { role: 'assistant', content: limitMsg }] };
        }
        const isFrustrated = await this.detectFrustration(message, history);
        if (isFrustrated && this.escalationService) {
            this.logger.log(`[SENTIMENT] Customer ${customerId} showing frustration - auto-escalating`);
            const sentimentScore = 0.8;
            await this.escalationService.createEscalation(customerId, 'Customer showing signs of frustration (auto-detected)', 'frustration', { sentimentScore, lastMessage: message, historyLength: history.length });
            const escalationMsg = "I sense you might be frustrated, and I'm so sorry! 😔 Let me connect you with a team member who can help you better. Someone will be with you shortly. 💖";
            return { response: escalationMsg, draft: null, updatedHistory: [...history, { role: 'user', content: message }, { role: 'assistant', content: escalationMsg }] };
        }
        let draft = await this.prisma.bookingDraft.findUnique({ where: { customerId } });
        const hasDraft = !!draft;
        const lower = (message || '').toLowerCase();
        const slotKeywords = [
            'available hours', 'available times', 'available slots', 'what times', 'what hours', 'when can i book',
            'when are you free', 'when is available', 'what time is available', 'what hour is available',
            'slots for', 'hours for', 'times for', 'slots tomorrow', 'hours tomorrow', 'times tomorrow',
            'open slots', 'open hours', 'open times', 'free slots', 'free hours', 'free times',
            'can i book tomorrow', 'can i book on', 'can i come on', 'can i come at', 'can i come tomorrow',
            'when can i come', 'when can i book', 'when is open', 'when are you open', 'when is free',
        ];
        const slotIntent = slotKeywords.some(kw => lower.includes(kw));
        const slotIntentRegex = /(available|free|open)\s+(hours|times|slots)(\s+(on|for|tomorrow|today|\d{4}-\d{2}-\d{2}))?/i;
        const slotIntentDetected = slotIntent || slotIntentRegex.test(message);
        if (slotIntentDetected) {
            let dateStr;
            if (/tomorrow/.test(lower)) {
                dateStr = luxon_1.DateTime.now().setZone(this.studioTz).plus({ days: 1 }).toFormat('yyyy-MM-dd');
            }
            else {
                const dateMatch = lower.match(/(\d{4}-\d{2}-\d{2})/);
                if (dateMatch)
                    dateStr = dateMatch[1];
            }
            let service = draft?.service;
            if (!service) {
                if (this.bookingsService) {
                    const allPackages = await this.getCachedPackages();
                    const matched = allPackages.find((p) => lower.includes(p.name.toLowerCase()));
                    if (matched)
                        service = matched.name;
                }
            }
            if (dateStr && service) {
                const slots = await this.bookingsService.getAvailableSlotsForDate(dateStr, service);
                if (slots.length === 0) {
                    const msg = `Sorry, there are no available slots for ${service} on ${dateStr}. Would you like to try another date or package ? `;
                    return { response: msg, draft, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
                }
                const prettySlots = slots.map(s => luxon_1.DateTime.fromISO(s).setZone(this.studioTz).toFormat('HH:mm')).join(', ');
                const msg = `Here are the available times for * ${service} * on * ${dateStr} *: \n${prettySlots} \nLet me know which time works for you!`;
                return { response: msg, draft, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
            }
            if (!service && !dateStr) {
                const msg = `To show available times, please tell me which package you'd like and for which date (e.g., "Studio Classic tomorrow").`;
                return { response: msg, draft, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
            }
            else if (!service) {
                const msg = `Which package would you like to see available times for on ${dateStr}?`;
                return { response: msg, draft, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
            }
            else if (!dateStr) {
                const msg = `For which date would you like to see available times for the *${service}* package? (e.g., "tomorrow" or "2025-11-20")`;
                return { response: msg, draft, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
            }
        }
        const bookingHistoryKeywords = [
            'how many bookings',
            'bookings have i made',
            'my bookings',
            'booking history',
            'how many times have i booked',
            'how many appointments',
            'how many sessions',
            'how many times have i',
        ];
        if (bookingHistoryKeywords.some(kw => lower.includes(kw))) {
            const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
            let count = 0;
            if (customer) {
                count = await this.bookingsService.countBookingsForCustomer({ id: customer.id, whatsappId: customer.whatsappId, phone: customer.phone });
            }
            let name = customer?.name || '';
            if (name && name.toLowerCase().startsWith('whatsapp user'))
                name = '';
            const who = name ? name : (customer?.phone ? customer.phone : 'dear');
            const msg = count === 0
                ? `Hi ${who}, I couldn't find any past bookings for you. Would you like to make your first one? 💖`
                : `Hi ${who}, you've made ${count} booking${count === 1 ? '' : 's'} with us. Thank you for being part of our studio family! Would you like to make another or view your past bookings? 🌸`;
            return { response: msg, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
        }
        const nameNumberKeywords = [
            'what is my name',
            'whats my name',
            "what's my name",
            'what is my number',
            'whats my number',
            "what's my number",
            'who am i',
            'tell me my name',
            'tell me my number',
        ];
        if (nameNumberKeywords.some(kw => lower.includes(kw))) {
            const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
            let name = customer?.name || '';
            if (name && name.toLowerCase().startsWith('whatsapp user'))
                name = '';
            const phone = customer?.phone || customer?.whatsappId || '';
            let msg = '';
            if (name && phone)
                msg = `Your name is ${name} and your number is ${phone}. 😊`;
            else if (name)
                msg = `Your name is ${name}. 😊`;
            else if (phone)
                msg = `Your number is ${phone}. 😊`;
            else
                msg = `Sorry, I couldn't find your name or number. If you need help updating your profile, let me know!`;
            return { response: msg, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
        }
        if (this.escalationService) {
            const isEscalated = await this.escalationService.isCustomerEscalated(customerId);
            if (isEscalated) {
                this.logger.debug(`Skipping AI response for escalated customer ${customerId}`);
                return { response: null, draft: null, updatedHistory: history };
            }
        }
        if (/(talk|speak).*(human|person|agent|representative)/i.test(message) || /(stupid|useless|hate|annoying|bad bot)/i.test(message)) {
            if (this.escalationService) {
                this.logger.log(`[ESCALATION] Customer ${customerId} requested handoff`);
                await this.escalationService.createEscalation(customerId, 'User requested human or expressed frustration');
                const msg = "I understand you'd like to speak with a human agent. I've notified our team, and someone will be with you shortly. In the meantime, I'll pause my responses. 💖";
                return { response: msg, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
            }
        }
        if (/(cancel).*(booking|appointment|session)/i.test(message)) {
            const booking = await this.bookingsService.getLatestConfirmedBooking(customerId);
            if (booking) {
                if (/(yes|sure|confirm|please|do it)/i.test(message)) {
                    await this.bookingsService.cancelBooking(booking.id);
                    const msg = "Your booking has been cancelled. We hope to see you again soon! 💔";
                    return { response: msg, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
                }
                else {
                    const msg = "Are you sure you want to cancel your upcoming booking? Reply 'yes' to confirm.";
                    return { response: msg, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
                }
            }
        }
        const isRescheduleIntent = /(reschedul|change|move).*(booking|appointment|date|time|it)/i.test(message);
        if (isRescheduleIntent || (draft && draft.step === 'reschedule')) {
            this.logger.log(`[RESCHEDULE] Detected intent or active flow for customer ${customerId}`);
            if (!draft || draft.step !== 'reschedule') {
                const booking = await this.bookingsService.getLatestConfirmedBooking(customerId);
                if (!booking) {
                    const msg = "I'd love to help you reschedule, but I can't find a current booking for you. Would you like to make a new one? 💖";
                    return { response: msg, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
                }
                draft = await this.prisma.bookingDraft.upsert({
                    where: { customerId },
                    update: { step: 'reschedule', service: booking.service, date: null, time: null, dateTimeIso: null },
                    create: { customerId, step: 'reschedule', service: booking.service },
                });
                const extraction = await this.extractBookingDetails(message, history);
                if (extraction.date || extraction.time) {
                    draft = await this.mergeIntoDraft(customerId, extraction);
                }
                else {
                    const msg = "I can certainly help with that! 🗓️ When would you like to reschedule your appointment to?";
                    return { response: msg, draft, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
                }
            }
            const extraction = await this.extractBookingDetails(message, history);
            draft = await this.mergeIntoDraft(customerId, extraction);
            if (draft.date && draft.time) {
                const normalized = this.normalizeDateTime(draft.date, draft.time);
                if (normalized) {
                    const newDateObj = new Date(normalized.isoUtc);
                    const conflict = await this.checkBookingConflicts(customerId, newDateObj);
                    if (conflict) {
                        const msg = `I'm sorry, but it looks like you already have a booking around that time. ${conflict} Would you like to try a different time?`;
                        return { response: msg, draft, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
                    }
                    const avail = await this.bookingsService.checkAvailability(newDateObj, draft.service);
                    if (!avail.available) {
                        const suggestions = (avail.suggestions || []).slice(0, 3).map((s) => {
                            const dt = typeof s === 'string' ? luxon_1.DateTime.fromISO(s) : luxon_1.DateTime.fromJSDate(new Date(s));
                            return dt.setZone(this.studioTz).toLocaleString(luxon_1.DateTime.DATETIME_MED);
                        });
                        const msg = `I checked that time, but it's currently unavailable. 😔\nHere are some nearby times that are open: ${suggestions.join(', ')}.\nDo any of those work for you?`;
                        return { response: msg, draft, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
                    }
                    if (/(yes|confirm|do it|sure|okay|fine)/i.test(message)) {
                        const booking = await this.bookingsService.getLatestConfirmedBooking(customerId);
                        if (booking) {
                            await this.bookingsService.updateBooking(booking.id, { dateTime: newDateObj });
                            await this.prisma.bookingDraft.delete({ where: { customerId } });
                            const msg = `All set! ✅ I've rescheduled your appointment to *${luxon_1.DateTime.fromJSDate(newDateObj).setZone(this.studioTz).toFormat('ccc, LLL dd, yyyy HH:mm')}*. See you then! 💖`;
                            return { response: msg, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
                        }
                        else {
                            const msg = "I couldn't find the booking to update. Please contact support. 😓";
                            return { response: msg, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
                        }
                    }
                    else {
                        const prettyDate = luxon_1.DateTime.fromJSDate(newDateObj).setZone(this.studioTz).toFormat('ccc, LLL dd, yyyy HH:mm');
                        const msg = `That time works! 🎉 Shall I move your appointment to *${prettyDate}*?`;
                        return { response: msg, draft, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
                    }
                }
            }
            const msg = "Please let me know the new date and time you'd like. (e.g., 'Next Friday at 2pm') 🗓️";
            return { response: msg, draft, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
        }
        const isReminderAction = ((/(send|give|text|message).*(reminder|message|notification|it)/i.test(message) && /(again|now|right now|immediately|asap|today)/i.test(message)) ||
            /(send|text|message).*(her|him|them).*(reminder|again)/i.test(message) ||
            /(remind|text|message).*(her|him|them).*(now|again|please)/i.test(message));
        if (isReminderAction) {
            this.logger.log(`[SMART ACTION] Manual reminder request detected: "${message}"`);
            const recentBooking = await this.prisma.booking.findFirst({
                where: { customerId },
                orderBy: { createdAt: 'desc' },
                include: { customer: true }
            });
            if (recentBooking) {
                const bookingDt = luxon_1.DateTime.fromJSDate(recentBooking.dateTime).setZone(this.studioTz);
                const formattedDate = bookingDt.toFormat('MMMM d, yyyy');
                const formattedTime = bookingDt.toFormat('h:mm a');
                const recipientName = recentBooking.recipientName || recentBooking.customer?.name || 'there';
                const recipientPhone = recentBooking.recipientPhone || recentBooking.customer?.phone;
                if (recipientPhone) {
                    const reminderMessage = `Hi ${recipientName}! 💖\n\n` +
                        `This is a friendly reminder about your upcoming maternity photoshoot ` +
                        `on *${formattedDate} at ${formattedTime}*. ` +
                        `We're so excited to capture your beautiful moments! ✨📸\n\n` +
                        `If you have any questions, feel free to reach out. See you soon! 🌸`;
                    try {
                        await this.messagesService.sendOutboundMessage(recipientPhone, reminderMessage, 'whatsapp');
                        this.logger.log(`[SMART ACTION] Sent manual reminder to ${recipientPhone} for booking ${recentBooking.id}`);
                        const confirmMsg = `Done! ✅ I've just sent a lovely reminder to ${recipientName} at ${recipientPhone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')}. She should receive it shortly. 💖`;
                        return { response: confirmMsg, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: confirmMsg }] };
                    }
                    catch (err) {
                        this.logger.error('[SMART ACTION] Failed to send manual reminder', err);
                        const errorMsg = `I tried to send the reminder, but encountered an issue. Could you please check the phone number or try again? 💕`;
                        return { response: errorMsg, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: errorMsg }] };
                    }
                }
                else {
                    const noPhoneMsg = `I'd love to send that reminder, but I don't have a phone number for ${recipientName}. Could you provide it? 🌸`;
                    return { response: noPhoneMsg, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: noPhoneMsg }] };
                }
            }
            else {
                const noBookingMsg = `I'd be happy to send a reminder, but I don't see any booking details yet. Would you like to book a session first? 💖`;
                return { response: noBookingMsg, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: noBookingMsg }] };
            }
        }
        if (hasDraft && /(yes|yeah|yep|correct|that'?s? right|it is|yess)/i.test(message) && /(whatsapp|number|phone|reach)/i.test(lower)) {
            this.logger.log(`[SMART EXTRACTION] Detected WhatsApp number confirmation: "${message}"`);
            const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
            if (customer?.phone && !draft.recipientPhone) {
                await this.prisma.bookingDraft.update({
                    where: { customerId },
                    data: { recipientPhone: customer.phone }
                });
                this.logger.log(`[SMART EXTRACTION] Set recipientPhone to customer phone: ${customer.phone}`);
                draft = await this.prisma.bookingDraft.findUnique({ where: { customerId } });
            }
        }
        const businessNameKeywords = ['business name', 'what is the business called', 'who are you', 'company name', 'studio name', 'what is this place', 'what is this business', 'what is your name'];
        if (businessNameKeywords.some((kw) => lower.includes(kw))) {
            const nameResponse = `Our business is called ${this.businessName}. If you have any questions about our services or need assistance, I'm here to help! 😊`;
            const updatedHistory = [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: nameResponse }];
            return { response: nameResponse, draft: null, updatedHistory };
        }
        const locationQueryKeywords = ['location', 'where', 'address', 'located', 'studio location', 'studio address', 'where are you', 'where is the studio', 'studio address'];
        if (locationQueryKeywords.some((kw) => lower.includes(kw))) {
            const locationResponse = `Our business is called ${this.businessName}. ${this.businessLocation}`;
            const updatedHistory = [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: locationResponse }];
            return { response: locationResponse, draft: null, updatedHistory };
        }
        const websiteQueryKeywords = ['website', 'web address', 'url', 'online', 'site', 'web page', 'webpage'];
        if (websiteQueryKeywords.some((kw) => lower.includes(kw))) {
            const websiteResponse = `You can visit our website at ${this.businessWebsite} to learn more about our services and view our portfolio! 🌸✨`;
            const updatedHistory = [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: websiteResponse }];
            return { response: websiteResponse, draft: null, updatedHistory };
        }
        const customerCareKeywords = ['customer care', 'support', 'help line', 'call', 'phone number', 'contact number', 'telephone', 'mobile number', 'reach you'];
        if (customerCareKeywords.some((kw) => lower.includes(kw))) {
            const careResponse = `You can reach our customer care team at ${this.customerCarePhone}. We're here to help! 💖 You can also email us at ${this.customerCareEmail}.`;
            const updatedHistory = [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: careResponse }];
            return { response: careResponse, draft: null, updatedHistory };
        }
        const hoursQueryKeywords = ['hours', 'open', 'when are you open', 'operating hours', 'business hours', 'what time', 'opening hours', 'closing time', 'when do you close'];
        if (hoursQueryKeywords.some((kw) => lower.includes(kw))) {
            const hoursResponse = `We're open ${this.businessHours}. Feel free to visit us or book an appointment during these times! 🕐✨`;
            const updatedHistory = [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: hoursResponse }];
            return { response: hoursResponse, draft: null, updatedHistory };
        }
        const contactDetailsKeywords = ['contact details', 'contact information', 'how to contact', 'get in touch', 'all contact', 'contact info'];
        if (contactDetailsKeywords.some((kw) => lower.includes(kw))) {
            const contactResponse = `Here are our complete contact details:\n\n` +
                `📍 *Location*: ${this.businessLocation.replace(' We look forward to welcoming you! 💖', '')}\n` +
                `📞 *Phone*: ${this.customerCarePhone}\n` +
                `📧 *Email*: ${this.customerCareEmail}\n` +
                `🌐 *Website*: ${this.businessWebsite}\n` +
                `🕐 *Hours*: ${this.businessHours}\n\n` +
                `We look forward to welcoming you! 💖`;
            const updatedHistory = [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: contactResponse }];
            return { response: contactResponse, draft: null, updatedHistory };
        }
        const isBackdropImageRequest = /(backdrop|background|studio set|flower wall|portfolio|show.*(image|photo|picture|portfolio)|see.*(image|photo|picture|example))/i.test(message);
        const isPackageQuery = !isBackdropImageRequest && /(package|price|pricing|cost|how much|offer|photoshoot|shoot|what do you have|what are|show me|tell me about)/i.test(message);
        if (isBackdropImageRequest) {
            this.logger.log(`[BACKDROP REQUEST DETECTED] Message: "${message}" - routing to FAQ flow`);
        }
        const context = {
            aiService: this,
            logger: this.logger,
            history,
            historyLimit: this.historyLimit,
            customerId,
            bookingsService,
            prisma: this.prisma,
            message,
            hasDraft,
            draft
        };
        for (const strategy of this.strategies) {
            if (strategy.canHandle(null, context)) {
                const result = await strategy.generateResponse(message, context);
                if (result)
                    return result;
            }
        }
        let intent = 'other';
        if (/(backdrop|background|studio set|flower wall|portfolio|show.*(image|photo|picture|portfolio)|see.*(image|photo|picture|example))/i.test(message)) {
            intent = 'faq';
            this.logger.log('[INTENT] Classified as FAQ (backdrop/image request) - overriding draft check');
        }
        else if (hasDraft) {
            intent = 'booking';
        }
        else {
            if (/(book|appointment|reserve|schedule|slot|available|tomorrow|next)/.test(lower)) {
                intent = 'booking';
            }
            else if (/\?/.test(message) || /(price|cost|how much|hours|open|service)/.test(lower)) {
                intent = 'faq';
            }
            else {
                try {
                    const classifierMsg = [
                        { role: 'system', content: 'Classify the user intent as "faq", "booking", or "other". Return JSON only: { "intent": "<label>" }' },
                        ...history.slice(-3).map(h => ({ role: h.role, content: h.content })),
                        { role: 'user', content: message },
                    ];
                    const cresp = await this.openai.chat.completions.create({ model: this.chatModel, messages: classifierMsg, max_tokens: 16, temperature: 0.0 });
                    const cret = cresp.choices[0].message.content;
                    const m = cret.match(/"(faq|booking|other)"/) || cret.match(/\{\s*"intent"\s*:\s*"(faq|booking|other)"\s*\}/);
                    if (m)
                        intent = m[1];
                }
                catch (e) {
                    this.logger.warn('intent classifier fallback failed', e);
                }
            }
        }
        if (intent === 'faq' || intent === 'other') {
            const reply = await this.answerFaq(message, history);
            const replyText = typeof reply === 'object' && 'text' in reply ? reply.text : reply;
            return { response: reply, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: replyText }] };
        }
        const bookingStrategy = this.strategies.find(s => s instanceof booking_strategy_1.BookingStrategy);
        if (bookingStrategy) {
            return bookingStrategy.generateResponse(message, { ...context, intent: 'booking' });
        }
        this.logger.log(`[INTENT] Defaulting to FAQ/General for message: "${message}"`);
        const faqResponse = await this.answerFaq(message, history, undefined, customerId);
        await this.trackConversationMetrics(customerId, {
            intent: 'faq',
            duration: 0,
            messagesCount: history.length + 1,
            resolved: true
        });
        return { response: faqResponse, draft: hasDraft ? draft : null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: faqResponse }] };
    }
    async addKnowledge(question, answer) {
        await this.prisma.knowledgeBase.create({
            data: {
                question,
                answer,
                category: 'general',
                embedding: await this.generateEmbedding(question + ' ' + answer),
            },
        });
        if (!this.index) {
            this.logger.debug('addKnowledge: Pinecone index not available, saved to DB only.');
            return;
        }
        try {
            await this.index.upsert([{
                    id: `kb-${Date.now()}`,
                    values: await this.generateEmbedding(question + ' ' + answer),
                    metadata: { question, answer },
                }]);
            this.logger.log(`addKnowledge: added to Pinecone: ${question}`);
        }
        catch (err) {
            this.logger.warn('addKnowledge: failed to upsert to Pinecone (saved to DB only).', err);
        }
    }
    async processAiRequest(data) {
        const answer = await this.answerFaq(data.question, []);
        return answer;
    }
    async generateResponse(message, customerId, bookingsService, history, extractedBooking, faqContext) {
        const start = Date.now();
        let prediction = '';
        let error = undefined;
        let actual = undefined;
        let confidence = undefined;
        let modelVersion = extractModelVersion(this.chatModel);
        try {
            const result = await this.handleConversation(message, customerId, history || [], bookingsService);
            if (typeof result.response === 'object' && result.response !== null && 'text' in result.response) {
                prediction = result.response.text;
            }
            else if (typeof result.response === 'string') {
                prediction = result.response;
            }
            else {
                prediction = '';
            }
            return prediction;
        }
        catch (err) {
            error = err?.message || String(err);
            throw err;
        }
        finally {
            try {
                await this.prisma.aiPrediction.create({
                    data: {
                        input: message,
                        prediction,
                        actual,
                        confidence,
                        responseTime: Date.now() - start,
                        error,
                        userFeedback: null,
                        modelVersion,
                    },
                });
            }
            catch (logErr) {
                this.logger.warn('Failed to log AiPrediction', logErr);
            }
        }
    }
    async extractStepBasedBookingDetails(message, currentStep, history) {
        return { nextStep: currentStep };
    }
    async generateStepBasedBookingResponse(message, customerId, bookingsService, history = [], draft, bookingResult) {
        const result = await this.handleConversation(message, customerId, history, bookingsService);
        if (typeof result.response === 'object' && result.response !== null && 'text' in result.response) {
            return result.response.text;
        }
        else if (typeof result.response === 'string') {
            return result.response;
        }
        return '';
    }
    async generateGeneralResponse(message, customerId, bookingsService, history) {
        const result = await this.handleConversation(message, customerId, history || [], bookingsService);
        if (typeof result.response === 'object' && result.response !== null && 'text' in result.response) {
            return result.response.text;
        }
        else if (typeof result.response === 'string') {
            return result.response;
        }
        return '';
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => bookings_service_1.BookingsService))),
    __param(2, (0, common_1.Optional)()),
    __param(3, (0, common_1.Optional)()),
    __param(4, (0, common_1.Optional)()),
    __param(5, (0, bull_1.InjectQueue)('aiQueue')),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        bookings_service_1.BookingsService,
        messages_service_1.MessagesService,
        escalation_service_1.EscalationService, Object])
], AiService);
//# sourceMappingURL=ai.service.js.map