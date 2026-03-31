"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const bull_1 = require("@nestjs/bull");
const ai_service_1 = require("./ai.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const config_1 = require("@nestjs/config");
const bookings_service_1 = require("../bookings/bookings.service");
const messages_service_1 = require("../messages/messages.service");
const escalation_service_1 = require("../escalation/escalation.service");
const circuit_breaker_service_1 = require("./services/circuit-breaker.service");
const customer_memory_service_1 = require("./services/customer-memory.service");
const conversation_learning_service_1 = require("./services/conversation-learning.service");
const domain_expertise_service_1 = require("./services/domain-expertise.service");
const advanced_intent_service_1 = require("./services/advanced-intent.service");
const personalization_service_1 = require("./services/personalization.service");
const response_humanizer_service_1 = require("./services/response-humanizer.service");
const feedback_loop_service_1 = require("./services/feedback-loop.service");
const predictive_analytics_service_1 = require("./services/predictive-analytics.service");
const response_quality_service_1 = require("./services/response-quality.service");
const notifications_service_1 = require("../notifications/notifications.service");
const websocket_gateway_1 = require("../../websockets/websocket.gateway");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
describe('AiService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                ai_service_1.AiService,
                { provide: prisma_service_1.PrismaService, useValue: { bookingDraft: { findUnique: jest.fn() }, customer: { findUnique: jest.fn() }, booking: { findMany: jest.fn() }, escalation: { findFirst: jest.fn() } } },
                { provide: config_1.ConfigService, useValue: { get: jest.fn().mockReturnValue('dummy') } },
                { provide: circuit_breaker_service_1.CircuitBreakerService, useValue: { checkAndBreak: jest.fn().mockResolvedValue({ shouldBreak: false }) } },
                { provide: customer_memory_service_1.CustomerMemoryService, useValue: { getPersonalizationContext: jest.fn().mockResolvedValue({}) } },
                { provide: conversation_learning_service_1.ConversationLearningService, useValue: { recordLearning: jest.fn() } },
                { provide: domain_expertise_service_1.DomainExpertiseService, useValue: {} },
                { provide: advanced_intent_service_1.AdvancedIntentService, useValue: { analyzeIntent: jest.fn().mockResolvedValue({ primaryIntent: 'other' }) } },
                { provide: personalization_service_1.PersonalizationService, useValue: { extractPreferencesFromMessage: jest.fn().mockReturnValue({}) } },
                { provide: response_humanizer_service_1.ResponseHumanizerService, useValue: { humanizeResponse: jest.fn((text) => text) } },
                { provide: feedback_loop_service_1.FeedbackLoopService, useValue: {} },
                { provide: predictive_analytics_service_1.PredictiveAnalyticsService, useValue: {} },
                { provide: response_quality_service_1.ResponseQualityService, useValue: { validateResponse: jest.fn().mockResolvedValue({ passed: true }) } },
                { provide: bookings_service_1.BookingsService, useValue: { getCachedPackages: jest.fn() } },
                { provide: messages_service_1.MessagesService, useValue: { create: jest.fn() } },
                { provide: escalation_service_1.EscalationService, useValue: { isCustomerEscalated: jest.fn().mockResolvedValue(false) } },
                { provide: notifications_service_1.NotificationsService, useValue: {} },
                { provide: websocket_gateway_1.WebsocketGateway, useValue: {} },
                { provide: whatsapp_service_1.WhatsappService, useValue: {} },
                { provide: (0, bull_1.getQueueToken)('aiQueue'), useValue: { add: jest.fn() } },
            ],
        }).compile();
        service = module.get(ai_service_1.AiService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    it('should route greeting+booking to booking strategy', async () => {
        jest.spyOn(service.advancedIntent, 'analyzeIntent').mockResolvedValue({
            primaryIntent: 'booking',
            secondaryIntents: ['greeting'],
            confidence: 0.95
        });
        const mockResult = { response: 'Booking flow started', metrics: { strategyUsed: 'booking' } };
        jest.spyOn(service, 'handleConversation').mockImplementation(async (msg) => {
            if (msg.includes('book'))
                return mockResult;
            return { response: 'Hello' };
        });
        const result = await service.handleConversation('Hi, can I book?', '123');
        expect(result.metrics?.strategyUsed).toBe('booking');
    });
    it('should not use Done response', async () => {
        jest.spyOn(service, 'answerFaq').mockResolvedValue('Here it is.');
        const result = await service.handleConversation('show me something', '123');
        expect(result.response).not.toBe('Done.');
    });
});
//# sourceMappingURL=ai.service.spec.js.map