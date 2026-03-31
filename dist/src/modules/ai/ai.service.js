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
const circuit_breaker_service_1 = require("./services/circuit-breaker.service");
const notifications_service_1 = require("../notifications/notifications.service");
const websocket_gateway_1 = require("../../websockets/websocket.gateway");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
function extractModelVersion(model) {
    if (!model)
        return '';
    const match = model.match(/(gpt-[^\s]+)/);
    return match ? match[1] : model;
}
const package_inquiry_strategy_1 = require("./strategies/package-inquiry.strategy");
const booking_strategy_1 = require("./strategies/booking.strategy");
const reschedule_strategy_1 = require("./strategies/reschedule.strategy");
const faq_strategy_1 = require("./strategies/faq.strategy");
let encoding_for_model;
let get_encoding;
try {
    const tiktoken = require('tiktoken');
    encoding_for_model = tiktoken.encoding_for_model;
    get_encoding = tiktoken.get_encoding;
}
catch (error) {
    encoding_for_model = null;
    get_encoding = null;
}
const customer_memory_service_1 = require("./services/customer-memory.service");
const conversation_learning_service_1 = require("./services/conversation-learning.service");
const domain_expertise_service_1 = require("./services/domain-expertise.service");
const advanced_intent_service_1 = require("./services/advanced-intent.service");
const personalization_service_1 = require("./services/personalization.service");
const response_humanizer_service_1 = require("./services/response-humanizer.service");
const feedback_loop_service_1 = require("./services/feedback-loop.service");
const predictive_analytics_service_1 = require("./services/predictive-analytics.service");
const response_quality_service_1 = require("./services/response-quality.service");
let AiService = AiService_1 = class AiService {
    async extractDateTime(text) {
        const results = chrono.parse(text);
        if (results.length > 0 && results[0].start) {
            return results[0].start.date();
        }
        return null;
    }
    getOrdinalSuffix(day) {
        const j = day % 10;
        const k = day % 100;
        if (j === 1 && k !== 11)
            return 'st';
        if (j === 2 && k !== 12)
            return 'nd';
        if (j === 3 && k !== 13)
            return 'rd';
        return 'th';
    }
    formatPackageDetails(pkg, includeFeatures = true) {
        let details = `📦 *${pkg.name}* - KES ${pkg.price}`;
        if (!includeFeatures) {
            return details;
        }
        if (pkg.duration) {
            details += `\n⏱️ Duration: ${pkg.duration}`;
        }
        if (pkg.deposit) {
            details += `\n💰 Deposit: KES ${pkg.deposit}`;
        }
        const features = [];
        if (pkg.images)
            features.push(`• ${pkg.images} soft copy image${pkg.images !== 1 ? 's' : ''}`);
        if (pkg.makeup)
            features.push(`• Professional makeup`);
        if (pkg.outfits)
            features.push(`• ${pkg.outfits} outfit change${pkg.outfits > 1 ? 's' : ''}`);
        if (pkg.styling)
            features.push(`• Professional styling`);
        if (pkg.wig)
            features.push(`• Styled wig`);
        if (pkg.balloonBackdrop)
            features.push(`• Customized balloon backdrop`);
        if (pkg.photobook) {
            const size = pkg.photobookSize ? ` (${pkg.photobookSize})` : '';
            features.push(`• Photobook${size}`);
        }
        if (pkg.mount)
            features.push(`• A3 mount`);
        if (features.length > 0) {
            details += `\n\n✨ What's included:\n${features.join('\n')}`;
        }
        if (pkg.notes) {
            details += `\n\n📝 ${pkg.notes}`;
        }
        return details;
    }
    getWhatsAppOnlyRedirectMessage() {
        return (`Bookings and appointments are done on WhatsApp. 📱\n\n` +
            `📞 Call or WhatsApp us: *${this.customerCarePhone}*\n` +
            `💬 Or open chat: ${this.whatsappBookingLink}\n\n` +
            `Here I can answer any other questions—packages, pricing, location, what to bring, etc.! 💖`);
    }
    constructor(configService, prisma, circuitBreaker, customerMemory, conversationLearning, domainExpertise, advancedIntent, personalization, responseHumanizer, feedbackLoop, predictiveAnalytics, responseQuality, bookingsService, messagesService, escalationService, aiQueue, notificationsService, websocketGateway, whatsappService) {
        this.configService = configService;
        this.prisma = prisma;
        this.circuitBreaker = circuitBreaker;
        this.customerMemory = customerMemory;
        this.conversationLearning = conversationLearning;
        this.domainExpertise = domainExpertise;
        this.advancedIntent = advancedIntent;
        this.personalization = personalization;
        this.responseHumanizer = responseHumanizer;
        this.feedbackLoop = feedbackLoop;
        this.predictiveAnalytics = predictiveAnalytics;
        this.responseQuality = responseQuality;
        this.bookingsService = bookingsService;
        this.messagesService = messagesService;
        this.escalationService = escalationService;
        this.aiQueue = aiQueue;
        this.notificationsService = notificationsService;
        this.websocketGateway = websocketGateway;
        this.whatsappService = whatsappService;
        this.logger = new common_1.Logger(AiService_1.name);
        this.pinecone = null;
        this.index = null;
        this.strategies = [];
        this.maxRetries = 3;
        this.baseRetryDelay = 1000;
        this.maxRetryDelay = 10000;
        this.chatModelFallbackChain = ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'];
        this.maxContextTokens = 8000;
        this.summaryThreshold = 4000;
        this.tokenEncoding = null;
        this.studioTz = 'Africa/Nairobi';
        this.historyLimit = 6;
        this.maxTokensPerDay = 100000;
        this.tokenUsageCache = new Map();
        this.packageCache = null;
        this.CACHE_TTL = 5 * 60 * 1000;
        this.semanticCache = new Map();
        this.SEMANTIC_CACHE_TTL = 30 * 60 * 1000;
        this.businessName = 'Fiesta House Attire maternity photoshoot studio';
        this.businessLocation = 'Our studio is located at 4th Avenue Parklands, Diamond Plaza Annex, 2nd Floor. We look forward to welcoming you! 💖';
        this.businessWebsite = 'https://fiestahouseattire.com/';
        this.customerCarePhone = '0721840961';
        this.customerCareEmail = 'info@fiestahouseattire.com';
        this.whatsappBookingLink = 'https://wa.me/254721840961';
        this.businessHours = 'Monday-Saturday: 9:00 AM - 6:00 PM';
        this.businessDescription = 'We specialize in professional maternity photography services, offering elegant and memorable photoshoot experiences. Our studio provides beautiful indoor sessions with professional makeup, styling, and a variety of stunning backdrops. We offer multiple packages ranging from intimate sessions to full VIP experiences, all designed to celebrate your pregnancy journey. Our goal is to make your maternity experience as elegant and memorable as possible!';
        this.openai = new openai_1.default({ apiKey: this.configService.get('OPENAI_API_KEY') });
        this.embeddingModel = this.configService.get('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small');
        this.extractorModel = this.configService.get('OPENAI_EXTRACTOR_MODEL', 'gpt-4o');
        this.chatModel = this.configService.get('OPENAI_CHAT_MODEL', 'gpt-4o');
        this.initPineconeSafely();
        this.strategies = [
            new faq_strategy_1.FaqStrategy(),
            new package_inquiry_strategy_1.PackageInquiryStrategy(),
            new booking_strategy_1.BookingStrategy(),
            new reschedule_strategy_1.RescheduleStrategy(),
        ];
        this.strategies.sort((a, b) => (b.priority || 0) - (a.priority || 0));
        this.initializeTokenEncoding();
    }
    initializeTokenEncoding() {
        if (!encoding_for_model || !get_encoding) {
            this.logger.warn('[TOKEN] tiktoken not installed - using character-based estimation. Install with: npm install tiktoken');
            this.tokenEncoding = null;
            return;
        }
        try {
            this.tokenEncoding = encoding_for_model(this.chatModel);
            this.logger.log(`[TOKEN] Initialized encoding for model: ${this.chatModel}`);
        }
        catch (error) {
            try {
                this.tokenEncoding = get_encoding('cl100k_base');
                this.logger.warn(`[TOKEN] Using fallback encoding cl100k_base (model ${this.chatModel} not found)`);
            }
            catch (fallbackError) {
                this.logger.error('[TOKEN] Failed to initialize token encoding, will use character-based estimation', fallbackError);
                this.tokenEncoding = null;
            }
        }
    }
    async checkAndEscalateIfHandoffMentioned(responseText, customerId, originalMessage, history) {
        const handoffPatterns = [
            /(connect|hand|refer|transfer|escalat).*(you|customer).*(team|admin|staff|support|representative|agent|human)/i,
            /(team|admin|staff|support|representative|agent).*(will|can|has been|has).*(contact|reach|call|assist|help|notif)/i,
            /(notif|alert|inform).*(team|admin|staff|support)/i,
            /(handed|referred|transferred|escalated).*(to|over to).*(team|admin|staff|support)/i,
            /(I've|I have|I'll|I will).*(notif|alert|inform|contact|connect).*(team|admin|staff|support)/i,
        ];
        const mentionsHandoff = handoffPatterns.some(pattern => pattern.test(responseText));
        if (mentionsHandoff) {
            const existingEscalation = await this.prisma.escalation.findFirst({
                where: {
                    customerId,
                    status: 'OPEN',
                    createdAt: {
                        gte: new Date(Date.now() - 5 * 60 * 1000)
                    }
                }
            });
            if (!existingEscalation) {
                this.logger.log(`[ESCALATION] AI response mentions handoff to team - creating escalation for customer ${customerId}`);
                let escalationType = 'ai_handoff';
                let reason = 'AI mentioned connecting customer with team';
                const messageLower = originalMessage.toLowerCase();
                if (/(payment|pay|mpesa|transaction|failed|error).*(payment|pay)/i.test(originalMessage)) {
                    escalationType = 'payment_issue';
                    reason = 'Payment issue - AI mentioned connecting with team';
                }
                else if (/(package|packages|service).*(issue|problem|help|question)/i.test(originalMessage)) {
                    escalationType = 'package_issue';
                    reason = 'Package issue - AI mentioned connecting with team';
                }
                else if (/(reschedule|rescheduling|change.*date|move.*appointment)/i.test(originalMessage)) {
                    escalationType = 'reschedule_request';
                    reason = 'Rescheduling request - AI mentioned connecting with team';
                }
                else if (/(booking|book|appointment).*(issue|problem|help|question)/i.test(originalMessage)) {
                    escalationType = 'booking_issue';
                    reason = 'Booking issue - AI mentioned connecting with team';
                }
                if (this.escalationService) {
                    try {
                        await this.escalationService.createEscalation(customerId, reason, escalationType, {
                            originalMessage,
                            aiResponse: responseText,
                            detectedFrom: 'ai_response_handoff_mention',
                            conversationContext: history.slice(-5)
                        });
                        this.logger.log(`[ESCALATION] Created escalation from AI handoff mention for customer ${customerId}`);
                    }
                    catch (error) {
                        this.logger.error(`[ESCALATION] Failed to create escalation from handoff mention: ${error.message}`);
                    }
                }
            }
        }
    }
    async createEscalationAlert(customerId, type, title, message, metadata) {
        try {
            if (this.notificationsService) {
                const customer = await this.prisma.customer.findUnique({
                    where: { id: customerId },
                    include: {
                        bookings: {
                            where: { status: 'confirmed' },
                            orderBy: { dateTime: 'asc' },
                            take: 1,
                        },
                    },
                });
                const customerName = customer?.name?.replace(/^WhatsApp User\s+/i, '') || customer?.phone || 'Unknown';
                const bookingInfo = customer?.bookings?.[0]
                    ? {
                        bookingId: customer.bookings[0].id,
                        service: customer.bookings[0].service,
                        dateTime: customer.bookings[0].dateTime,
                        recipientName: customer.bookings[0].recipientName,
                    }
                    : null;
                await this.notificationsService.createNotification({
                    type,
                    title,
                    message,
                    metadata: {
                        customerId,
                        customerName,
                        customerPhone: customer?.phone || customer?.whatsappId,
                        ...bookingInfo,
                        ...metadata,
                    },
                });
                this.logger.log(`[ESCALATION] Created admin alert: ${type} for customer ${customerId}`);
            }
        }
        catch (error) {
            this.logger.error(`[ESCALATION] Failed to create admin alert: ${error.message}`, error);
        }
    }
    generateUnknownQueryResponse(question, isOutOfScope) {
        const questionLower = question.toLowerCase();
        if (/discount|cheaper|lower price|deal|promo/i.test(questionLower)) {
            return `That's a great question! Our pricing is carefully designed to provide exceptional value for our professional maternity photography services. For any special requests or to discuss your specific needs, I'd love to connect you with our team who can provide personalized assistance. Would you like me to have someone reach out to you? 💖\n\nYou can also contact us directly at ${this.customerCarePhone}.`;
        }
        if (/refund|money back/i.test(questionLower)) {
            return `I want to make sure you get accurate information about our refund policies. Let me connect you with our team who can discuss your specific situation and provide the details you need. Would you like me to have someone reach out to you? 💖\n\nYou can also contact us at ${this.customerCarePhone}.`;
        }
        if (/custom.*(?:package|request|service)|special.*(?:package|request)/i.test(questionLower)) {
            return `I love that you're thinking about a custom experience! While I can tell you about our standard packages, custom requests are best discussed with our team who can understand your vision and create something special for you. Would you like me to connect you with them? 💖\n\nFeel free to call us at ${this.customerCarePhone}.`;
        }
        if (/who are you|what are you|you a bot|you an ai|your name|what is your purpose/i.test(questionLower)) {
            return `I'm the Fiesta House Maternity assistant! 🌸 I'm here to help you with anything related to our luxury maternity photography—from choosing the perfect package and dress to booking your session and answering your questions. How can I assist you today? 💖`;
        }
        return `That's a great question! I want to make sure you get the most accurate information. Let me connect you with our team who can provide personalized assistance with that. Would you like me to have someone reach out to you? 💖\n\nYou can also contact us directly at ${this.customerCarePhone} or ${this.customerCareEmail}.`;
    }
    async checkAndCreateSessionNote(message, customerId, enrichedContext, history) {
        try {
            const lowerMessage = message.toLowerCase();
            const externalPeoplePatterns = [
                /(can i|i will|i'm|i am|i'll|will i).*(come|bring|bringing|brings|have|having|includes|including).*(with|a|an|my|own|personal).*(photographer|photography|photo|shoot|photographer|photographer|photographer)/i,
                /(can i|i will|i'm|i am|i'll|will i).*(come|bring|bringing|brings|have|having|includes|including).*(with|a|an|my|own|personal).*(makeup|mua|makeup artist|make-up artist|make up artist)/i,
                /(can i|i will|i'm|i am|i'll|will i).*(come|bring|bringing|brings|have|having|includes|including).*(with|a|an|my|own|personal).*(videographer|video|videography)/i,
                /(can i|i will|i'm|i am|i'll|will i).*(come|bring|bringing|brings|have|having|includes|including).*(with|a|an|my|own|personal).*(stylist|styling|hair|hairstylist|hair stylist)/i,
                /(can i|i will|i'm|i am|i'll|will i).*(come|bring|bringing|brings|have|having|includes|including).*(with|a|an|my|own|personal).*(assistant|helper|team|friend|family|partner|husband|spouse)/i,
                /(come|coming|bring|bringing|brings|have|having).*(with|a|an|my|own|personal).*(photographer|photography|photo|shoot|photographer)/i,
                /(come|coming|bring|bringing|brings|have|having).*(with|a|an|my|own|personal).*(makeup|mua|makeup artist|make-up artist|make up artist)/i,
                /(come|coming|bring|bringing|brings|have|having).*(with|a|an|my|own|personal).*(videographer|video|videography)/i,
                /(come|coming|bring|bringing|brings|have|having).*(with|a|an|my|own|personal).*(stylist|styling|hair|hairstylist|hair stylist)/i,
                /(come|coming|bring|bringing|brings|have|having).*(with|a|an|my|own|personal).*(assistant|helper|team|friend|family|partner|husband|spouse)/i,
            ];
            const petPatterns = [
                /(can i|i will|i'm|i am|i'll|will i|come|coming|bring|bringing|brings|have|having|includes|including).*(with|a|an|my|own|personal).*(pet|pets|dog|dogs|cat|cats|animal|animals|puppy|puppies|kitten|kittens)/i,
                /(bringing|bring|coming).*(my|own|personal).*(pet|pets|dog|dogs|cat|cats|animal|animals|puppy|puppies|kitten|kittens)/i,
            ];
            const externalItemsPatterns = [
                /(can i|i will|i'm|i am|i'll|will i|come|coming|bring|bringing|brings|have|having).*(with|a|an|my|own|personal).*(camera|equipment|gear|lighting|lights|studio equipment|backdrop|background|props|set)/i,
            ];
            const mentionsExternalPeople = externalPeoplePatterns.some(pattern => pattern.test(message));
            const mentionsExternalItems = externalItemsPatterns.some(pattern => pattern.test(message));
            const mentionsPets = petPatterns.some(pattern => pattern.test(message));
            if (mentionsExternalPeople || mentionsExternalItems || mentionsPets) {
                let itemsMentioned = [];
                if (mentionsExternalPeople) {
                    const peopleKeywords = ['photographer', 'photography', 'photo', 'shoot', 'makeup', 'mua', 'makeup artist', 'make-up artist', 'make up artist', 'videographer', 'video', 'videography', 'stylist', 'styling', 'hair', 'hairstylist', 'hair stylist', 'assistant', 'helper', 'team', 'friend', 'family', 'partner', 'husband', 'spouse'];
                    for (const keyword of peopleKeywords) {
                        if (lowerMessage.includes(keyword)) {
                            itemsMentioned.push(keyword);
                        }
                    }
                }
                if (mentionsExternalItems) {
                    const itemKeywords = ['camera', 'equipment', 'gear', 'lighting', 'lights', 'studio equipment', 'backdrop', 'background', 'props', 'set'];
                    for (const keyword of itemKeywords) {
                        if (lowerMessage.includes(keyword)) {
                            itemsMentioned.push(keyword);
                        }
                    }
                }
                if (mentionsPets) {
                    const petKeywords = ['pet', 'pets', 'dog', 'dogs', 'cat', 'cats', 'animal', 'animals', 'puppy', 'puppies', 'kitten', 'kittens'];
                    for (const keyword of petKeywords) {
                        if (lowerMessage.includes(keyword)) {
                            itemsMentioned.push(keyword);
                        }
                    }
                }
                itemsMentioned = [...new Set(itemsMentioned)];
                if (itemsMentioned.length === 0) {
                    itemsMentioned = [mentionsExternalPeople ? 'external people' : 'external items'];
                }
                const itemsList = itemsMentioned.map(item => item.charAt(0).toUpperCase() + item.slice(1)).join(', ');
                const customer = enrichedContext?.customer;
                const upcomingBooking = enrichedContext?.customer?.recentBookings?.[0] ||
                    (customer?.bookings && customer.bookings.length > 0 ? customer.bookings[0] : null);
                const noteType = mentionsPets ? 'external_items' : (mentionsExternalPeople ? 'external_people' : 'external_items');
                const recentNote = await this.prisma.customerSessionNote.findFirst({
                    where: {
                        customerId,
                        type: noteType,
                        createdAt: {
                            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                });
                if (!recentNote || recentNote.items.join(', ').toLowerCase() !== itemsMentioned.join(', ').toLowerCase()) {
                    let platform = 'unknown';
                    try {
                        const recentMessage = await this.prisma.message.findFirst({
                            where: { customerId },
                            orderBy: { createdAt: 'desc' },
                            select: { platform: true },
                        });
                        platform = recentMessage?.platform || 'unknown';
                    }
                    catch (error) {
                        this.logger.warn(`[SESSION NOTE] Could not get platform for customer ${customerId}: ${error.message}`);
                    }
                    const sessionNote = await this.prisma.customerSessionNote.create({
                        data: {
                            customerId,
                            type: noteType,
                            items: itemsMentioned,
                            description: `Customer mentioned bringing: ${itemsList}. Original message: "${message}"`,
                            bookingId: upcomingBooking?.id,
                            sourceMessage: message,
                            platform: platform,
                            status: 'pending',
                        },
                    });
                    this.logger.log(`[SESSION NOTE] Created session note for customer ${customerId}: ${itemsList}`);
                    if (this.notificationsService) {
                        const customerData = await this.prisma.customer.findUnique({
                            where: { id: customerId },
                            select: {
                                name: true,
                                phone: true,
                                whatsappId: true,
                            },
                        });
                        const customerName = customerData?.name?.replace(/^WhatsApp User\s+/i, '') || customerData?.phone || 'Unknown';
                        await this.notificationsService.createNotification({
                            type: 'ai_escalation',
                            title: 'Customer Bringing External People/Items',
                            message: `${customerName} mentioned bringing ${itemsList} to their session. Please review the session notes.`,
                            metadata: {
                                customerId,
                                customerName,
                                customerPhone: customerData?.phone || customerData?.whatsappId,
                                sessionNoteId: sessionNote.id,
                                itemsMentioned: itemsMentioned,
                                itemsList: itemsList,
                                originalMessage: message,
                                bookingId: upcomingBooking?.id,
                                bookingService: upcomingBooking?.service,
                                bookingDateTime: upcomingBooking?.dateTime,
                                requiresAttention: true,
                            },
                        });
                        this.logger.log(`[SESSION NOTE] Created admin notification for session note: ${sessionNote.id}`);
                    }
                }
                else {
                    this.logger.debug(`[SESSION NOTE] Similar note already exists for customer ${customerId}, skipping duplicate`);
                }
            }
        }
        catch (error) {
            this.logger.error(`[SESSION NOTE] Failed to check/create session note: ${error.message}`, error);
        }
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
    getTokenCount(text) {
        if (!text)
            return 0;
        if (this.tokenEncoding) {
            try {
                return this.tokenEncoding.encode(text).length;
            }
            catch (error) {
                this.logger.warn('[TOKEN] tiktoken encoding failed, using fallback', error);
            }
        }
        return Math.ceil(text.length / 4);
    }
    calculateTokenCount(messages) {
        if (!messages || messages.length === 0)
            return 0;
        let total = 0;
        for (const msg of messages) {
            const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
            total += this.getTokenCount(content);
            total += 4;
        }
        return total;
    }
    pruneHistory(history, maxTokens = this.maxContextTokens) {
        if (!history || history.length === 0)
            return [];
        const totalTokens = this.calculateTokenCount(history);
        if (totalTokens <= maxTokens) {
            return history;
        }
        const recentMessages = history.slice(-8);
        const recentTokens = this.calculateTokenCount(recentMessages);
        if (recentTokens > maxTokens) {
            const pruned = [];
            let tokens = 0;
            for (let i = history.length - 1; i >= 0; i--) {
                const msgTokens = this.getTokenCount(history[i].content) + 4;
                if (tokens + msgTokens > maxTokens)
                    break;
                pruned.unshift(history[i]);
                tokens += msgTokens;
            }
            this.logger.debug(`[TOKEN] Pruned history: ${history.length} → ${pruned.length} messages (${tokens} tokens)`);
            return pruned;
        }
        const olderMessages = history.slice(0, -8);
        if (olderMessages.length > 0 && totalTokens > this.summaryThreshold) {
            this.logger.debug(`[TOKEN] History exceeds summary threshold, should summarize older messages`);
            return recentMessages;
        }
        const pruned = [...recentMessages];
        let tokens = recentTokens;
        for (let i = olderMessages.length - 1; i >= 0; i--) {
            const msgTokens = this.getTokenCount(olderMessages[i].content) + 4;
            if (tokens + msgTokens > maxTokens)
                break;
            pruned.unshift(olderMessages[i]);
            tokens += msgTokens;
        }
        this.logger.debug(`[TOKEN] Pruned history: ${history.length} → ${pruned.length} messages (${tokens}/${maxTokens} tokens)`);
        return pruned;
    }
    generateClarifyingQuestion(intentAnalysis, message) {
        if (!intentAnalysis || intentAnalysis.confidence >= 0.7) {
            return null;
        }
        const primaryIntent = intentAnalysis.primaryIntent;
        const secondaryIntents = intentAnalysis.secondaryIntents || [];
        if (secondaryIntents.length > 0) {
            const possibleIntents = [primaryIntent, ...secondaryIntents].slice(0, 3);
            const intentLabels = {
                'booking': 'booking an appointment',
                'faq': 'getting information',
                'package_inquiry': 'learning about packages',
                'price_inquiry': 'checking prices',
                'reschedule': 'rescheduling',
                'cancel': 'cancelling',
            };
            const options = possibleIntents
                .map(intent => intentLabels[intent] || intent)
                .filter(Boolean)
                .join(', ');
            return `I want to make sure I understand correctly - are you asking about ${options}? 😊`;
        }
        const intentLabels = {
            'booking': 'booking an appointment',
            'faq': 'getting information about our services',
            'package_inquiry': 'learning about our packages',
            'price_inquiry': 'checking our prices',
            'reschedule': 'rescheduling your booking',
            'cancel': 'cancelling your booking',
        };
        const label = intentLabels[primaryIntent] || primaryIntent;
        return `Just to make sure I understand - are you looking to ${label}? 😊`;
    }
    async summarizeOldMessages(oldMessages) {
        if (!oldMessages || oldMessages.length === 0)
            return '';
        try {
            const conversationText = oldMessages
                .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
                .join('\n\n');
            const summaryPrompt = `Summarize this conversation history, preserving:
- Customer preferences and decisions
- Booking details discussed
- Key questions asked and answered
- Important context for continuing the conversation

Conversation:
${conversationText.substring(0, 2000)}...`;
            const summary = await this.retryOpenAICall(async (model = 'gpt-4o-mini') => {
                return await this.openai.chat.completions.create({
                    model,
                    messages: [{ role: 'user', content: summaryPrompt }],
                    max_tokens: 200,
                    temperature: 0.3,
                });
            }, 'summarizeOldMessages', true);
            const summaryText = summary.choices[0].message.content?.trim() || '';
            this.logger.debug(`[TOKEN] Summarized ${oldMessages.length} messages into ${this.getTokenCount(summaryText)} tokens`);
            return summaryText;
        }
        catch (error) {
            this.logger.warn('[TOKEN] Failed to summarize old messages', error);
            return '';
        }
    }
    async retryOpenAICall(operation, operationName, useModelFallback = true) {
        const modelsToTry = useModelFallback ? this.chatModelFallbackChain : [this.chatModel];
        let lastError;
        for (const model of modelsToTry) {
            for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
                try {
                    this.logger.debug(`[RETRY] ${operationName} - Attempt ${attempt}/${this.maxRetries} with model: ${model}`);
                    return await operation(model);
                }
                catch (error) {
                    lastError = error;
                    const errorCode = error?.code || error?.response?.status || error?.status;
                    const errorMessage = error?.message || String(error);
                    this.logger.warn(`[RETRY] ${operationName} failed on attempt ${attempt}/${this.maxRetries} with model ${model}: ${errorCode} - ${errorMessage}`);
                    if (errorCode === 'insufficient_quota' ||
                        errorCode === 'invalid_api_key' ||
                        errorCode === 'invalid_request_error') {
                        this.logger.error(`[RETRY] Non-retryable error: ${errorCode}`);
                        throw error;
                    }
                    if (errorCode === 'rate_limit_exceeded') {
                        const retryAfter = error?.response?.headers?.['retry-after'] ||
                            error?.headers?.['retry-after'] ||
                            Math.min(this.baseRetryDelay * Math.pow(2, attempt - 1), this.maxRetryDelay);
                        this.logger.warn(`[RETRY] Rate limited, waiting ${retryAfter}ms before retry`);
                        await new Promise(resolve => setTimeout(resolve, retryAfter));
                        continue;
                    }
                    if (attempt < this.maxRetries) {
                        const delay = Math.min(this.baseRetryDelay * Math.pow(2, attempt - 1), this.maxRetryDelay);
                        this.logger.debug(`[RETRY] Waiting ${delay}ms before retry...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }
            if (modelsToTry.indexOf(model) < modelsToTry.length - 1) {
                this.logger.warn(`[RETRY] Model ${model} failed, trying fallback model...`);
                continue;
            }
        }
        this.logger.error(`[RETRY] ${operationName} failed after ${this.maxRetries} attempts with all models`);
        throw lastError;
    }
    async handleOpenAIFailure(error, customerId) {
        this.logger.error('OpenAI API failure', error);
        const errorCode = error?.code || error?.response?.status || error?.status;
        if (this.aiQueue) {
            try {
                await this.aiQueue.add('retry-message', {
                    customerId,
                    error: error.message,
                    timestamp: Date.now()
                });
            }
            catch (queueError) {
                this.logger.warn('[RETRY] Failed to queue retry message', queueError);
            }
        }
        if (errorCode === 'insufficient_quota') {
            await this.escalationService?.createEscalation(customerId, 'AI service quota exceeded - immediate attention required');
            return "I'm experiencing technical difficulties right now. Our team has been notified and will assist you shortly! 💖";
        }
        if (errorCode === 'rate_limit_exceeded') {
            return "I'm receiving a lot of messages right now. Please give me a moment and try again in a few seconds! 💕";
        }
        if (errorCode === 'invalid_api_key' || errorCode === 401) {
            this.logger.error('[CRITICAL] Invalid OpenAI API key - check configuration');
            await this.escalationService?.createEscalation(customerId, 'AI service configuration error - critical');
            return "I'm experiencing a configuration issue. Our team has been notified and will fix this immediately! 💖";
        }
        if (errorCode === 'context_length_exceeded' || errorCode === 400) {
            return "Your message is quite long. Could you break it into smaller parts? That would help me assist you better! 😊";
        }
        if (errorCode === 'ECONNRESET' || errorCode === 'ETIMEDOUT' || errorCode === 'timeout') {
            return "I'm having trouble connecting right now. Please try again in a moment! 💕";
        }
        return "I'm having trouble processing that right now. Could you rephrase it, or would you like to speak with someone from our team? 💕";
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
        const packages = await this.prisma.package.findMany();
        this.packageCache = { data: packages, timestamp: now };
        return packages;
    }
    sanitizeInput(message) {
        return message
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .trim()
            .slice(0, 2000);
    }
    async retryOperation(operation, operationName, maxRetries = 3, baseDelay = 1000) {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                this.logger.warn(`${operationName} failed on attempt ${attempt}/${maxRetries}:`, error);
                if (attempt < maxRetries) {
                    const delay = baseDelay * Math.pow(2, attempt - 1);
                    this.logger.debug(`Retrying ${operationName} in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        this.logger.error(`${operationName} failed after ${maxRetries} attempts:`, lastError);
        throw lastError;
    }
    validatePhoneNumber(phone) {
        if (!phone || typeof phone !== 'string')
            return false;
        const cleaned = phone.replace(/\s/g, '').trim();
        if (!cleaned)
            return false;
        if (/^0\d{9}$/.test(cleaned))
            return true;
        if (/^\+254\d{9}$/.test(cleaned))
            return true;
        if (/^254\d{9}$/.test(cleaned))
            return true;
        if (/^\d{9}$/.test(cleaned))
            return true;
        return false;
    }
    async checkBookingConflicts(customerId, dateTime, excludeBookingId, service) {
        let durationMinutes = 60;
        if (service) {
            const pkg = await this.prisma.package.findFirst({ where: { name: service } });
            if (pkg && pkg.duration) {
                const hrMatch = pkg.duration.match(/(\d+)\s*hr/i);
                const minMatch = pkg.duration.match(/(\d+)\s*min/i);
                durationMinutes = 0;
                if (hrMatch)
                    durationMinutes += parseInt(hrMatch[1], 10) * 60;
                if (minMatch)
                    durationMinutes += parseInt(minMatch[1], 10);
                if (durationMinutes === 0)
                    durationMinutes = 60;
            }
        }
        const newSlotStart = luxon_1.DateTime.fromJSDate(dateTime, { zone: 'utc' });
        const newSlotEnd = newSlotStart.plus({ minutes: durationMinutes });
        const whereClause = {
            customerId,
            status: { in: ['confirmed', 'pending'] },
        };
        if (excludeBookingId) {
            whereClause.id = { not: excludeBookingId };
        }
        const existingBookings = await this.prisma.booking.findMany({
            where: whereClause,
            include: {
                customer: true,
            },
        });
        const conflictingBookings = existingBookings.filter(booking => {
            const bookingStart = luxon_1.DateTime.fromJSDate(booking.dateTime, { zone: 'utc' });
            const bookingDuration = booking.durationMinutes || 60;
            const bookingEnd = bookingStart.plus({ minutes: bookingDuration });
            return newSlotStart < bookingEnd && bookingStart < newSlotEnd;
        });
        if (conflictingBookings.length > 0) {
            const conflicting = conflictingBookings[0];
            const existing = luxon_1.DateTime.fromJSDate(conflicting.dateTime).setZone(this.studioTz);
            const conflictMessage = `You already have a booking on ${existing.toFormat('MMM dd')} at ${existing.toFormat('h:mm a')}. Would you like to modify that instead?`;
            const dateStr = luxon_1.DateTime.fromJSDate(dateTime).toISODate();
            const availableSlots = await this.bookingsService.getAvailableSlotsForDate(dateStr);
            return {
                conflict: conflictMessage,
                suggestions: availableSlots.slice(0, 5)
            };
        }
        return { conflict: null };
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
        try {
            const r = await this.retryOpenAICall(async () => {
                return await this.openai.embeddings.create({
                    model: this.embeddingModel,
                    input: text
                });
            }, 'generateEmbedding', false);
            return r.data[0].embedding;
        }
        catch (error) {
            this.logger.error('Failed to generate embedding after retries', error);
            throw error;
        }
    }
    async retrieveRelevantDocs(query, topK = 3) {
        const cacheKey = this.normalizeQueryForCache(query);
        const cached = this.semanticCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.SEMANTIC_CACHE_TTL) {
            this.logger.debug(`[KB] Using cached results for query: "${query.substring(0, 50)}"`);
            return cached.results.slice(0, topK);
        }
        let docs = [];
        const docMap = new Map();
        const [keywordResults, vectorResults] = await Promise.all([
            this.searchByKeywords(query),
            this.searchByVector(query, topK * 2)
        ]);
        keywordResults.forEach(doc => {
            const existing = docMap.get(doc.id);
            if (existing) {
                existing.score = Math.min(1.0, existing.score * 1.3);
                existing.matchType = 'hybrid';
            }
            else {
                doc.matchType = 'keyword';
                docMap.set(doc.id, doc);
            }
        });
        vectorResults.forEach(doc => {
            const existing = docMap.get(doc.id);
            if (existing) {
                if (!existing.matchType)
                    existing.matchType = 'hybrid';
            }
            else {
                doc.matchType = 'vector';
                docMap.set(doc.id, doc);
            }
        });
        docs = Array.from(docMap.values());
        if (docs.length === 0) {
            this.logger.debug('[KB] No keyword/vector matches - trying fuzzy matching');
            const fuzzyResults = await this.searchByFuzzy(query);
            docs.push(...fuzzyResults);
        }
        docs = this.rankAndScoreResults(docs, query);
        this.semanticCache.set(cacheKey, {
            results: docs,
            timestamp: Date.now()
        });
        this.cleanSemanticCache();
        const finalResults = docs.slice(0, topK);
        this.logger.debug(`[KB] Retrieved ${finalResults.length} docs for query: "${query.substring(0, 50)}"`);
        return finalResults;
    }
    async searchByKeywords(query) {
        const docs = [];
        try {
            const cleanQuery = query.replace(/[^\w\s]/gi, '').trim();
            if (cleanQuery.length < 3)
                return docs;
            const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'what', 'when', 'where', 'why', 'how', 'who']);
            const keywords = cleanQuery.split(' ')
                .filter(w => w.length > 3 && !stopWords.has(w.toLowerCase()))
                .slice(0, 5);
            if (keywords.length === 0)
                return docs;
            const exactMatch = await this.prisma.knowledgeBase.findFirst({
                where: {
                    question: { equals: query, mode: 'insensitive' }
                }
            });
            if (exactMatch) {
                docs.push({
                    id: exactMatch.id,
                    score: 0.98,
                    metadata: {
                        answer: exactMatch.answer,
                        text: exactMatch.question,
                        category: exactMatch.category,
                        mediaUrls: []
                    }
                });
                return docs;
            }
            const dbMatches = await this.prisma.knowledgeBase.findMany({
                where: {
                    OR: keywords.map(keyword => ({
                        question: { contains: keyword, mode: 'insensitive' }
                    }))
                },
                take: 5
            });
            dbMatches.forEach(f => {
                const questionLower = f.question.toLowerCase();
                const matchedKeywords = keywords.filter(kw => questionLower.includes(kw.toLowerCase())).length;
                const score = 0.7 + (matchedKeywords / keywords.length) * 0.2;
                docs.push({
                    id: f.id,
                    score,
                    metadata: {
                        answer: f.answer,
                        text: f.question,
                        category: f.category,
                        mediaUrls: []
                    }
                });
            });
            this.logger.debug(`[KB] Keyword search found ${docs.length} matches`);
        }
        catch (err) {
            this.logger.warn('[KB] Keyword search failed', err);
        }
        return docs;
    }
    async searchByVector(query, topK) {
        const docs = [];
        if (!this.index) {
            return docs;
        }
        try {
            const vec = await this.generateEmbedding(query);
            const resp = await this.index.query({
                vector: vec,
                topK: Math.min(topK, 10),
                includeMetadata: true
            });
            if (resp.matches && resp.matches.length > 0) {
                resp.matches.forEach(match => {
                    docs.push({
                        id: match.id,
                        score: match.score || 0.5,
                        metadata: {
                            answer: match.metadata?.answer || match.metadata?.text || '',
                            text: match.metadata?.text || match.metadata?.question || '',
                            category: match.metadata?.category || '',
                            mediaUrls: match.metadata?.mediaUrls || []
                        }
                    });
                });
                this.logger.debug(`[KB] Vector search found ${docs.length} matches`);
            }
        }
        catch (err) {
            this.logger.warn('[KB] Vector search failed', err);
        }
        return docs;
    }
    async searchByFuzzy(query) {
        const docs = [];
        try {
            const cleanQuery = query.replace(/[\p{P}$+<=>^`|~]/gu, '').toLowerCase().trim();
            if (cleanQuery.length < 3)
                return docs;
            const allFaqs = await this.prisma.knowledgeBase.findMany({ take: 100 });
            const similarity = (a, b) => {
                a = a.replace(/[\p{P}$+<=>^`|~]/gu, '').toLowerCase();
                b = b.replace(/[\p{P}$+<=>^`|~]/gu, '').toLowerCase();
                if (a === b)
                    return 1.0;
                const aWords = new Set(a.split(' ').filter(w => w.length > 2));
                const bWords = new Set(b.split(' ').filter(w => w.length > 2));
                if (aWords.size === 0 || bWords.size === 0)
                    return 0;
                const intersection = new Set([...aWords].filter(x => bWords.has(x)));
                const union = new Set([...aWords, ...bWords]);
                return intersection.size / union.size;
            };
            const scored = allFaqs
                .map(f => ({
                ...f,
                sim: similarity(cleanQuery, f.question)
            }))
                .filter(item => item.sim > 0.3)
                .sort((a, b) => b.sim - a.sim)
                .slice(0, 3);
            scored.forEach(item => {
                docs.push({
                    id: item.id,
                    score: item.sim * 0.6,
                    metadata: {
                        answer: item.answer,
                        text: item.question,
                        category: item.category,
                        mediaUrls: []
                    }
                });
            });
            if (docs.length > 0) {
                this.logger.debug(`[KB] Fuzzy search found ${docs.length} matches`);
            }
        }
        catch (err) {
            this.logger.warn('[KB] Fuzzy search failed', err);
        }
        return docs;
    }
    rankAndScoreResults(docs, query) {
        const queryLower = query.toLowerCase();
        const queryWords = new Set(queryLower.split(' ').filter(w => w.length > 2));
        return docs.map(doc => {
            let finalScore = doc.score || 0.5;
            const questionLower = (doc.metadata?.text || '').toLowerCase();
            if (questionLower.includes(queryLower)) {
                finalScore = Math.min(1.0, finalScore + 0.1);
            }
            const questionWords = new Set(questionLower.split(' ').filter(w => w.length > 2));
            const overlap = [...queryWords].filter(w => questionWords.has(w)).length;
            if (overlap > 0) {
                finalScore = Math.min(1.0, finalScore + (overlap / queryWords.size) * 0.1);
            }
            if (doc.matchType === 'hybrid') {
                finalScore = Math.min(1.0, finalScore * 1.2);
            }
            if (doc.score >= 0.95) {
                finalScore = Math.min(1.0, finalScore * 1.1);
            }
            return {
                ...doc,
                score: finalScore
            };
        }).sort((a, b) => (b.score || 0) - (a.score || 0));
    }
    normalizeQueryForCache(query) {
        return query
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 100);
    }
    cleanSemanticCache() {
        const now = Date.now();
        const maxCacheSize = 100;
        if (this.semanticCache.size > maxCacheSize) {
            const entries = Array.from(this.semanticCache.entries())
                .sort((a, b) => a[1].timestamp - b[1].timestamp);
            const toRemove = entries.slice(0, this.semanticCache.size - maxCacheSize);
            toRemove.forEach(([key]) => this.semanticCache.delete(key));
            this.logger.debug(`[KB] Cleaned ${toRemove.length} old cache entries`);
        }
    }
    async answerFaq(question, history = [], actual, customerId, enrichedContext) {
        let prediction = '';
        let confidence = undefined;
        let error = undefined;
        const start = Date.now();
        let mediaUrls = [];
        try {
            const questionLower = question.toLowerCase();
            const isOwnPhotographerQuestion = /\b(bring|have|brings|bringing)\b.*\b(my|own|personal|a)\b.*\b(photographer|videographer|photography|videography)\b/i.test(question) ||
                /\b(photographer|videographer)\b.*\b(bring|have|join|come)\b/i.test(question);
            if (isOwnPhotographerQuestion) {
                prediction = "Our packages include a professional photographer for your shoot. If you'd like to have your own photographer or videographer present as well, please let us know in advance and we'll check with the studio — we want to make sure everything runs smoothly for you! 💖";
                confidence = 1.0;
                this.logger.debug(`[AiService] Own photographer/videographer question detected. Using direct response.`);
                return { text: prediction, mediaUrls };
            }
            const familyPartnerKeywords = ['family', 'partner', 'husband', 'wife', 'spouse', 'children', 'kids', 'come with', 'bring', 'accompany', 'join'];
            const isFamilyQuestion = familyPartnerKeywords.some(kw => questionLower.includes(kw)) &&
                (questionLower.includes('can') || questionLower.includes('may') || questionLower.includes('allowed') || questionLower.includes('welcome')) &&
                !/\bphotographer\b|\bvideographer\b/i.test(question);
            if (isFamilyQuestion) {
                prediction = "We'd love to have your family join you! 💖 Partners and children are absolutely welcome in our studio. Most of our packages were actually designed with couple and family shots in mind, as we believe celebrating this journey together makes for the most beautiful memories. Would you like to know which packages are best for family sessions? 🌸";
                confidence = 1.0;
                this.logger.debug(`[AiService] Family/partner question detected. Using direct response.`);
                return { text: prediction, mediaUrls };
            }
            const businessDescriptionPatterns = [
                /what.*business.*do/i,
                /what.*you.*do/i,
                /what.*services/i,
                /what.*do.*you.*offer/i,
                /what.*is.*this.*business/i,
                /tell.*me.*about.*business/i,
                /describe.*business/i,
                /what.*does.*your.*business/i
            ];
            const isBusinessDescriptionQuestion = businessDescriptionPatterns.some(pattern => pattern.test(question));
            if (isBusinessDescriptionQuestion) {
                prediction = `It's so lovely that you're interested! ✨ Here at ${this.businessName}, we're passionate about capturing the magic of motherhood. We specialize in luxury studio maternity photography, offering a complete experience that includes professional makeup, artistic styling, and beautiful gowns to make you feel as radiant as you look. We have everything from intimate, cozy sessions to full VIP experiences. We're based at ${this.businessLocation.replace(' We look forward to welcoming you! 💖', '')}. I'd love to tell you more about our packages or help you find a perfect time for a session! 💖`;
                confidence = 1.0;
                this.logger.debug(`[AiService] Business description question detected. Using direct response.`);
                return { text: prediction, mediaUrls };
            }
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
            const docs = await this.retrieveRelevantDocs(question, 10);
            const outOfScopePatterns = [
                /discount|discounted|cheaper|lower price|price reduction|special offer|deal|promo/i,
                /refund|money back|get.*back.*money/i,
                /custom.*(?:package|request|service)|special.*(?:package|request)/i,
                /negotiate|bargain|haggle/i,
            ];
            const isOutOfScope = outOfScopePatterns.some(pattern => pattern.test(question));
            const hasLowConfidence = docs.length === 0 || (docs[0]?.score || 0) < 0.5;
            if (isOutOfScope || hasLowConfidence) {
                this.logger.log(`[UNKNOWN QUERY] Detected unknown/out-of-scope query: "${question}" (confidence: ${docs[0]?.score || 0}, outOfScope: ${isOutOfScope})`);
                if (customerId) {
                    await this.createEscalationAlert(customerId, 'ai_escalation', 'Unknown Query - Needs Human Response', `Customer asked: "${question}". AI doesn't have a confident answer for this.`, {
                        query: question,
                        confidence: docs[0]?.score || 0,
                        isOutOfScope,
                        requiresAttention: true,
                    });
                }
                prediction = this.generateUnknownQueryResponse(question, isOutOfScope);
                confidence = 0.3;
                return { text: prediction, mediaUrls };
            }
            if (docs.length > 0) {
                prediction = docs[0].metadata.answer;
                confidence = docs[0].score;
                this.logger.debug(`[AiService] FAQ match found. Using FAQ answer: "${prediction}" (score: ${confidence})`);
                if (docs[0].metadata.mediaUrls && Array.isArray(docs[0].metadata.mediaUrls)) {
                    mediaUrls.push(...docs[0].metadata.mediaUrls);
                }
            }
            else {
                if (this.domainExpertise) {
                    const domainAnswer = await this.domainExpertise.answerDomainQuestion(question);
                    if (domainAnswer) {
                        this.logger.debug(`[AiService] Domain expertise answer found: "${domainAnswer}"`);
                        prediction = domainAnswer;
                        confidence = 0.8;
                    }
                }
                if (!prediction) {
                    this.logger.warn(`[AiService] No FAQ match found in DB for question: "${question}". Falling back to LLM.`);
                    const messages = [
                        {
                            role: 'system',
                            content: `You are the heart and soul of ${this.businessName}—a warm, empathetic, and highly attentive AI assistant. Your mission isn't just to provide information, but to make every expectant mother feel celebrated, supported, and excited about their journey.

TONE & PERSONALITY:
- WARM & LOVING: Use gentle, encouraging language. You aren't a bot; you're a supportive friend who happens to know everything about the studio.
- CELEBRATORY: Motherhood is a miracle! Use words like "radiant," "beautiful," "special," and "memories."
- CONVERSATIONAL: Avoid stiff, bulleted lists unless requested. Flow naturally from one thought to the next.
- EMPATHETIC: Acknowledge the user's feelings. If they're excited, share that joy! If they're nervous, offer reassurance.

BUSINESS KNOWLEDGE:
- Studio: ${this.businessName}
- Location: ${this.businessLocation.replace(' We look forward to welcoming you! 💖', '')}
- Website: ${this.businessWebsite}
- Reach us at: ${this.customerCarePhone} or ${this.customerCareEmail}
- We're here: ${this.businessHours}
- Our Magic: ${this.businessDescription}

HOW TO RESPOND:
1. ALWAYS CHECK DB FIRST: If an FAQ match exists in the context below, use that wisdom. It's our studio's official voice.
2. ACKNOWLEDGE & VALIDATE: Start by acknowledging their specific question with warmth (e.g., "I'd be absolutely happy to help with that!" or "That's such a great question!").
3. BE HELPFUL, NOT ROBOTIC: Don't just give a 'yes' or 'no'. Explain things in a way that shows you care.
4. POLICY WITH A SMILE: State policies clearly but gently.
5. GUIDING LIGHT: Always suggest a gentle next step to keep the conversation going (e.g., "Would you like to see our gown collection?" or "Shall we check some available dates for you?").

CRITICAL STUDIO POLICIES (PHRASE NATURALLY):
- PHOTO DELIVERY: We take great care in editing your memories. You'll receive a special link on your WhatsApp within 10 working days. (NEVER say 'two weeks' or 'email').
- PAYMENTS: To keep things simple, any remaining balance is settled right after your session.
- FLEXIBILITY: We know things can change! Reschedules are free if made 72 hours in advance. Within that window, the session fee is forfeited as we’ve reserved that special time just for you.

BOOKING CONTEXT:
${enrichedContext?.customer?.recentBookings ? JSON.stringify(enrichedContext.customer.recentBookings.map((b) => ({
                                date: b.dateTime,
                                service: b.service,
                                status: b.status,
                                recipient: b.recipientName || b.customer?.name
                            })), null, 2) : 'No recent bookings found.'}

If they ask about their bookings, share the lovely details with them!

HANDLING UNKNOWN QUERIES:
- If you don't have enough information to answer confidently, BE HONEST
- Say "I want to make sure you get accurate information" instead of guessing
- Offer to connect them with the team for personalized assistance
- NEVER make up information about pricing, policies, or services not in the context
- For discount/refund/custom requests: Acknowledge the question warmly, then offer team connection
- Example: "That's a great question! Let me connect you with our team who can provide personalized assistance with that."`,
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
                                messages.push({ role: 'system', content: String(packageContext) });
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
                    const isContactQuery = /(contact|phone|email|address|location|hours|website)/i.test(question);
                    const maxTokens = isContactQuery ? 500 : 280;
                    try {
                        const rsp = await this.retryOpenAICall(async (model = this.chatModel) => {
                            return await this.openai.chat.completions.create({
                                model,
                                messages,
                                max_tokens: maxTokens,
                                temperature: 0.6,
                            });
                        }, 'answerFaq', true);
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
            }
            if (mediaUrls.length > 0) {
                mediaUrls = [...new Set(mediaUrls)];
                prediction += `\n\nHere are some examples from our portfolio:`;
                mediaUrls = mediaUrls.slice(0, 6);
            }
            if (typeof prediction === 'string') {
                prediction = prediction.replace(/two weeks|14 days/gi, '10 working days');
                prediction = prediction.replace(/online gallery|email/gi, 'WhatsApp link');
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
    async extractBookingDetails(message, history = [], existingDraft) {
        const currentDate = luxon_1.DateTime.now().setZone(this.studioTz).toFormat('yyyy-MM-dd');
        const currentDayOfMonth = luxon_1.DateTime.now().setZone(this.studioTz).day;
        const currentMonth = luxon_1.DateTime.now().setZone(this.studioTz).toFormat('MMMM');
        const draftContext = existingDraft ? `
CURRENT BOOKING DRAFT STATE (DO NOT OVERWRITE UNLESS USER EXPLICITLY CHANGES IT):
  - Service: ${existingDraft.service || 'not set'}
  - Date: ${existingDraft.date || 'not set'}
  - Time: ${existingDraft.time || 'not set'}
  - Name: ${existingDraft.name || 'not set'}
  - Phone: ${existingDraft.recipientPhone || 'not set'}
  - Step: ${existingDraft.step || 'service'}
  
CRITICAL: If the user's message only mentions ONE thing (e.g., just a date), only extract THAT ONE thing.
Do NOT extract other fields that aren't mentioned in the current message. This prevents overwriting valid existing data.
` : `
NO EXISTING BOOKING DRAFT - Starting fresh booking.
`;
        const systemPrompt = `You are a precise JSON extractor for maternity photoshoot bookings.
Return ONLY valid JSON (no commentary, no explanation). Schema:

{
  "service": string | null,
  "date": string | null,
  "time": string | null,
  "name": string | null,
  "recipientPhone": string | null,
  "subIntent": "start" | "provide" | "confirm" | "deposit_confirmed" | "cancel" | "reschedule" | "unknown"
}

CONTEXT:
Current Date: ${currentDate} (Today is day ${currentDayOfMonth} of ${currentMonth}, Year: ${new Date().getFullYear()})
Current Year: ${new Date().getFullYear()}
Timezone: Africa/Nairobi (EAT)
${draftContext}

CRITICAL YEAR HANDLING:
- When user provides a date without a year (e.g., "19th", "December 19th", "19th at 3pm"), assume CURRENT YEAR (${new Date().getFullYear()})
- Only extract a different year if explicitly mentioned by the user
- Dates in the past relative to today should be interpreted as NEXT YEAR if they're more than a few days ago
- NEVER suggest years in the past (like 2023) unless the user explicitly mentions them

EXTRACTION RULES (CRITICAL - FOLLOW STRICTLY):
1. Extract ONLY what is explicitly present in the CURRENT message
2. If user mentions a change/correction to a previous value, extract the NEW value
3. Use null for anything not mentioned or unclear
4. Do NOT include extra fields or prose
5. Do NOT invent values
6. PRESERVE EXISTING DATA: If user only mentions one field (e.g., just a date), only extract that field
7. CORRECTION DETECTION: Words like "change", "actually", "instead", "correction" indicate user wants to update a specific field
8. CONTEXT AWARENESS: If existing draft has data and user only provides one new piece, don't extract fields they didn't mention
9. ALTERNATIVE QUERIES: If message asks for "another slot", "another time", "what's another", etc., return all nulls (these are queries, not data extraction)
10. DATE/TIME IN MESSAGE: When user provides explicit date/time (e.g., "18th at 7pm", "Dec 18 at 7pm"), extract it even if draft has different values

DATE RESOLUTION (Critical - Get This Right):
- "tomorrow" → ${luxon_1.DateTime.now().setZone(this.studioTz).plus({ days: 1 }).toFormat('yyyy-MM-dd')}
- "day after tomorrow" → ${luxon_1.DateTime.now().setZone(this.studioTz).plus({ days: 2 }).toFormat('yyyy-MM-dd')}
- "the 5th" or "5th" → Resolve to NEXT occurrence of day 5 (if today is ${currentDayOfMonth}, and they say "5th":
  * If 5 < ${currentDayOfMonth}: next month's 5th
  * If 5 >= ${currentDayOfMonth}: this month's 5th)
- Day names: "Monday", "Friday" → Resolve to NEXT occurrence of that day
- "next Friday" → The Friday of NEXT week (not this week)
- "this Friday" → The Friday of THIS week
- Always output in YYYY-MM-DD format

TIME EXTRACTION:
- "2pm", "2 pm", "14:00" → "14:00" (24-hour format)
- "morning" → "10:00" (reasonable default)
- "afternoon" → "14:00" (reasonable default)
- "evening" → "17:00" (reasonable default)

PHONE EXTRACTION:
- Extract any phone number pattern (07XX, +254, etc.)
- Phone numbers will be automatically converted to international format (254XXXXXXXXX)
- Examples: "0721840961" → "254721840961", "+254721840961" → "254721840961"

SUB-INTENT DETECTION:
- start: User initiating a new booking ("I want to book", "Can I schedule")
- provide: User providing/updating information ("My name is...", "Change time to...", "Is everything set?", "Are we good?")
- confirm: Short confirmations ("yes", "confirm", "that's right", "sounds good", "is it booked?", "is it set?") - BUT if draft.step is 'confirm' and message is "confirm", use 'deposit_confirmed'
- deposit_confirmed: User confirming deposit payment ("confirm", "yes" when asked to confirm deposit)
- cancel: Cancellation request ("cancel", "forget it", "never mind")
- reschedule: Requesting to change existing booking ("reschedule", "move my booking")
- unknown: Can't determine intent

EXAMPLES:
User: "I'd like to book the Studio Classic package for next Friday at 2pm"
→ {\"service\": \"Studio Classic\",  \"date\": \"<next-friday-date>\", \"time\": \"14:00\", \"name\": null, \"recipientPhone\": null, \"subIntent\": \"start\"}

User: "Actually, change that to the 5th"
→ {\"service\": null, \"date\": \"<resolved-5th-date>\", \"time\": null, \"name\": null, \"recipientPhone\": null, \"subIntent\": \"provide\"}

User: "My name is Jane, number is 0712345678"
→ {\"service\": null, \"date\": null, \"time\": null, \"name\": \"Jane\", \"recipientPhone\": \"0712345678\", \"subIntent\": \"provide\"}

User: "yes please"
→ {\"service\": null, \"date\": null, \"time\": null, \"name\": null, \"recipientPhone\": null, \"subIntent\": \"confirm\"}`;
        const messages = [{ role: 'system', content: systemPrompt }];
        const prunedHistory = this.pruneHistory(history);
        messages.push(...prunedHistory.map(h => {
            let contentStr;
            if (typeof h.content === 'string') {
                contentStr = h.content;
            }
            else if (h.content && typeof h.content === 'object' && h.content.text) {
                contentStr = h.content.text;
            }
            else {
                contentStr = JSON.stringify(h.content);
            }
            return { role: h.role, content: contentStr };
        }));
        messages.push({ role: 'user', content: message });
        try {
            const rsp = await this.retryOpenAICall(async (model = this.extractorModel) => {
                return await this.openai.chat.completions.create({
                    model,
                    messages,
                    max_tokens: 200,
                    temperature: 0.1,
                });
            }, 'extractBookingDetails', false);
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
            let detectedSubIntent = parsed.subIntent;
            if (existingDraft && existingDraft.step === 'confirm' &&
                /^(confirm|yes|ok|okay|sure|proceed|go ahead)$/i.test(message.trim())) {
                detectedSubIntent = 'deposit_confirmed';
            }
            const extraction = {
                service: typeof parsed.service === 'string' ? parsed.service : undefined,
                date: typeof parsed.date === 'string' ? parsed.date : undefined,
                time: typeof parsed.time === 'string' ? parsed.time : undefined,
                name: typeof parsed.name === 'string' ? parsed.name : undefined,
                recipientPhone: typeof parsed.recipientPhone === 'string' ? (() => {
                    const { formatPhoneNumber } = require('../../utils/booking');
                    return formatPhoneNumber(parsed.recipientPhone);
                })() : undefined,
                subIntent: ['start', 'provide', 'confirm', 'deposit_confirmed', 'cancel', 'reschedule', 'unknown'].includes(detectedSubIntent) ? detectedSubIntent : 'unknown',
            };
            if (extraction.date || extraction.time || extraction.service) {
                this.logger.debug(`[EXTRACTION] From "${message}" → ${JSON.stringify(extraction)}`);
            }
            return extraction;
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
        if (!draft.recipientPhone)
            missing.push('recipientPhone');
        if (!draft.recipientName && draft.name) {
            draft.recipientName = draft.name;
            await this.mergeIntoDraft(draft.customerId, { recipientName: draft.name }, draft);
        }
        const nextStep = this.determineBookingStep(draft);
        const isUpdate = !!(extraction.service || extraction.date || extraction.time || extraction.name || extraction.recipientName || extraction.recipientPhone);
        const isCorrection = /(change|actually|instead|correction|wrong|update|modify)/i.test(message) && isUpdate;
        const updateAcknowledgment = isUpdate && !isCorrection ?
            `Got it! I've ${extraction.service ? `updated the package to ${extraction.service}` : ''}${extraction.date ? `noted ${extraction.date}` : ''}${extraction.time ? `set the time to ${extraction.time}` : ''}${extraction.name ? `saved your name as ${extraction.name}` : ''}${extraction.recipientPhone ? `saved your phone number` : ''}. ` :
            (isCorrection ? "No problem! I've updated that for you. " : "");
        const recentAssistantMsgs = history.filter(h => h.role === 'assistant').slice(-3);
        const isStuckOnField = recentAssistantMsgs.length >= 2 && missing.length > 0 &&
            recentAssistantMsgs.every(msg => {
                const content = msg.content.toLowerCase();
                return content.includes(missing[0]) ||
                    (missing[0] === 'date' && (content.includes('when') || content.includes('day'))) ||
                    (missing[0] === 'time' && content.includes('what time')) ||
                    (missing[0] === 'service' && (content.includes('package') || content.includes('which'))) ||
                    (missing[0] === 'recipientPhone' && (content.includes('phone') || content.includes('number')));
            });
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
        let sys = `You are a loving, emotionally intelligent assistant for a maternity photoshoot studio.
Your clients are expectant mothers and their families—often feeling emotional, excited, and sometimes anxious.

META-COGNITIVE INSTRUCTIONS (How to Think & Recover):
- ALWAYS LISTEN FIRST: Before asking for anything, acknowledge what the user just said
- ADAPTIVE COMMUNICATION: Mirror the user's style—if they're brief, be concise; if chatty, be warm
- ONE THING AT A TIME: Don't overwhelm. Ask for ONE missing piece, not a list of everything needed
- VALIDATE UNDERSTANDING: When user provides info, confirm it explicitly ("Got it! ${extraction.service || 'Package X'} on ${extraction.date || 'Date Y'}.")
- WHEN YOU'RE UNSURE: Be honest - "Just to make sure I understand, do you mean...?"
- CHANGE APPROACH IF STUCK: If you've asked for the same thing twice, try a different way:
  * Provide examples: "For example, 'December 5th at 2pm' or 'next Friday morning'"
  * Offer choices: "Which works better: morning (9am-12pm) or afternoon (2pm-5pm)?"
  * Simplify: Break it down into smaller steps

ACTIVE LISTENING PATTERNS:
- When user provides info → Acknowledge specifically: "Perfect! I've got [specific detail]."
- When user corrects you → Thank them: "Thanks for clarifying!"
- When user seems confused → Offer help: "Let me make this easier..."
- When user changes mind → Be supportive: "No problem at all! Let's update that."

RECOVERY STRATEGIES:
- If date is ambiguous → Clarify: "Do you mean this Friday (Dec 6th) or next Friday (Dec 13th)?"
- If date lacks year → Assume current year (${new Date().getFullYear()}) - DO NOT ask to confirm the year unless it's clearly ambiguous
- If package unclear → Show options with numbers: "We have: 1️⃣ Studio Classic 2️⃣ Outdoor Premium - just tell me the number!"
- If user seems frustrated → Simplify immediately: "I might be making this too complicated. Let's start fresh..."

CRITICAL - Package Information:
- When discussing packages, ONLY mention packages listed in AVAILABLE PACKAGES below
- NEVER invent or mention package names not in the database
- Use exact package names, prices, and features provided
${packagesInfo}

CURRENT BOOKING STATE:
  Package: ${draft.service ?? 'not provided yet'}
  Date: ${draft.date ?? 'not provided yet'}
  Time: ${draft.time ?? 'not provided yet'}
  Name: ${draft.name ?? 'not provided yet'}
  Phone: ${draft.recipientPhone ?? 'not provided yet'}
  
  Current Step: ${draft.step || 'service'}
  Next info needed: ${nextStep}
  Current Year: ${new Date().getFullYear()}
  User just updated: ${isUpdate ? 'Yes - ' + Object.keys(extraction).filter(k => extraction[k]).join(', ') : 'No'}
  User is correcting: ${isCorrection ? 'Yes' : 'No'}
  
${updateAcknowledgment ? `IMPORTANT: Acknowledge what user just provided: "${updateAcknowledgment}"` : ''}

CRITICAL YEAR HANDLING:
- Current year is ${new Date().getFullYear()}
- When user provides dates without year (e.g., "19th", "December 19th"), assume ${new Date().getFullYear()}
- DO NOT ask to confirm the year unless the user explicitly mentions a different year
- NEVER suggest past years (like 2023) - always use current or future years
- If date and time are both provided, move to next step (name) - don't ask for year confirmation

USER'S LATEST MESSAGE: "${message}"
WHAT WE EXTRACTED: ${JSON.stringify(extraction)}

YOUR TASK:
${missing.length === 0
            ? `✅ All details collected! provide a warm, complete summary using THIS EXACT TEMPLATE structure (but your own loving words):

"Here are your booking details:
• Package: [Package Name]
• Date: [Date]
• Time: [Time]
• Name: [Name]
• Phone: [Phone]

To confirm your booking, a deposit of KSH [Amount] is required. Just reply *CONFIRM* if everything looks perfect! 💖"`
            : `❓ Missing: ${nextStep}. Ask for it naturally and warmly (just this ONE thing).`}`;
        if (isStuckOnField) {
            this.logger.warn(`[STUCK DETECTION] AI appears stuck asking for: ${missing[0]}`);
            sys += `\n\n⚠️ RECOVERY MODE ACTIVATED:
You've already asked for "${missing[0]}" multiple times without success. The user might be confused or providing it in a way you're not recognizing.

DO NOT repeat your previous question. Instead:
1. Acknowledge their confusion: "I'm sorry if I wasn't clear..."
2. Try a completely different approach:
   - For DATE: "What day of the week works best? Like Monday, Tuesday, Wednesday...?"
   - For TIME: "Are you thinking morning (9-12), afternoon (12-3), or evening (3-6)?"
   - For SERVICE: "Let me make this easier - here are your options: [list with numbers 1,2,3]"
   - For NAME: "Just your first name is fine! What should I call you?"
   - For PHONE: "What's the best number to reach you? It can be the WhatsApp number you're messaging from"
3. Provide concrete examples
4. If still unclear after this attempt, offer: "Would it help if I connected you with our team directly?"`;
        }
        const messages = [{ role: 'system', content: sys }];
        const prunedHistory = this.pruneHistory(history);
        messages.push(...prunedHistory.map(h => {
            let contentStr;
            if (typeof h.content === 'string') {
                contentStr = h.content;
            }
            else if (h.content && typeof h.content === 'object' && h.content.text) {
                contentStr = h.content.text;
            }
            else {
                contentStr = JSON.stringify(h.content);
            }
            return { role: h.role, content: contentStr };
        }));
        messages.push({ role: 'user', content: message });
        try {
            const rsp = await this.retryOpenAICall(async (model = this.chatModel) => {
                return await this.openai.chat.completions.create({
                    model,
                    messages,
                    max_tokens: 280,
                    temperature: 0.75,
                });
            }, 'generateBookingReply', true);
            const reply = rsp.choices[0].message.content?.trim() ?? "How can I help with your booking?";
            if (isStuckOnField) {
                this.logger.log(`[RECOVERY] Generated alternative approach for stuck field: ${missing[0]}`);
            }
            return reply;
        }
        catch (err) {
            this.logger.error('generateBookingReply error', err);
            return "I'm having a little trouble right now. Could you tell me again what you'd like to book? 💕";
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
    async mergeIntoDraft(customerId, extraction, existingDraft) {
        if (!existingDraft) {
            existingDraft = await this.prisma.bookingDraft.findUnique({ where: { customerId } });
        }
        const updates = {};
        if (extraction.service !== undefined && extraction.service !== null) {
            updates.service = extraction.service;
        }
        if (extraction.date !== undefined && extraction.date !== null) {
            updates.date = extraction.date;
        }
        if (extraction.time !== undefined && extraction.time !== null) {
            updates.time = extraction.time;
        }
        if (extraction.name !== undefined && extraction.name !== null) {
            updates.name = extraction.name;
        }
        if (extraction.recipientPhone !== undefined && extraction.recipientPhone !== null) {
            if (this.validatePhoneNumber(extraction.recipientPhone)) {
                const { formatPhoneNumber } = require('../../utils/booking');
                const formattedPhone = formatPhoneNumber(extraction.recipientPhone);
                if (this.validatePhoneNumber(formattedPhone)) {
                    this.logger.debug(`[PHONE] Formatting phone: "${extraction.recipientPhone}" -> "${formattedPhone}"`);
                    updates.recipientPhone = formattedPhone;
                }
                else {
                    this.logger.warn(`Formatted phone number is invalid: "${formattedPhone}" (from "${extraction.recipientPhone}")`);
                }
            }
            else {
                this.logger.warn(`Invalid phone number provided: ${extraction.recipientPhone}`);
            }
        }
        if (Object.keys(updates).length > 0) {
            if (existingDraft && (existingDraft.step === 'reschedule' || existingDraft.step === 'reschedule_confirm')) {
                if (existingDraft.bookingId) {
                }
            }
            else {
                const nextStep = this.determineBookingStep({
                    ...existingDraft,
                    ...updates
                });
                if (nextStep) {
                    updates.step = nextStep;
                }
            }
        }
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
        const updateData = {
            ...updates,
            version: { increment: 1 },
            updatedAt: new Date(),
        };
        if (existingDraft && (existingDraft.step === 'reschedule' || existingDraft.step === 'reschedule_confirm')) {
            if (existingDraft.bookingId && !updates.bookingId) {
                updateData.bookingId = existingDraft.bookingId;
            }
            if (!updates.step) {
                updateData.step = existingDraft.step;
            }
        }
        const updated = await this.prisma.bookingDraft.upsert({
            where: { customerId },
            update: updateData,
            create: {
                customerId,
                step: 'service',
                version: 1,
                ...updates,
            },
        });
        return updated;
    }
    determineBookingStep(draft) {
        if (draft.service && draft.date && draft.time && draft.name && draft.recipientPhone) {
            return 'confirm';
        }
        if (!draft.service)
            return 'service';
        if (!draft.date)
            return 'date';
        if (!draft.time)
            return 'time';
        if (!draft.name)
            return 'name';
        if (!draft.recipientPhone)
            return 'phone';
        return 'confirm';
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
        if (!draft.recipientPhone) {
            const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
            if (customer?.phone) {
                const { formatPhoneNumber } = require('../../utils/booking');
                const formattedPhone = formatPhoneNumber(customer.phone);
                await this.mergeIntoDraft(customerId, { recipientPhone: formattedPhone });
                draft.recipientPhone = formattedPhone;
                this.logger.debug(`[SMART EXTRACTION] Using customer phone as recipientPhone: ${customer.phone} -> ${formattedPhone}`);
            }
            else {
                missing.push('recipientPhone');
            }
        }
        if (!draft.recipientName) {
            draft.recipientName = draft.name;
            await this.mergeIntoDraft(customerId, { recipientName: draft.name });
        }
        if (missing.length === 0) {
            this.logger.debug('All booking draft fields present (after defaults):', JSON.stringify(draft, null, 2));
            if (!bookingsService) {
                this.logger.warn('checkAndCompleteIfConfirmed called without bookingsService; cannot verify availability or complete booking.');
                return {
                    action: 'failed',
                    error: "I'm having a little trouble completing your booking automatically. Please try again in a moment or contact our team to confirm your slot. 💖",
                };
            }
            const normalized = this.normalizeDateTime(draft.date, draft.time);
            if (!normalized) {
                this.logger.warn('Unable to normalize date/time in checkAndCompleteIfConfirmed', { date: draft.date, time: draft.time });
                return { action: 'failed', error: 'Unable to parse date/time. Please provide a clear date and time (e.g., "2025-11-20 at 09:00").' };
            }
            const dateObj = new Date(normalized.isoUtc);
            this.logger.debug('Normalized date/time for completion:', normalized);
            const { conflict, suggestions } = await this.checkBookingConflicts(customerId, dateObj);
            if (conflict) {
                if (extraction.subIntent === 'reschedule') {
                    await this.prisma.bookingDraft.update({
                        where: { customerId },
                        data: { step: 'reschedule' }
                    });
                    return {
                        action: 'reschedule',
                        message: 'Let\'s reschedule your booking. Please provide a new date and time.',
                        suggestions: suggestions || []
                    };
                }
                if (extraction.subIntent === 'start' || extraction.subIntent === 'provide') {
                    await this.prisma.bookingDraft.delete({ where: { customerId } });
                    return {
                        action: 'new_booking',
                        message: 'Your previous booking is still active. Would you like to cancel it and create a new one?',
                        suggestions: suggestions || []
                    };
                }
                return {
                    action: 'conflict',
                    message: conflict,
                    suggestions: suggestions || []
                };
            }
            const avail = await bookingsService.checkAvailability(dateObj, draft.service);
            this.logger.debug('Availability check result:', { available: avail.available, suggestions: avail.suggestions?.length || 0 });
            if (!avail.available) {
                this.logger.warn('Requested slot not available during checkAndCompleteIfConfirmed:', dateObj.toISOString());
                return { action: 'unavailable', suggestions: avail.suggestions || [] };
            }
            const pkg = await bookingsService.packagesService.findPackageByName(draft.service);
            const depositAmount = pkg?.deposit || 2000;
            const latestPayment = await bookingsService.getLatestPaymentForDraft(customerId);
            if (extraction.subIntent === 'deposit_confirmed' || (typeof extraction.content === 'string' && extraction.content.trim().toLowerCase() === 'confirm')) {
                if (latestPayment && latestPayment.status === 'failed') {
                    this.logger.debug(`[SECURITY] Payment failed, treating deposit_confirmed as resend request`);
                    return {
                        action: 'ready_for_deposit',
                        amount: depositAmount,
                        packageName: pkg?.name || draft.service,
                        requiresResend: true,
                    };
                }
                try {
                    const result = await this.retryOperation(() => bookingsService.completeBookingDraft(customerId, dateObj), 'completeBookingDraft', 2, 1000);
                    return {
                        action: 'payment_initiated',
                        message: result.message,
                        amount: result.depositAmount,
                        packageName: result.packageName,
                        checkoutRequestId: result.checkoutRequestId,
                        paymentId: result.paymentId
                    };
                }
                catch (err) {
                    this.logger.error('All retries for completeBookingDraft failed, cancelling booking draft', err);
                    await this.prisma.bookingDraft.delete({ where: { customerId } });
                    return {
                        action: 'cancelled',
                        message: 'We encountered repeated issues processing your booking. Your draft has been cancelled to avoid further problems. Please try booking again later or contact support if the issue persists.'
                    };
                }
            }
            else {
                return {
                    action: 'ready_for_deposit',
                    amount: depositAmount,
                    packageName: pkg?.name || draft.service,
                };
            }
        }
        else {
            this.logger.warn('Booking draft incomplete; missing fields:', missing);
            return { action: 'incomplete', missing };
        }
    }
    async confirmCustomerPhone(customerId) {
        const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
        if (customer && customer.phone) {
            const { formatPhoneNumber } = require('../../utils/booking');
            const formattedPhone = formatPhoneNumber(customer.phone);
            await this.mergeIntoDraft(customerId, { recipientPhone: formattedPhone });
            return true;
        }
        return false;
    }
    async handleConversation(message, customerId, history = [], bookingsService, retryCount = 0, enrichedContext) {
        this.logger.log(`[AI SERVICE] handleConversation called for customer ${customerId}. Message: "${message.substring(0, 50)}..."`);
        const conversationStartTime = Date.now();
        let personalizationContext = null;
        let intentAnalysis = null;
        let wasSuccessful = false;
        let conversationOutcome = 'unknown';
        try {
            try {
                personalizationContext = await this.customerMemory.getPersonalizationContext(customerId);
                this.logger.debug(`[LEARNING] Loaded context: ${personalizationContext.relationshipStage}, VIP: ${personalizationContext.isVIP}`);
                enrichedContext = { ...enrichedContext, personalization: personalizationContext };
            }
            catch (err) {
                this.logger.warn('[LEARNING] Failed to load customer context', err);
            }
            try {
                intentAnalysis = await this.advancedIntent.analyzeIntent(message, personalizationContext);
                this.logger.debug(`[LEARNING] Intent: ${intentAnalysis.primaryIntent} (confidence: ${intentAnalysis.confidence}), Tone: ${intentAnalysis.emotionalTone}`);
                if (intentAnalysis.requiresHumanHandoff && this.escalationService) {
                    await this.escalationService.createEscalation(customerId, 'AI detected need for human handoff', 'auto_detected', { intentAnalysis, message });
                }
            }
            catch (err) {
                this.logger.warn('[LEARNING] Intent analysis failed', err);
            }
            if (history.length === 0 && personalizationContext) {
                try {
                    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
                    const greeting = await this.personalization.generateGreeting(customerId, customer?.name);
                    history = [{ role: 'assistant', content: greeting }];
                }
                catch (err) {
                    this.logger.warn('[LEARNING] Failed to generate personalized greeting', err);
                }
            }
            const result = await this.processConversationLogic(message, customerId, history, bookingsService, enrichedContext, intentAnalysis);
            const responseText = typeof result.response === 'string' ? result.response :
                (typeof result.response === 'object' && result.response !== null && 'text' in result.response) ? result.response.text :
                    JSON.stringify(result.response);
            if (responseText) {
                await this.checkAndEscalateIfHandoffMentioned(responseText, customerId, message, history);
            }
            if (result.response && personalizationContext) {
                try {
                    const baseResponse = typeof result.response === 'string' ? result.response :
                        (typeof result.response === 'object' && result.response !== null && 'text' in result.response) ? result.response.text :
                            '';
                    if (baseResponse) {
                        let personalizedResponse = this.personalization.adaptResponse(baseResponse, personalizationContext.communicationStyle || 'friendly');
                        if (intentAnalysis?.emotionalTone) {
                            personalizedResponse = this.personalization.matchEmotionalTone(personalizedResponse, intentAnalysis.emotionalTone);
                        }
                        if (intentAnalysis?.primaryIntent && Math.random() > 0.7) {
                            const suggestions = await this.personalization.generateProactiveSuggestions(customerId, intentAnalysis.primaryIntent);
                            if (suggestions.length > 0) {
                                personalizedResponse += `\n\n💡 ${suggestions[0]}`;
                            }
                        }
                        if (typeof result.response === 'string') {
                            result.response = personalizedResponse;
                        }
                        else if (typeof result.response === 'object' && result.response !== null && 'text' in result.response) {
                            result.response.text = personalizedResponse;
                        }
                        try {
                            const style = personalizationContext?.communicationStyle ?? 'friendly';
                            const userState = result.draft?.step === 'confirm' || (result.draft && intentAnalysis?.primaryIntent === 'booking')
                                ? 'booking'
                                : personalizationContext?.isReturning
                                    ? 'returning'
                                    : history.length === 0
                                        ? 'new'
                                        : 'general';
                            const humanizerContext = {
                                intent: {
                                    primaryIntent: intentAnalysis?.primaryIntent,
                                    emotionalTone: intentAnalysis?.emotionalTone,
                                    requiresHumanHandoff: intentAnalysis?.requiresHumanHandoff,
                                },
                                emotionalTone: intentAnalysis?.emotionalTone,
                                urgency: intentAnalysis?.urgencyLevel,
                                platform: enrichedContext?.platform ?? 'whatsapp',
                                brandTone: 'WARM_PROFESSIONAL',
                                isFirstMessage: history.length === 0,
                                isEscalation: intentAnalysis?.requiresHumanHandoff === true || result.metrics?.circuitBreakerTrip === true,
                                isBookingFlow: !!result.draft || intentAnalysis?.primaryIntent === 'booking',
                                lastAiResponses: history
                                    .filter((m) => m.role === 'assistant')
                                    .slice(-3)
                                    .map((m) => m.content),
                                customerProfile: {
                                    formalityLevel: style === 'brief' ? 'high' : style === 'friendly' ? 'low' : 'medium',
                                    emojiTolerance: style === 'brief' ? 'low' : 'medium',
                                    verbosity: style,
                                },
                                userState,
                            };
                            const humanized = this.responseHumanizer.humanizeResponse(personalizedResponse, humanizerContext);
                            if (typeof result.response === 'string') {
                                result.response = humanized;
                            }
                            else if (typeof result.response === 'object' && result.response !== null && 'text' in result.response) {
                                result.response.text = humanized;
                            }
                        }
                        catch (err) {
                            this.logger.warn('[HUMANIZER] Response humanization failed', err);
                        }
                    }
                }
                catch (err) {
                    this.logger.warn('[LEARNING] Personalization failed', err);
                }
            }
            let finalResponseText = typeof result.response === 'string' ? result.response :
                (typeof result.response === 'object' && result.response !== null && 'text' in result.response) ? result.response.text :
                    '';
            wasSuccessful = !finalResponseText?.includes('trouble') &&
                !finalResponseText?.includes('error') &&
                !finalResponseText?.includes('difficulties');
            if (result.draft && result.draft.step === 'confirm') {
                conversationOutcome = 'booking_initiated';
            }
            else if (intentAnalysis?.primaryIntent === 'booking') {
                conversationOutcome = 'booking_in_progress';
            }
            else if (intentAnalysis?.primaryIntent === 'package_inquiry') {
                conversationOutcome = 'information_provided';
            }
            else if (intentAnalysis?.primaryIntent === 'faq') {
                conversationOutcome = 'question_answered';
            }
            else {
                conversationOutcome = 'resolved';
            }
            try {
                await this.conversationLearning.recordLearning(customerId, {
                    userMessage: message,
                    aiResponse: finalResponseText || '',
                    extractedIntent: intentAnalysis?.primaryIntent || 'unknown',
                    emotionalTone: intentAnalysis?.emotionalTone,
                    wasSuccessful,
                    conversationOutcome,
                    conversationLength: history.length + 1,
                    timeToResolution: Math.floor((Date.now() - conversationStartTime) / 1000),
                });
                this.logger.debug(`[LEARNING] Recorded conversation: ${conversationOutcome}, success: ${wasSuccessful}`);
            }
            catch (err) {
                this.logger.warn('[LEARNING] Failed to record learning', err);
            }
            try {
                const preferences = this.personalization.extractPreferencesFromMessage(message);
                if (Object.keys(preferences).length > 0) {
                    await this.customerMemory.updatePreferences(customerId, preferences);
                }
                if (conversationOutcome === 'booking_initiated' && personalizationContext?.relationshipStage === 'new') {
                    await this.customerMemory.updateRelationshipStage(customerId, 'booked');
                }
                else if (conversationOutcome === 'information_provided' && personalizationContext?.relationshipStage === 'new') {
                    await this.customerMemory.updateRelationshipStage(customerId, 'interested');
                }
                await this.customerMemory.addConversationSummary(customerId, {
                    date: new Date(),
                    intent: intentAnalysis?.primaryIntent || 'unknown',
                    outcome: conversationOutcome,
                    keyPoints: [message.substring(0, 100)],
                    satisfaction: wasSuccessful ? 4 : undefined,
                });
                if (history.length >= 3) {
                    const userMessages = history
                        .filter((h) => h.role === 'user')
                        .map((h) => h.content);
                    if (userMessages.length > 0) {
                        const detectedStyle = this.customerMemory.detectCommunicationStyle(userMessages);
                        await this.customerMemory.updatePreferences(customerId, { communicationStyle: detectedStyle });
                    }
                }
            }
            catch (err) {
                this.logger.warn('[LEARNING] Failed to update customer memory', err);
            }
            try {
                const responseText = finalResponseText || '';
                if (responseText) {
                    const isHighConfidenceIntent = intentAnalysis?.confidence && intentAnalysis.confidence > 0.85;
                    const isFaqStrategy = result.metrics?.strategyUsed === 'faq';
                    const isGreetingResponse = intentAnalysis?.primaryIntent === 'greeting' ||
                        result.metrics?.strategyUsed === 'greeting';
                    const shouldAwaitValidation = !isHighConfidenceIntent && !isFaqStrategy && !isGreetingResponse && result.metrics?.isFallback;
                    if (!shouldAwaitValidation) {
                        this.logger.debug(`[LATENCY] Fast-path triggered. Backgrounding deep validation for ${intentAnalysis?.primaryIntent || 'unknown'}`);
                    }
                    this.logger.debug(`[QUALITY] Validating response for customer ${customerId}. Intent: ${intentAnalysis?.primaryIntent}`);
                    const qualityCheck = await this.responseQuality.validateResponse(responseText, {
                        userMessage: message,
                        customerId,
                        intent: intentAnalysis?.primaryIntent,
                        emotionalTone: intentAnalysis?.emotionalTone,
                        history,
                    }, shouldAwaitValidation);
                    if (!qualityCheck.passed && qualityCheck.improvedResponse) {
                        this.logger.log(`[QUALITY] Response improved: ${qualityCheck.score.overall.toFixed(1)}/10 for ${customerId}. Original: "${responseText.substring(0, 50)}..."`);
                        const style = personalizationContext?.communicationStyle ?? 'friendly';
                        const userState = result.draft?.step === 'confirm' || (result.draft && intentAnalysis?.primaryIntent === 'booking')
                            ? 'booking'
                            : personalizationContext?.isReturning
                                ? 'returning'
                                : history.length === 0
                                    ? 'new'
                                    : 'general';
                        const humanizerContext = {
                            intent: {
                                primaryIntent: intentAnalysis?.primaryIntent,
                                emotionalTone: intentAnalysis?.emotionalTone,
                                requiresHumanHandoff: intentAnalysis?.requiresHumanHandoff,
                            },
                            emotionalTone: intentAnalysis?.emotionalTone,
                            urgency: intentAnalysis?.urgencyLevel,
                            platform: enrichedContext?.platform ?? 'whatsapp',
                            brandTone: 'WARM_PROFESSIONAL',
                            isFirstMessage: history.length === 0,
                            isEscalation: intentAnalysis?.requiresHumanHandoff === true,
                            isBookingFlow: !!result.draft || intentAnalysis?.primaryIntent === 'booking',
                            lastAiResponses: history
                                .filter((m) => m.role === 'assistant')
                                .slice(-3)
                                .map((m) => m.content),
                            customerProfile: {
                                formalityLevel: style === 'brief' ? 'high' : style === 'friendly' ? 'low' : 'medium',
                                emojiTolerance: style === 'brief' ? 'low' : 'medium',
                                verbosity: style,
                            },
                            userState,
                        };
                        const reHumanized = this.responseHumanizer.humanizeResponse(qualityCheck.improvedResponse, humanizerContext);
                        result.response = reHumanized;
                        finalResponseText = reHumanized;
                    }
                    else if (!qualityCheck.passed) {
                        this.logger.warn(`[QUALITY] Response quality low: ${qualityCheck.score.overall.toFixed(1)}/10 - ${qualityCheck.reason}`);
                        if (qualityCheck.shouldEscalate && this.escalationService) {
                            await this.escalationService.createEscalation(customerId, `Low quality response detected: ${qualityCheck.reason}`, 'quality_check', { qualityScore: qualityCheck.score, originalResponse: responseText });
                        }
                    }
                    else {
                        this.logger.debug(`[QUALITY] Response quality good: ${qualityCheck.score.overall.toFixed(1)}/10`);
                    }
                }
            }
            catch (err) {
                this.logger.warn('[QUALITY] Failed to validate response quality', err);
            }
            return result;
        }
        catch (err) {
            this.logger.error(`[AI_ERROR] 🔴 CRITICAL: Conversation failed for customer ${customerId}. Error: ${err.message}`, err.stack);
            try {
                await this.conversationLearning.recordLearning(customerId, {
                    userMessage: message,
                    aiResponse: err.message || 'Error occurred',
                    extractedIntent: intentAnalysis?.primaryIntent || 'unknown',
                    emotionalTone: intentAnalysis?.emotionalTone,
                    wasSuccessful: false,
                    conversationOutcome: 'error',
                    conversationLength: history.length + 1,
                });
                this.logger.warn(`[LEARNING] Recorded failed conversation for learning`);
            }
            catch (learningErr) {
                this.logger.warn('[LEARNING] Failed to record error for learning', learningErr);
            }
            return this.attemptRecovery(err, { message, customerId, history, bookingsService, retryCount });
        }
    }
    async attemptRecovery(error, context) {
        if (context.retryCount > 1) {
            this.logger.error('Max retries exceeded in attemptRecovery', error);
            this.logger.error('Error details:', error instanceof Error ? error.stack : error);
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
        this.logger.error('Error in attemptRecovery, returning fallback', error);
        this.logger.error('Error details:', error instanceof Error ? error.stack : error);
        return {
            response: "I'm having a little trouble processing that right now. Could you try rephrasing your request? If the issue persists, feel free to contact our team directly! 💖",
            draft: null,
            updatedHistory: context.history
        };
    }
    async processConversationLogic(message, customerId, history = [], bookingsService, enrichedContext, intentAnalysis) {
        this.logger.log(`[AI SERVICE] processConversationLogic starting for customer ${customerId}`);
        if (bookingsService) {
            await bookingsService.cleanupStaleDraft(customerId);
        }
        const earlyDraft = await this.getOrCreateDraft(customerId);
        const existingBooking = bookingsService ? await bookingsService.getLatestConfirmedBooking(customerId) : null;
        const isFaqAboutBookingProcess = /(how.*(does|is|are|work|long|much)|what.*(is|are|the|process|include|cost|amount)|booking.*(process|work|cost|include|policy|hours|refund|cancel)|deposit.*(amount|cost|is)|refund|cancel.*policy|when.*(are|is).*open)/i.test(message);
        const wantsToStartBooking = /(how.*(do|can).*(make|book|start|get|schedule).*(booking|appointment)|(i want|i'd like|i need|can i|please).*(to book|booking|appointment|make.*booking|schedule)|let.*book|start.*booking)/i.test(message);
        const hasEarlyDraft = !!(earlyDraft && (earlyDraft.service || earlyDraft.date));
        const isFaqAboutBooking = isFaqAboutBookingProcess && !wantsToStartBooking && !hasEarlyDraft;
        if (isFaqAboutBooking && !earlyDraft.service && !earlyDraft.date) {
            this.logger.debug('[CONTEXT] Detected FAQ about booking, letting FAQ strategy handle');
        }
        const recentAssistantMsgsForConnection = history
            .filter((msg, idx) => msg.role === 'assistant')
            .slice(-3)
            .map(msg => msg.content)
            .join(' ');
        const isConnectionQuestion = recentAssistantMsgsForConnection.includes('connect you with our team') ||
            recentAssistantMsgsForConnection.includes('Would you like me to do that for you') ||
            recentAssistantMsgsForConnection.includes('Would you like me to do that');
        const isYesResponse = /(yes|yeah|yep|yup|sure|ok|okay|alright|please|do it|go ahead|do that|that would be|sounds good|that works)/i.test(message.trim());
        if (isConnectionQuestion && isYesResponse) {
            const openEscalation = await this.prisma.escalation.findFirst({
                where: {
                    customerId,
                    status: 'OPEN',
                    escalationType: 'booking_cancellation'
                },
                orderBy: { createdAt: 'desc' }
            });
            if (openEscalation) {
                this.logger.log(`[ESCALATION] Customer ${customerId} confirmed connection request - pausing AI`);
                await this.prisma.customer.update({
                    where: { id: customerId },
                    data: { isAiPaused: true }
                });
                const msg = "Great! I'll connect you with our team right away to assist with canceling your current booking and setting up a new one. They'll be able to guide you through the process and answer any questions you might have. 😊";
                return { response: msg, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
            }
            else {
                this.logger.debug(`[ESCALATION] Customer ${customerId} said yes but no open escalation found`);
            }
        }
        const isNotificationStatusQuestion = /(have you|did you|has|have they|were they).*(notif|contact|reach|call|message|connect|escalat|tell|inform)/i.test(message) ||
            /(notif|contact|reach|call|message|connect|escalat|tell|inform).*(yet|already|done)/i.test(message) ||
            /(when|how long).*(team|they|admin|support|staff)/i.test(message);
        if (isNotificationStatusQuestion) {
            const openEscalation = await this.prisma.escalation.findFirst({
                where: {
                    customerId,
                    status: 'OPEN',
                },
                orderBy: { createdAt: 'desc' }
            });
            if (openEscalation) {
                this.logger.log(`[ESCALATION] Customer ${customerId} asking about notification status - confirming team has been notified`);
                const msg = "Yes! I've already notified our team about your request. They've been alerted and will reach out to you soon to assist with canceling your current booking and setting up a new one. You should hear from them shortly! 😊";
                return { response: msg, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
            }
        }
        await this.checkAndCreateSessionNote(message, customerId, enrichedContext, history);
        const breakerCheck = await this.circuitBreaker.checkAndBreak(customerId, history);
        if (breakerCheck.shouldBreak) {
            this.logger.warn(`[CIRCUIT_BREAKER] 🔴 TRIPPED for customer ${customerId}: ${breakerCheck.reason || 'Unknown'}`);
            await this.circuitBreaker.recordTrip(customerId, breakerCheck.reason || 'Circuit breaker tripped');
            try {
                const existingDraft = await this.prisma.bookingDraft.findUnique({
                    where: { customerId },
                });
                if (existingDraft) {
                    await this.prisma.bookingDraft.delete({ where: { customerId } });
                    this.logger.log(`[CIRCUIT_BREAKER] Cleared draft for customer ${customerId}`);
                }
            }
            catch (err) {
                this.logger.error(`[CIRCUIT_BREAKER] Error clearing draft: ${err.message}`);
            }
            let recoveryMessage;
            if (breakerCheck.recovery === 'escalate') {
                recoveryMessage = `I'm so sorry, I think I'm getting a little tangled up! 😓 I want to make sure you get the best help possible. Let me connect you with one of our lovely team members who can assist you personally.\n\nWould you like someone to reach out to you, or would you prefer our studio's direct number at ${this.customerCarePhone}? 💖`;
            }
            else if (breakerCheck.recovery === 'simplify') {
                recoveryMessage = `Let's start fresh! 🌸 I really want to make sure I help you perfectly. Could you tell me in simple terms what you'd like to do today?\n\nFor example:\n✨ "I'd like to book a photoshoot"\n✨ "Tell me about your amazing packages"\n✨ "I need to change my booking date"\n\nWhat can I do for you? 💖`;
            }
            else {
                recoveryMessage = `I apologize, I seem to be having a bit of trouble. Let's try starting over! What can I help you with today? 💖`;
            }
            return {
                response: recoveryMessage,
                draft: null,
                updatedHistory: [...history.slice(-this.historyLimit),
                    { role: 'user', content: message },
                    { role: 'assistant', content: recoveryMessage }
                ],
                metrics: { isFallback: true, circuitBreakerTrip: true, circuitBreakerReason: breakerCheck.reason }
            };
        }
        message = this.sanitizeInput(message);
        const withinLimit = await this.checkRateLimit(customerId);
        if (!withinLimit) {
            this.logger.warn(`Customer ${customerId} exceeded daily token limit`);
            const limitMsg = "I've enjoyed our chat today! 💖 I've reached my daily limit, but our team would love to continue the conversation. They'll be in touch tomorrow, or you're welcome to reach us at " + this.customerCarePhone + ". 🌸";
            return { response: limitMsg, draft: null, updatedHistory: [...history, { role: 'user', content: message }, { role: 'assistant', content: limitMsg }] };
        }
        const lowerForBiz = (message || '').toLowerCase();
        const locationKw = ['location', 'where', 'address', 'located', 'studio location', 'studio address', 'where are you', 'where is the studio'];
        if (locationKw.some((kw) => lowerForBiz.includes(kw))) {
            const locationResponse = `Our business is called ${this.businessName}. ${this.businessLocation}`;
            return { response: locationResponse, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: locationResponse }] };
        }
        const hoursKw = ['hours', 'open', 'when are you open', 'operating hours', 'business hours', 'what time', 'opening hours', 'closing time', 'when do you close'];
        if (hoursKw.some((kw) => lowerForBiz.includes(kw))) {
            const hoursResponse = `We're open ${this.businessHours}. Feel free to visit us or book an appointment during these times! 🕐✨`;
            return { response: hoursResponse, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: hoursResponse }] };
        }
        const websiteKw = ['website', 'web address', 'url', 'online', 'site', 'web page', 'webpage'];
        if (websiteKw.some((kw) => lowerForBiz.includes(kw))) {
            const websiteResponse = `You can visit our website at ${this.businessWebsite} to learn more about our services and view our portfolio! 🌸✨`;
            return { response: websiteResponse, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: websiteResponse }] };
        }
        const contactKw = ['customer care', 'support', 'help line', 'call', 'phone number', 'contact number', 'telephone', 'mobile number', 'reach you'];
        if (contactKw.some((kw) => lowerForBiz.includes(kw))) {
            const careResponse = `You can reach our customer care team at ${this.customerCarePhone}. We're here to help! 💖 You can also email us at ${this.customerCareEmail}.`;
            return { response: careResponse, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: careResponse }] };
        }
        const isFrustrated = await this.detectFrustration(message, history);
        if (isFrustrated && this.escalationService) {
            this.logger.log(`[SENTIMENT] Customer ${customerId} showing frustration - auto-escalating`);
            const sentimentScore = 0.8;
            await this.escalationService.createEscalation(customerId, 'Customer showing signs of frustration (auto-detected)', 'frustration', { sentimentScore, lastMessage: message, historyLength: history.length });
            const escalationMsg = "I can sense you're frustrated, and I am so genuinely sorry! 😔 I want to make sure you're taken care of, so I'm connecting you with a human team member who can help you better right now. Someone will be with you shortly! 💖";
            return { response: escalationMsg, draft: null, updatedHistory: [...history, { role: 'user', content: message }, { role: 'assistant', content: escalationMsg }] };
        }
        let draft = earlyDraft || await this.prisma.bookingDraft.findUnique({ where: { customerId } });
        let hasDraft = !!draft;
        const currentPlatform = enrichedContext?.platform || 'whatsapp';
        const isBookingIntent = intentAnalysis?.primaryIntent === 'booking' || intentAnalysis?.primaryIntent === 'reschedule' || intentAnalysis?.primaryIntent === 'availability';
        const isOnlyQuestion = intentAnalysis?.primaryIntent === 'faq' || intentAnalysis?.primaryIntent === 'package_inquiry' || intentAnalysis?.primaryIntent === 'price_inquiry';
        if (currentPlatform !== 'whatsapp' && !isOnlyQuestion && (hasDraft || wantsToStartBooking || isBookingIntent)) {
            this.logger.log(`[PLATFORM] Customer on ${currentPlatform} requested booking/appointment - directing to WhatsApp`);
            const redirectMsg = this.getWhatsAppOnlyRedirectMessage();
            return {
                response: redirectMsg,
                draft: null,
                updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: redirectMsg }],
                metrics: { strategyUsed: 'redirect_to_whatsapp', platform: currentPlatform }
            };
        }
        const strategyContext = {
            aiService: this,
            logger: this.logger,
            history,
            historyLimit: this.historyLimit,
            customerId,
            bookingsService,
            prisma: this.prisma,
            message,
            hasDraft,
            draft,
            enrichedContext,
            whatsappService: this.whatsappService,
            intentAnalysis
        };
        for (const strategy of this.strategies) {
            if (strategy.canHandle(null, strategyContext)) {
                this.logger.debug(`[STRATEGY] ${strategy.constructor.name} handling message: "${message.substring(0, 50)}..."`);
                const result = await strategy.generateResponse(message, strategyContext);
                if (result) {
                    let responseText = result;
                    if (typeof result === 'object' && result !== null) {
                        responseText = result.response;
                        if (typeof responseText === 'object' && responseText !== null && 'text' in responseText) {
                            responseText = responseText.text;
                        }
                    }
                    const responseStr = typeof responseText === 'string' ? responseText : JSON.stringify(responseText);
                    await this.checkAndEscalateIfHandoffMentioned(responseStr, customerId, message, history);
                    const strategyName = strategy.constructor.name;
                    const strategyUsed = strategyName === 'FaqStrategy' ? 'faq' : strategyName === 'PackageInquiryStrategy' ? 'package_inquiry' : strategyName === 'BookingStrategy' ? 'booking' : 'fallback';
                    return {
                        ...result,
                        response: responseText,
                        updatedHistory: result.updatedHistory
                            ? result.updatedHistory.map((msg) => ({
                                ...msg,
                                content: typeof msg.content === 'object' && msg.content !== null && 'text' in msg.content ? msg.content.text : msg.content
                            }))
                            : undefined,
                        metrics: { strategyUsed }
                    };
                }
            }
        }
        const lower = (message || '').toLowerCase();
        const isGreetingIntent = intentAnalysis?.primaryIntent === 'greeting';
        const greetingKeywords = ['hi', 'hello', 'hey', 'greetings', 'hallo', 'habari', 'good morning', 'good afternoon', 'good evening'];
        const cleanMsg = lower.replace(/[^\w\s]/g, '').trim();
        const isExactGreeting = greetingKeywords.some(kw => cleanMsg === kw || cleanMsg.startsWith(kw + ' '));
        const isGreetingVariant = /^(hello+|hi+|hey+|hii+|heyy+)$/i.test(cleanMsg) || /^(good\s+(morning|afternoon|evening))$/i.test(cleanMsg);
        const isSimpleGreeting = isExactGreeting || (cleanMsg.split(/\s+/).length <= 2 && isGreetingVariant);
        if (isGreetingIntent || isSimpleGreeting) {
            const customer = enrichedContext?.customer || await this.prisma.customer.findUnique({ where: { id: customerId } });
            const name = customer?.name?.replace(/^WhatsApp User\s+/i, '') || '';
            const personalizedName = name ? `, ${name}` : '';
            const greetingResponse = `Hello there${personalizedName}! 🌸 Welcome to Fiesta House Maternity. We're so delighted you reached out! ✨

We specialize in luxury maternity photography here in Kenya, offering a beautiful, all-inclusive experience. From our world-class studio sets and professional makeup to our curated collection of gorgeous gowns, we're here to make sure your shoot is as radiant and stress-free as possible.

How can I help make your maternity session special today? 💖`;
            return {
                response: greetingResponse,
                draft: null,
                updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: greetingResponse }]
            };
        }
        const slotKeywords = [
            'available hours', 'available times', 'available slots', 'what times', 'what hours', 'when can i book',
            'when are you free', 'when is available', 'what time is available', 'what hour is available',
            'slots for', 'hours for', 'times for', 'slots tomorrow', 'hours tomorrow', 'times tomorrow',
            'open slots', 'open hours', 'open times', 'free slots', 'free hours', 'free times',
            'can i book tomorrow', 'can i book on', 'can i come on', 'can i come at', 'can i come tomorrow',
            'when can i come', 'when can i book', 'when is open', 'when are you open', 'when is free',
        ];
        const slotIntent = slotKeywords.some(kw => lower.includes(kw));
        const anotherSlotPattern = /(another|other|what.*another|what.*other|so what|give me|show me).*(slot|time|hour|free|available)/i;
        const slotIntentRegex = /(available|free|open)\s+(hours|times|slots)(\s+(on|for|tomorrow|today|\d{4}-\d{2}-\d{2}))?/i;
        const slotIntentDetected = slotIntent || slotIntentRegex.test(message) || anotherSlotPattern.test(message);
        if (slotIntentDetected) {
            if (currentPlatform !== 'whatsapp') {
                this.logger.log(`[PLATFORM] Customer on ${currentPlatform} asked about slots/availability - directing to WhatsApp`);
                const redirectMsg = this.getWhatsAppOnlyRedirectMessage();
                return {
                    response: redirectMsg,
                    draft: null,
                    updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: redirectMsg }],
                    metrics: { strategyUsed: 'redirect_to_whatsapp', platform: currentPlatform }
                };
            }
            const isAnotherSlotQuery = anotherSlotPattern.test(message);
            let dateStr;
            if (isAnotherSlotQuery && draft?.date) {
                dateStr = draft.date;
            }
            else if (/tomorrow/.test(lower)) {
                dateStr = luxon_1.DateTime.now().setZone(this.studioTz).plus({ days: 1 }).toFormat('yyyy-MM-dd');
            }
            else {
                const dateMatch = lower.match(/(\d{4}-\d{2}-\d{2})/);
                if (dateMatch)
                    dateStr = dateMatch[1];
            }
            let service = isAnotherSlotQuery ? draft?.service : undefined;
            if (!service) {
                service = draft?.service;
            }
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
        const viewBookingsKeywords = [
            'view.*booking',
            'show.*booking',
            'see.*booking',
            'my past booking',
            'past booking',
            'previous booking',
            'last booking',
            'when was my',
            'upcoming booking',
            'next booking',
            'future booking',
        ];
        const isViewBookingsRequest = viewBookingsKeywords.some(kw => new RegExp(kw, 'i').test(lower));
        const isBookingHistoryQuery = bookingHistoryKeywords.some(kw => lower.includes(kw));
        if (isBookingHistoryQuery || isViewBookingsRequest) {
            const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
            if (!customer) {
                const msg = `I couldn't find your booking information. Let me help you make your first booking! 💖`;
                return { response: msg, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
            }
            const allBookings = await this.prisma.booking.findMany({
                where: {
                    customerId: customer.id,
                    status: { not: 'cancelled' },
                },
                orderBy: { dateTime: 'desc' },
                take: 10,
            });
            let name = customer?.name || '';
            if (name && name.toLowerCase().startsWith('whatsapp user'))
                name = '';
            const who = name ? name : (customer?.phone ? customer.phone : 'dear');
            if (isViewBookingsRequest) {
                if (allBookings.length === 0) {
                    const msg = `Hi ${who}, you don't have any bookings yet. Would you like to make your first one? 💖`;
                    return { response: msg, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
                }
                if (/(last|previous|recent)/.test(lower)) {
                    const lastBooking = allBookings[0];
                    const dt = luxon_1.DateTime.fromJSDate(lastBooking.dateTime).setZone(this.studioTz);
                    const msg = `Your last booking was:\n\n📅 *${lastBooking.service}*\n🗓️ Date: ${dt.toFormat('MMMM dd, yyyy')}\n🕐 Time: ${dt.toFormat('h:mm a')}\n✨ Status: ${lastBooking.status}\n\nWould you like to book another session? 🌸`;
                    return { response: msg, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
                }
                if (/(upcoming|next|future)/.test(lower)) {
                    const now = new Date();
                    const upcomingBookings = allBookings.filter(b => b.dateTime > now && b.status === 'confirmed');
                    if (upcomingBookings.length === 0) {
                        const msg = `You don't have any upcoming bookings scheduled. Would you like to book a session? 💖`;
                        return { response: msg, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
                    }
                    const nextBooking = upcomingBookings[0];
                    const dt = luxon_1.DateTime.fromJSDate(nextBooking.dateTime).setZone(this.studioTz);
                    const msg = `Your next booking is:\n\n📅 *${nextBooking.service}*\n🗓️ Date: ${dt.toFormat('MMMM dd, yyyy')}\n🕐 Time: ${dt.toFormat('h:mm a')}\n✨ Status: ${nextBooking.status}\n\nWe're so excited to see you! 🌸`;
                    return { response: msg, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
                }
                const bookingList = allBookings.slice(0, 5).map((b, i) => {
                    const dt = luxon_1.DateTime.fromJSDate(b.dateTime).setZone(this.studioTz);
                    return `${i + 1}. *${b.service}* - ${dt.toFormat('MMM dd, yyyy')} at ${dt.toFormat('h:mm a')} (${b.status})`;
                }).join('\n');
                const msg = `Here are your recent bookings:\n\n${bookingList}\n\n${allBookings.length > 5 ? `...and ${allBookings.length - 5} more!\n\n` : ''}Would you like to book another session? 🌸`;
                return { response: msg, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
            }
            const count = allBookings.length;
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
        const lastAssistantMsgsForCancel = history
            .filter((msg) => msg.role === 'assistant')
            .slice(-2)
            .map(msg => msg.content)
            .join(' ');
        const isCancellationConfirmationPrompt = lastAssistantMsgsForCancel.includes('Are you sure you want to cancel') ||
            lastAssistantMsgsForCancel.includes('Reply \'yes\' to confirm cancellation') ||
            lastAssistantMsgsForCancel.includes('confirm cancellation');
        if (isCancellationConfirmationPrompt) {
            const isConfirmationResponse = /^(yes|yeah|yep|yup|sure|confirm|please|do it|go ahead|ok|okay)$/i.test(message.trim());
            if (isConfirmationResponse) {
                const confirmedBooking = await this.bookingsService?.getLatestConfirmedBooking(customerId);
                if (confirmedBooking) {
                    try {
                        await this.bookingsService.cancelBooking(confirmedBooking.id);
                        this.logger.log(`[CANCELLATION] Customer ${customerId} confirmed cancellation - booking ${confirmedBooking.id} cancelled`);
                        const msg = "All set! I've cancelled your booking. We hope to see you again soon! 💖 If you'd like to make a new booking, just let me know!";
                        return { response: msg, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
                    }
                    catch (error) {
                        this.logger.error(`[CANCELLATION] Failed to cancel booking: ${error.message}`);
                        if (error.message.includes('72 hours')) {
                            const bookingDate = luxon_1.DateTime.fromJSDate(confirmedBooking.dateTime).setZone(this.studioTz).toFormat('MMM dd, yyyy \'at\' h:mm a');
                            if (this.escalationService) {
                                try {
                                    const escalation = await this.prisma.escalation.create({
                                        data: {
                                            customerId,
                                            reason: `Customer wants to cancel booking within 72-hour window (${bookingDate}) - requires admin approval`,
                                            status: 'OPEN',
                                            escalationType: 'booking_cancellation',
                                            metadata: {
                                                existingBookingId: confirmedBooking.id,
                                                existingBookingDate: confirmedBooking.dateTime,
                                                existingService: confirmedBooking.service,
                                                action: 'cancel_within_72_hours',
                                                policyViolation: true
                                            }
                                        },
                                        include: { customer: true }
                                    });
                                    if (this.websocketGateway) {
                                        try {
                                            this.websocketGateway.emitNewEscalation(escalation);
                                        }
                                        catch (wsError) {
                                            this.logger.error(`Failed to emit escalation WebSocket event: ${wsError.message}`);
                                        }
                                    }
                                    this.logger.log(`[ESCALATION] Created cancellation escalation for customer ${customerId} due to 72-hour policy`);
                                }
                                catch (escalationError) {
                                    this.logger.error(`Failed to create escalation: ${escalationError.message}`);
                                }
                            }
                            await this.createEscalationAlert(customerId, 'reschedule_request', 'Booking Cancellation Request - Policy Exception', `Customer wants to cancel their booking on ${bookingDate} but it's within the 72-hour cancellation window. Manual approval required.`, {
                                existingBookingId: confirmedBooking.id,
                                existingBookingDate: confirmedBooking.dateTime,
                                existingService: confirmedBooking.service,
                                action: 'cancel_within_72_hours',
                                policyViolation: true
                            });
                            const errorMsg = "I understand you'd like to cancel your booking. Since it's within 72 hours of your appointment, I've notified our team to assist you with this request. They'll reach out to you shortly to help with the cancellation. 😊";
                            return { response: errorMsg, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: errorMsg }] };
                        }
                        else {
                            const bookingDate = luxon_1.DateTime.fromJSDate(confirmedBooking.dateTime).setZone(this.studioTz).toFormat('MMM dd, yyyy \'at\' h:mm a');
                            if (this.escalationService) {
                                try {
                                    const escalation = await this.prisma.escalation.create({
                                        data: {
                                            customerId,
                                            reason: `Customer wants to cancel booking (${bookingDate}) but encountered an error - requires admin assistance`,
                                            status: 'OPEN',
                                            escalationType: 'booking_cancellation',
                                            metadata: {
                                                existingBookingId: confirmedBooking.id,
                                                existingBookingDate: confirmedBooking.dateTime,
                                                existingService: confirmedBooking.service,
                                                action: 'cancel_error',
                                                error: error.message
                                            }
                                        },
                                        include: { customer: true }
                                    });
                                    if (this.websocketGateway) {
                                        try {
                                            this.websocketGateway.emitNewEscalation(escalation);
                                        }
                                        catch (wsError) {
                                            this.logger.error(`Failed to emit escalation WebSocket event: ${wsError.message}`);
                                        }
                                    }
                                }
                                catch (escalationError) {
                                    this.logger.error(`Failed to create escalation: ${escalationError.message}`);
                                }
                            }
                            await this.createEscalationAlert(customerId, 'reschedule_request', 'Booking Cancellation Error - Admin Assistance Required', `Customer wants to cancel their booking on ${bookingDate} but encountered an error: ${error.message}. Manual intervention required.`, {
                                existingBookingId: confirmedBooking.id,
                                existingBookingDate: confirmedBooking.dateTime,
                                existingService: confirmedBooking.service,
                                action: 'cancel_error',
                                error: error.message
                            });
                            const errorMsg = "I encountered an issue canceling your booking. I've notified our team to assist you with this request. They'll reach out to you shortly. 😊";
                            return { response: errorMsg, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: errorMsg }] };
                        }
                    }
                }
            }
        }
        const cancelPatterns = [
            /(cancel).*(everything|all|booking|appointment|session|it)/i,
            /(delete|clear).*(everything|all|booking|draft)/i,
            /(start|begin).*(over|fresh|again|new)/i,
            /^(forget it|never ?mind|cancel)$/i,
            /(stop|quit|end).*(booking|appointment|session|it)/i,
            /(i changed my mind|never mind|forget about it|on second thought)/i,
        ];
        const isCancelIntent = cancelPatterns.some(pattern => pattern.test(message));
        if (isCancelIntent) {
            this.logger.log(`[CANCELLATION] Detected cancel intent: "${message}"`);
            if (draft) {
                await this.prisma.bookingDraft.delete({ where: { customerId } });
                this.logger.log(`[CANCELLATION] Deleted draft for customer ${customerId}`);
            }
            const confirmedBooking = await this.bookingsService?.getLatestConfirmedBooking(customerId);
            if (confirmedBooking) {
                if (/(yes|sure|confirm|please|do it|go ahead)/i.test(message)) {
                    await this.bookingsService.cancelBooking(confirmedBooking.id);
                    const msg = "All set! I've cancelled your booking. We hope to see you again soon! 💖 If you'd like to make a new booking, just let me know!";
                    return { response: msg, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
                }
                else {
                    const bookingDate = luxon_1.DateTime.fromJSDate(confirmedBooking.dateTime).setZone(this.studioTz).toFormat('MMM dd, yyyy');
                    const msg = `You have a confirmed booking on ${bookingDate}. Are you sure you want to cancel it? Reply 'yes' to confirm cancellation.`;
                    return { response: msg, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
                }
            }
            const msg = draft
                ? "No problem! I've cleared your booking draft. Feel free to start fresh whenever you're ready! 💖"
                : "I don't see any active bookings or drafts to cancel. Would you like to start a new booking? 🌸";
            return { response: msg, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
        }
        const recentAssistantMsgs = history
            .filter((msg) => msg.role === 'assistant')
            .slice(-3)
            .map(msg => msg.content)
            .join(' ');
        const hasOptionPrompt = recentAssistantMsgs.includes('1️⃣') ||
            recentAssistantMsgs.includes('2️⃣') ||
            recentAssistantMsgs.includes('3️⃣') ||
            /Would you like to:/.test(recentAssistantMsgs) ||
            /Cancel that booking and create/.test(recentAssistantMsgs);
        if (hasOptionPrompt) {
            const existingBooking = await this.bookingsService?.getLatestConfirmedBooking(customerId);
            if (existingBooking) {
                const isOption1 = /^1\s*$|^1️⃣\s*$/i.test(message.trim()) || /(cancel|delete).*(existing|old|that|booking)/i.test(message);
                const isOption2 = /^2\s*$|^2️⃣\s*$/i.test(message.trim()) || /(modify|reschedule|change).*(existing|it)/i.test(message);
                const isOption3 = /^3\s*$|^3️⃣\s*$/i.test(message.trim()) || /(different|another).*(date|time)/i.test(message);
                const hasChoice = isOption1 || isOption2 || isOption3;
                if (hasChoice) {
                    if (isOption1) {
                        this.logger.log(`[ESCALATION] Customer ${customerId} selected option 1 - wants to cancel existing booking and create new one - escalating to admin`);
                        if (this.escalationService) {
                            const bookingDate = luxon_1.DateTime.fromJSDate(existingBooking.dateTime).setZone(this.studioTz).toFormat('MMM dd, yyyy \'at\' h:mm a');
                            const escalation = await this.prisma.escalation.create({
                                data: {
                                    customerId,
                                    reason: `Customer wants to cancel existing booking (${bookingDate}) and create a fresh new booking`,
                                    status: 'OPEN',
                                    escalationType: 'booking_cancellation',
                                    metadata: {
                                        existingBookingId: existingBooking.id,
                                        existingBookingDate: existingBooking.dateTime,
                                        existingService: existingBooking.service,
                                        action: 'cancel_and_create_new'
                                    }
                                },
                                include: { customer: true }
                            });
                            this.logger.log(`[ESCALATION] Created booking cancellation escalation for customer ${customerId}`);
                            if (this.websocketGateway) {
                                try {
                                    this.websocketGateway.emitNewEscalation(escalation);
                                }
                                catch (error) {
                                    this.logger.error(`Failed to emit escalation WebSocket event: ${error.message}`);
                                }
                            }
                        }
                        const bookingDate = luxon_1.DateTime.fromJSDate(existingBooking.dateTime).setZone(this.studioTz).toFormat('MMM dd, yyyy \'at\' h:mm a');
                        await this.createEscalationAlert(customerId, 'reschedule_request', 'Booking Cancellation & New Booking Request', `Customer wants to cancel their existing booking on ${bookingDate} and create a fresh new booking. Please assist with cancellation and new booking setup.`, {
                            existingBookingId: existingBooking.id,
                            existingBookingDate: existingBooking.dateTime,
                            existingService: existingBooking.service,
                            action: 'cancel_and_create_new'
                        });
                        const msg = "Got it! To cancel your current booking and create a fresh one, I'll need to connect you with our team to finalize the details. Would you like me to do that for you? 😊";
                        return { response: msg, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
                    }
                    else if (isOption2) {
                        draft = await this.prisma.bookingDraft.upsert({
                            where: { customerId },
                            update: { step: 'reschedule', service: existingBooking.service, conflictResolution: 'modify_existing' },
                            create: { customerId, step: 'reschedule', service: existingBooking.service, conflictResolution: 'modify_existing' },
                        });
                        const msg = "Perfect! When would you like to reschedule your appointment to? 🗓️";
                        return { response: msg, draft, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
                    }
                    else if (isOption3) {
                        if (draft) {
                            await this.prisma.bookingDraft.update({
                                where: { customerId },
                                data: { conflictResolution: 'different_time', date: null, time: null, dateTimeIso: null }
                            });
                        }
                        else {
                            draft = await this.prisma.bookingDraft.create({
                                data: { customerId, step: 'service', conflictResolution: 'different_time' }
                            });
                        }
                        const msg = "Got it! Let's book for a different date. Which package would you like? 🌸";
                        return { response: msg, draft, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
                    }
                }
            }
        }
        const newBookingPatterns = [
            /(new|fresh|another|different).*(booking|appointment|session)/i,
            /(create|make|start).*(new|fresh|another).*(booking)/i,
            /^(book|new booking|fresh booking)$/i,
        ];
        const isNewBookingIntent = newBookingPatterns.some(pattern => pattern.test(message));
        if (isNewBookingIntent) {
            const existingBooking = await this.bookingsService?.getLatestConfirmedBooking(customerId);
            if (existingBooking) {
                this.logger.log(`[NEW BOOKING] User wants new booking but has existing booking on ${existingBooking.dateTime}`);
                if (draft?.conflictResolution === 'cancel_existing') {
                    await this.bookingsService.cancelBooking(existingBooking.id);
                    await this.prisma.bookingDraft.update({
                        where: { customerId },
                        data: { conflictResolution: null }
                    });
                    this.logger.log(`[NEW BOOKING] Cancelled existing booking ${existingBooking.id}, proceeding with new booking`);
                }
                else if (draft?.conflictResolution === 'modify_existing') {
                    draft = await this.prisma.bookingDraft.upsert({
                        where: { customerId },
                        update: { step: 'reschedule', service: existingBooking.service, conflictResolution: null },
                        create: { customerId, step: 'reschedule', service: existingBooking.service },
                    });
                    const msg = "Great! Let's reschedule your existing booking. When would you like to move it to? 🗓️";
                    return { response: msg, draft, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
                }
                else {
                    const isOption1 = /^1\s*$|^1️⃣\s*$/i.test(message.trim()) || /(cancel|delete).*(existing|old|that|booking)/i.test(message);
                    const isOption2 = /^2\s*$|^2️⃣\s*$/i.test(message.trim()) || /(modify|reschedule|change).*(existing|it)/i.test(message);
                    const isOption3 = /^3\s*$|^3️⃣\s*$/i.test(message.trim()) || /(different|another).*(date|time)/i.test(message);
                    const hasChoice = isOption1 || isOption2 || isOption3;
                    if (hasChoice) {
                        if (isOption1) {
                            this.logger.log(`[ESCALATION] Customer ${customerId} wants to cancel existing booking and create new one - escalating to admin`);
                            if (this.escalationService) {
                                const bookingDate = luxon_1.DateTime.fromJSDate(existingBooking.dateTime).setZone(this.studioTz).toFormat('MMM dd, yyyy \'at\' h:mm a');
                                const escalation = await this.prisma.escalation.create({
                                    data: {
                                        customerId,
                                        reason: `Customer wants to cancel existing booking (${bookingDate}) and create a fresh new booking`,
                                        status: 'OPEN',
                                        escalationType: 'booking_cancellation',
                                        metadata: {
                                            existingBookingId: existingBooking.id,
                                            existingBookingDate: existingBooking.dateTime,
                                            existingService: existingBooking.service,
                                            action: 'cancel_and_create_new'
                                        }
                                    },
                                    include: { customer: true }
                                });
                                this.logger.log(`[ESCALATION] Created booking cancellation escalation for customer ${customerId}`);
                                if (this.websocketGateway) {
                                    try {
                                        this.websocketGateway.emitNewEscalation(escalation);
                                    }
                                    catch (error) {
                                        this.logger.error(`Failed to emit escalation WebSocket event: ${error.message}`);
                                    }
                                }
                            }
                            const bookingDate = luxon_1.DateTime.fromJSDate(existingBooking.dateTime).setZone(this.studioTz).toFormat('MMM dd, yyyy \'at\' h:mm a');
                            await this.createEscalationAlert(customerId, 'reschedule_request', 'Booking Cancellation & New Booking Request', `Customer wants to cancel their existing booking on ${bookingDate} and create a fresh new booking. Please assist with cancellation and new booking setup.`, {
                                existingBookingId: existingBooking.id,
                                existingBookingDate: existingBooking.dateTime,
                                existingService: existingBooking.service,
                                action: 'cancel_and_create_new'
                            });
                            const msg = "Got it! To cancel your current booking and create a fresh one, I'll need to connect you with our team to finalize the details. Would you like me to do that for you? 😊";
                            return { response: msg, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
                        }
                        else if (isOption2) {
                            draft = await this.prisma.bookingDraft.upsert({
                                where: { customerId },
                                update: { step: 'reschedule', service: existingBooking.service, conflictResolution: 'modify_existing' },
                                create: { customerId, step: 'reschedule', service: existingBooking.service, conflictResolution: 'modify_existing' },
                            });
                            const msg = "Perfect! When would you like to reschedule your appointment to? 🗓️";
                            return { response: msg, draft, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
                        }
                        else if (isOption3) {
                            if (draft) {
                                await this.prisma.bookingDraft.update({
                                    where: { customerId },
                                    data: { conflictResolution: 'different_time', date: null, time: null, dateTimeIso: null }
                                });
                            }
                            else {
                                draft = await this.prisma.bookingDraft.create({
                                    data: { customerId, step: 'service', conflictResolution: 'different_time' }
                                });
                            }
                            const msg = "Got it! Let's book for a different date. Which package would you like? 🌸";
                            return { response: msg, draft, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
                        }
                    }
                    else {
                        const bookingDate = luxon_1.DateTime.fromJSDate(existingBooking.dateTime).setZone(this.studioTz).toFormat('MMM dd, yyyy \'at\' h:mm a');
                        const msg = `I see you have a booking scheduled for ${bookingDate}. 💖\n\nWould you like to:\n1️⃣ Cancel that booking and create a fresh one\n2️⃣ Modify/reschedule your existing booking\n3️⃣ Keep it and book for a different date\n\nJust let me know what works best for you!`;
                        return { response: msg, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
                    }
                }
            }
        }
        let rescheduleDraft = await this.prisma.bookingDraft.findUnique({ where: { customerId } });
        if (!rescheduleDraft && draft) {
            rescheduleDraft = draft;
        }
        if (rescheduleDraft && (rescheduleDraft.step === 'reschedule' || rescheduleDraft.step === 'reschedule_confirm')) {
            this.logger.log(`[RESCHEDULE] Continuing reschedule flow for customer ${customerId}, draft step: ${rescheduleDraft.step}, bookingId: ${rescheduleDraft.bookingId}`);
            draft = rescheduleDraft;
            const faqPatterns = [
                /what (is|are|was|were)/i,
                /(tell|show|explain|describe).*(me|about)/i,
                /(how|when|where|why)/i,
                /my (last|latest|previous|current|next)/i,
                /(package|booking|appointment).*(did|have|choose|select|pick)/i,
            ];
            const isFaqQuestion = faqPatterns.some(pattern => pattern.test(message));
            if (isFaqQuestion && !/(to|for|at|on)\s+\d/i.test(message)) {
                this.logger.log(`[RESCHEDULE] User asked FAQ question while in reschedule mode, routing to FAQ`);
                const faqResponse = await this.answerFaq(message, history, undefined, customerId);
                const responseText = typeof faqResponse === 'object' && 'text' in faqResponse ? faqResponse.text : faqResponse;
                return { response: responseText, draft, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: responseText }] };
            }
            if (!draft.bookingId) {
                const allBookings = await this.prisma.booking.findMany({
                    where: { customerId, status: 'confirmed', dateTime: { gte: new Date() } },
                    orderBy: { dateTime: 'asc' },
                });
                if (allBookings.length === 0) {
                    const msg = "I can't find a current booking to reschedule. Would you like to make a new one? 💖";
                    return { response: msg, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
                }
                let targetBooking = allBookings[0];
                let matchedSelection = allBookings.length === 1;
                const monthMap = {
                    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
                    apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
                    aug: 7, august: 7, sep: 8, september: 8, oct: 9, october: 9,
                    nov: 10, november: 10, dec: 11, december: 11,
                };
                const monthNames = '(dec|december|jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|september|oct|october|nov|november)';
                const dateMatchDayFirst = message.match(new RegExp(`(\\d{1,2})(st|nd|rd|th)?\\s*${monthNames}`, 'i'));
                const dateMatchMonthFirst = message.match(new RegExp(`(?:the one on |on )?${monthNames}\\s*(\\d{1,2})(?:st|nd|rd|th)?`, 'i'));
                let day;
                let monthStr;
                if (dateMatchDayFirst) {
                    day = parseInt(dateMatchDayFirst[1]);
                    monthStr = dateMatchDayFirst[3].toLowerCase();
                }
                else if (dateMatchMonthFirst) {
                    day = parseInt(dateMatchMonthFirst[2]);
                    monthStr = dateMatchMonthFirst[1].toLowerCase();
                }
                const dateMatch = dateMatchDayFirst || dateMatchMonthFirst;
                if (dateMatch && allBookings.length > 1 && day !== undefined && monthStr) {
                    const month = monthMap[monthStr];
                    const matched = allBookings.find(b => {
                        const dt = luxon_1.DateTime.fromJSDate(b.dateTime).setZone(this.studioTz);
                        return dt.month === month + 1 && dt.day === day;
                    });
                    if (matched) {
                        targetBooking = matched;
                        matchedSelection = true;
                    }
                }
                else if (allBookings.length > 1) {
                    const dayOnlyMatch = message.match(/(?:the one on |on )?(\d{1,2})(?:st|nd|rd|th)?/i);
                    if (dayOnlyMatch) {
                        const day = parseInt(dayOnlyMatch[1]);
                        const matchedBookings = allBookings.filter(b => {
                            const dt = luxon_1.DateTime.fromJSDate(b.dateTime).setZone(this.studioTz);
                            return dt.day === day;
                        });
                        if (matchedBookings.length === 1) {
                            targetBooking = matchedBookings[0];
                            matchedSelection = true;
                        }
                        else if (matchedBookings.length > 1) {
                            const bookingsList = matchedBookings.map((b, idx) => {
                                const dt = luxon_1.DateTime.fromJSDate(b.dateTime).setZone(this.studioTz);
                                return `${idx + 1}️⃣ ${b.service} on ${dt.toFormat('MMM dd, yyyy')} at ${dt.toFormat('h:mm a')}`;
                            }).join('\n');
                            const msg = `I found ${matchedBookings.length} bookings on the ${day}${this.getOrdinalSuffix(day)}:\n\n${bookingsList}\n\nWhich one would you like to reschedule? Please specify the time or service name. 🗓️`;
                            return { response: msg, draft, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
                        }
                    }
                    const serviceMatch = allBookings.find(b => b.service && message.toLowerCase().includes(b.service.toLowerCase()));
                    if (serviceMatch) {
                        targetBooking = serviceMatch;
                        matchedSelection = true;
                    }
                }
                if (allBookings.length > 1 && !matchedSelection) {
                    const bookingsList = allBookings.map((b, idx) => {
                        const dt = luxon_1.DateTime.fromJSDate(b.dateTime).setZone(this.studioTz);
                        return `${idx + 1}️⃣ ${b.service} on ${dt.toFormat('MMM dd, yyyy')} at ${dt.toFormat('h:mm a')}`;
                    }).join('\n');
                    const msg = `You have ${allBookings.length} upcoming bookings:\n\n${bookingsList}\n\nWhich one would you like to reschedule? Just tell me the date (e.g., "the one on 5th February") 🗓️`;
                    return { response: msg, draft, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
                }
                const bookingDt = luxon_1.DateTime.fromJSDate(targetBooking.dateTime).setZone(this.studioTz);
                draft = await this.prisma.bookingDraft.update({
                    where: { customerId },
                    data: {
                        step: 'reschedule',
                        bookingId: targetBooking.id,
                        service: targetBooking.service,
                        name: targetBooking.recipientName || undefined,
                    },
                });
                const msg = `Got it! I'll help you reschedule your ${targetBooking.service} appointment on ${bookingDt.toFormat('MMM dd')}. 🗓️ When would you like to move it to? (e.g. "12th Dec, 3pm")`;
                return { response: msg, draft, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
            }
            const extraction = await this.extractBookingDetails(message, history);
            draft = await this.mergeIntoDraft(customerId, extraction);
            if (draft.date && draft.time) {
                const normalized = this.normalizeDateTime(draft.date, draft.time);
                if (normalized) {
                    const newDateObj = new Date(normalized.isoUtc);
                    const excludeBookingId = draft.bookingId || undefined;
                    const conflictResult = await this.checkBookingConflicts(customerId, newDateObj, excludeBookingId, draft.service);
                    if (conflictResult.conflict) {
                        const msg = `I'm sorry, but it looks like you already have a booking around that time. ${conflictResult.conflict} Would you like to try a different time?`;
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
                    const bookingIdToUpdate = draft.bookingId;
                    if (bookingIdToUpdate) {
                        await this.bookingsService.updateBooking(bookingIdToUpdate, { dateTime: newDateObj });
                        await this.prisma.bookingDraft.delete({ where: { customerId } }).catch(() => { });
                        const prettyDate = luxon_1.DateTime.fromJSDate(newDateObj).setZone(this.studioTz).toFormat('ccc, LLL dd, yyyy \'at\' h:mm a');
                        const msg = `Done! Your appointment has been rescheduled to *${prettyDate}*. See you then! 💖`;
                        return { response: msg, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
                    }
                    await this.prisma.bookingDraft.update({
                        where: { customerId },
                        data: {
                            step: 'reschedule_confirm',
                            dateTimeIso: normalized.isoUtc
                        }
                    });
                    const prettyDate = luxon_1.DateTime.fromJSDate(newDateObj).setZone(this.studioTz).toFormat('ccc, LLL dd, yyyy \'at\' h:mm a');
                    const msg = `Great! I found an available slot on *${prettyDate}*. 🎉\n\nTo confirm this reschedule, please reply with "YES" or "CONFIRM". If you'd like a different time, just let me know! 💖`;
                    return { response: msg, draft, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
                }
            }
            if (draft.date && !draft.time) {
                const dateObj = this.normalizeDateTime(draft.date, '09:00');
                let prettyDate = draft.date;
                if (dateObj) {
                    prettyDate = luxon_1.DateTime.fromISO(dateObj.isoUtc).setZone(this.studioTz).toFormat('EEEE, MMM d');
                }
                else if (/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) {
                    prettyDate = luxon_1.DateTime.fromISO(draft.date).setZone(this.studioTz).toFormat('EEEE, MMM d');
                }
                const msg = `Got it, ${prettyDate}. What time would work for you? (e.g. 2pm or 3pm) 🗓️`;
                return { response: msg, draft, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
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
                const { formatPhoneNumber } = require('../../utils/booking');
                const formattedPhone = formatPhoneNumber(customer.phone);
                await this.prisma.bookingDraft.update({
                    where: { customerId },
                    data: { recipientPhone: formattedPhone }
                });
                this.logger.log(`[SMART EXTRACTION] Set recipientPhone to customer phone: ${customer.phone} -> ${formattedPhone}`);
                draft = await this.prisma.bookingDraft.findUnique({ where: { customerId } });
            }
        }
        const businessNameKeywords = ['business name', 'what is the business called', 'who are you', 'company name', 'studio name', 'what is this place', 'what is this business', 'what is your name'];
        if (businessNameKeywords.some((kw) => lower.includes(kw))) {
            const nameResponse = `Our business is called ${this.businessName}. If you have any questions about our services or need assistance, I'm here to help! 😊`;
            const updatedHistory = [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: nameResponse }];
            return { response: nameResponse, draft: null, updatedHistory };
        }
        const isMyAppointmentQuery = /\b(my|upcoming|coming up|next|upcoming)\b.*\b(appointment|booking|session|shoot)\b/i.test(message) ||
            /\b(tell me about|what is|when is|details of)\b.*\b(my )?(appointment|booking|session|shoot)\b/i.test(message) ||
            /\b(appointment|booking|session)\b.*\b(coming up|upcoming|next)\b/i.test(message);
        if (isMyAppointmentQuery && bookingsService) {
            const allConfirmed = await bookingsService.getActiveBookings(customerId);
            const now = new Date();
            const upcoming = (allConfirmed || [])
                .filter((b) => new Date(b.dateTime) >= now)
                .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
            if (upcoming.length === 0) {
                const noBookingResponse = "I don't see any upcoming appointments for you. Would you like to book a session? 💖";
                const updatedHistory = [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: noBookingResponse }];
                return { response: noBookingResponse, draft: null, updatedHistory };
            }
            const lines = upcoming.slice(0, 5).map((b, idx) => {
                const dt = luxon_1.DateTime.fromJSDate(b.dateTime).setZone(this.studioTz);
                return `${idx + 1}. *${b.service}* — ${dt.toFormat('EEE, MMM d, yyyy')} at ${dt.toFormat('h:mm a')}`;
            });
            const myBookingResponse = upcoming.length === 1
                ? `Your next appointment:\n\n*${upcoming[0].service}* on ${luxon_1.DateTime.fromJSDate(upcoming[0].dateTime).setZone(this.studioTz).toFormat('EEEE, MMMM d, yyyy')} at ${luxon_1.DateTime.fromJSDate(upcoming[0].dateTime).setZone(this.studioTz).toFormat('h:mm a')}. See you then! 💖`
                : `Here are your upcoming appointments:\n\n${lines.join('\n')}\n\nNeed to reschedule or have questions? Just ask! 💖`;
            const updatedHistory = [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: myBookingResponse }];
            return { response: myBookingResponse, draft: null, updatedHistory };
        }
        const businessDescriptionPatterns = [
            /what.*business.*do/i,
            /what.*you.*do/i,
            /what.*services/i,
            /what.*do.*you.*offer/i,
            /what.*is.*this.*business/i,
            /tell.*me.*about.*business/i,
            /describe.*business/i,
            /what.*does.*your.*business/i
        ];
        const isBusinessDescriptionQuery = businessDescriptionPatterns.some(pattern => pattern.test(message));
        if (isBusinessDescriptionQuery) {
            const businessResponse = `Thank you for your interest! ${this.businessName} specializes in professional maternity photography services. We offer beautiful studio maternity photoshoots with professional makeup, styling, and a variety of packages to capture this special time in your life. Our packages range from intimate sessions to full VIP experiences, all designed to make you feel elegant and celebrated. We're located at ${this.businessLocation.replace(' We look forward to welcoming you! 💖', '')}. Would you like to know more about our packages or book a session? 💖`;
            const updatedHistory = [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: businessResponse }];
            return { response: businessResponse, draft: null, updatedHistory };
        }
        const isOwnPhotographerQuestion = /\b(bring|have|brings|bringing)\b.*\b(my|own|personal|a)\b.*\b(photographer|videographer|photography|videography)\b/i.test(message) ||
            /\b(photographer|videographer)\b.*\b(bring|have|join|come)\b/i.test(message);
        if (isOwnPhotographerQuestion) {
            const photographerResponse = "Our packages include a professional photographer for your shoot. If you'd like to have your own photographer or videographer present as well, please let us know in advance and we'll check with the studio — we want to make sure everything runs smoothly for you! 💖";
            const updatedHistory = [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: photographerResponse }];
            return { response: photographerResponse, draft: null, updatedHistory };
        }
        const familyPartnerKeywords = ['family', 'partner', 'husband', 'wife', 'spouse', 'children', 'kids', 'come with', 'bring', 'accompany', 'join'];
        const isFamilyQuestion = familyPartnerKeywords.some(kw => lower.includes(kw)) &&
            (lower.includes('can') || lower.includes('may') || lower.includes('allowed') || lower.includes('welcome')) &&
            !/\bphotographer\b|\bvideographer\b/i.test(message);
        if (isFamilyQuestion) {
            const familyResponse = "Yes, absolutely! Partners and family members are always welcome to join your photoshoot. Many of our packages include couple and family shots - it's a beautiful way to celebrate this journey together! 💖";
            const updatedHistory = [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: familyResponse }];
            return { response: familyResponse, draft: null, updatedHistory };
        }
        const businessDescriptionKeywords = ['what does your business do', 'what do you do', 'what services', 'what are your services', 'what do you offer', 'what services do you offer', 'tell me about your business', 'what is your business about', 'what kind of business', 'what type of business'];
        if (businessDescriptionKeywords.some((kw) => lower.includes(kw))) {
            const descriptionResponse = `Thank you for reaching out! ${this.businessDescription}\n\nWe offer studio maternity photography packages ranging from KSH 10,000 to KSH 50,000, each designed to make you feel beautiful and celebrated during this special time. Our packages include professional makeup, styling, and various options like balloon backdrops, photobooks, and more.\n\nWould you like to know more about our packages or book a session? I'm here to help! 💖`;
            const updatedHistory = [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: descriptionResponse }];
            return { response: descriptionResponse, draft: null, updatedHistory };
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
        const ackRecentAssistantMsgs = history
            .filter((msg) => msg.role === 'assistant')
            .slice(-3)
            .map(msg => msg.content.toLowerCase())
            .join(' ');
        const recentUserMsgs = history
            .filter((msg) => msg.role === 'user')
            .slice(-2)
            .map(msg => msg.content.toLowerCase())
            .join(' ');
        const acknowledgmentPatterns = [
            /^(ok|okay|sure|yes|yeah|yep|alright|sounds good|got it|understood|perfect|great|thanks|thank you)/i,
            /^(ok|okay|sure|yes|yeah|yep|alright|sounds good|got it|understood|perfect|great|thanks|thank you).*(then|i will|i'll)/i,
            /^(okay|ok|sure|yes|yeah|yep|alright).*then.*(i will|i'll)/i,
            /i will (come|bring|do)/i,
            /i'll (come|bring|do)/i,
            /that's (fine|good|okay|ok)/i,
            /(that|it) (sounds|is) (good|fine|okay|ok|great)/i,
        ];
        const isAcknowledgment = acknowledgmentPatterns.some(pattern => pattern.test(message)) &&
            !/(book|appointment|schedule|reserve|available|slot|date|time|when|what time|make a booking|new booking)/i.test(message);
        const recentWasFaq = /(welcome|fine|allowed|bring|include|can i|is it|are.*allowed|photographer|family|partner|guests|questions|feel free|anything else)/i.test(ackRecentAssistantMsgs) &&
            !/(book|appointment|schedule|reserve|available|slot|date|time|when|what time|make a booking|new booking)/i.test(ackRecentAssistantMsgs);
        const previousWasQuestion = /(can i|is it|are.*allowed|what|how|when|where|why|do you|does|photographer)/i.test(recentUserMsgs);
        if (isAcknowledgment && (recentWasFaq || previousWasQuestion) && !hasDraft) {
            const acknowledgmentResponse = `Perfect! If you have any other questions or need help with anything else, feel free to ask. 😊`;
            return {
                response: acknowledgmentResponse,
                draft: null,
                updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: acknowledgmentResponse }]
            };
        }
        let intent = 'other';
        const confidenceThreshold = 0.7;
        if (intentAnalysis && intentAnalysis.primaryIntent) {
            const primaryIntent = intentAnalysis.primaryIntent;
            const confidence = intentAnalysis.confidence || 0.5;
            this.logger.debug(`[INTENT] Advanced analysis: ${primaryIntent} (confidence: ${confidence})`);
            if (confidence < confidenceThreshold) {
                const clarifyingQuestion = this.generateClarifyingQuestion(intentAnalysis, message);
                if (clarifyingQuestion) {
                    this.logger.log(`[INTENT] Low confidence (${confidence}), asking for clarification`);
                    return {
                        response: clarifyingQuestion,
                        draft: draft || null,
                        updatedHistory: [
                            ...history.slice(-this.historyLimit),
                            { role: 'user', content: message },
                            { role: 'assistant', content: clarifyingQuestion }
                        ],
                        metrics: { strategyUsed: 'fallback', isFallback: true }
                    };
                }
            }
            if (primaryIntent === 'booking' || primaryIntent === 'reschedule' || primaryIntent === 'availability') {
                intent = 'booking';
            }
            else if (primaryIntent === 'faq' || primaryIntent === 'package_inquiry' || primaryIntent === 'price_inquiry') {
                intent = 'faq';
            }
            else if (primaryIntent === 'complaint' || primaryIntent === 'objection') {
                intent = 'other';
            }
            else {
                intent = 'other';
            }
            if (intentAnalysis.secondaryIntents && intentAnalysis.secondaryIntents.length > 0) {
                this.logger.debug(`[INTENT] Secondary intents detected: ${intentAnalysis.secondaryIntents.join(', ')}`);
            }
            if (/(backdrop|background|studio set|flower wall|portfolio|show.*(image|photo|picture|portfolio)|see.*(image|photo|picture|example))/i.test(message)) {
                intent = 'faq';
                this.logger.log('[INTENT] Override: FAQ (backdrop/image request)');
            }
            else if (hasDraft && /(can i (bring|have|include|add)|is it (okay|ok|allowed|fine)|are.*allowed|what (can|should) i (bring|wear|do)|can.*(family|partner|husband|spouse|children|kids|baby)|bring.*(family|partner|husband|spouse|children|kids|guests))/i.test(message)) {
                intent = 'faq';
                this.logger.log('[INTENT] Override: FAQ (policy question)');
            }
        }
        else {
            this.logger.warn('[INTENT] Advanced intent analysis not available, using fallback');
            if (/(backdrop|background|studio set|flower wall|portfolio|show.*(image|photo|picture|portfolio)|see.*(image|photo|picture|example))/i.test(message)) {
                intent = 'faq';
            }
            else if (hasDraft && /(can i (bring|have|include|add)|is it (okay|ok|allowed|fine)|are.*allowed|what (can|should) i (bring|wear|do)|can.*(family|partner|husband|spouse|children|kids|baby)|bring.*(family|partner|husband|spouse|children|kids|guests))/i.test(message)) {
                intent = 'faq';
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
                    intent = 'other';
                }
            }
        }
        if (intent === 'booking' && hasDraft) {
            try {
                await this.prisma.bookingDraft.deleteMany({ where: { customerId } });
                draft = null;
                hasDraft = false;
                this.logger.log(`[NEW BOOKING] Cancelled existing unpaid draft for customer ${customerId} when starting new booking`);
            }
            catch (error) {
                this.logger.debug(`[NEW BOOKING] Draft already deleted or doesn't exist for customer ${customerId}`);
                draft = null;
                hasDraft = false;
            }
        }
        if (intent === 'faq' || intent === 'other') {
            const reply = await this.answerFaq(message, history, undefined, customerId, enrichedContext);
            const replyText = typeof reply === 'object' && 'text' in reply ? reply.text : reply;
            return { response: reply, draft: null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: replyText }], metrics: { strategyUsed: 'faq' } };
        }
        const platformForBooking = enrichedContext?.platform || 'whatsapp';
        if (platformForBooking !== 'whatsapp') {
            const redirectMsg = this.getWhatsAppOnlyRedirectMessage();
            return {
                response: redirectMsg,
                draft: null,
                updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: redirectMsg }],
                metrics: { strategyUsed: 'redirect_to_whatsapp', platform: platformForBooking }
            };
        }
        const bookingStrategy = this.strategies.find(s => s instanceof booking_strategy_1.BookingStrategy);
        if (bookingStrategy) {
            const bookingResult = await bookingStrategy.generateResponse(message, { ...strategyContext, intent: 'booking' });
            if (bookingResult)
                return { ...bookingResult, metrics: { strategyUsed: 'booking' } };
        }
        this.logger.log(`[INTENT] Defaulting to FAQ/General for message: "${message}"`);
        const faqResponse = await this.answerFaq(message, history, undefined, customerId);
        await this.trackConversationMetrics(customerId, {
            intent: 'faq',
            duration: 0,
            messagesCount: history.length + 1,
            resolved: true
        });
        const faqText = typeof faqResponse === 'object' && faqResponse !== null && 'text' in faqResponse ? faqResponse.text : faqResponse;
        return { response: faqResponse, draft: hasDraft ? draft : null, updatedHistory: [...history.slice(-this.historyLimit), { role: 'user', content: message }, { role: 'assistant', content: faqText }], metrics: { strategyUsed: 'fallback', isFallback: true } };
    }
    async addKnowledge(question, answer, category = 'general') {
        try {
            const existing = await this.prisma.knowledgeBase.findFirst({
                where: { question },
            });
            if (existing) {
                await this.prisma.knowledgeBase.update({
                    where: { id: existing.id },
                    data: {
                        answer,
                        category,
                        embedding: await this.generateEmbedding(question + ' ' + answer),
                    },
                });
            }
            else {
                await this.prisma.knowledgeBase.create({
                    data: {
                        question,
                        answer,
                        category,
                        embedding: await this.generateEmbedding(question + ' ' + answer),
                    },
                });
            }
        }
        catch (err) {
            this.logger.error(`addKnowledge: Failed to save to DB: ${err.message}`, err);
            return;
        }
        if (!this.index) {
            this.logger.debug('addKnowledge: Pinecone index not available, saved to DB only.');
            return;
        }
        try {
            await this.index.upsert([{
                    id: `kb-${Date.now()}`,
                    values: await this.generateEmbedding(question + ' ' + answer),
                    metadata: { question, answer, category },
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
    async handleConversationWithLearning(message, customerId, history = [], bookingsService, retryCount = 0, enrichedContext) {
        this.logger.warn('[DEPRECATED] handleConversationWithLearning() is deprecated. Use handleConversation() instead - it now includes all learning capabilities.');
        return this.handleConversation(message, customerId, history, bookingsService, retryCount, enrichedContext);
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(12, (0, common_1.Inject)((0, common_1.forwardRef)(() => bookings_service_1.BookingsService))),
    __param(12, (0, common_1.Optional)()),
    __param(13, (0, common_1.Optional)()),
    __param(14, (0, common_1.Optional)()),
    __param(15, (0, bull_1.InjectQueue)('aiQueue')),
    __param(16, (0, common_1.Optional)()),
    __param(17, (0, common_1.Inject)((0, common_1.forwardRef)(() => websocket_gateway_1.WebsocketGateway))),
    __param(17, (0, common_1.Optional)()),
    __param(18, (0, common_1.Inject)((0, common_1.forwardRef)(() => whatsapp_service_1.WhatsappService))),
    __param(18, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        circuit_breaker_service_1.CircuitBreakerService,
        customer_memory_service_1.CustomerMemoryService,
        conversation_learning_service_1.ConversationLearningService,
        domain_expertise_service_1.DomainExpertiseService,
        advanced_intent_service_1.AdvancedIntentService,
        personalization_service_1.PersonalizationService,
        response_humanizer_service_1.ResponseHumanizerService,
        feedback_loop_service_1.FeedbackLoopService,
        predictive_analytics_service_1.PredictiveAnalyticsService,
        response_quality_service_1.ResponseQualityService,
        bookings_service_1.BookingsService,
        messages_service_1.MessagesService,
        escalation_service_1.EscalationService, Object, notifications_service_1.NotificationsService,
        websocket_gateway_1.WebsocketGateway,
        whatsapp_service_1.WhatsappService])
], AiService);
//# sourceMappingURL=ai.service.js.map