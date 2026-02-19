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
jest.mock('openai');
describe('AiService', () => {
    let service;
    let prisma;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                ai_service_1.AiService,
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: {
                        bookingDraft: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
                        customer: { findUnique: jest.fn(), update: jest.fn() },
                        booking: { findMany: jest.fn(), findFirst: jest.fn() },
                        payment: { findFirst: jest.fn() },
                        escalation: { findFirst: jest.fn() },
                        communicationLog: { create: jest.fn() }
                    }
                },
                {
                    provide: config_1.ConfigService,
                    useValue: {
                        get: jest.fn((key) => {
                            if (key === 'OPENAI_API_KEY')
                                return 'dummy-key';
                            return null;
                        })
                    }
                },
                { provide: circuit_breaker_service_1.CircuitBreakerService, useValue: { checkAndBreak: jest.fn().mockResolvedValue({ shouldBreak: false }), recordTrip: jest.fn() } },
                { provide: customer_memory_service_1.CustomerMemoryService, useValue: { getPersonalizationContext: jest.fn().mockResolvedValue({}), updatePreferences: jest.fn(), addConversationSummary: jest.fn() } },
                { provide: conversation_learning_service_1.ConversationLearningService, useValue: { recordLearning: jest.fn() } },
                { provide: domain_expertise_service_1.DomainExpertiseService, useValue: {} },
                { provide: advanced_intent_service_1.AdvancedIntentService, useValue: { analyzeIntent: jest.fn().mockResolvedValue({ primaryIntent: 'other' }) } },
                { provide: personalization_service_1.PersonalizationService, useValue: { extractPreferencesFromMessage: jest.fn().mockReturnValue({}), generateGreeting: jest.fn() } },
                { provide: response_humanizer_service_1.ResponseHumanizerService, useValue: { humanizeResponse: jest.fn((text) => text) } },
                { provide: feedback_loop_service_1.FeedbackLoopService, useValue: {} },
                { provide: predictive_analytics_service_1.PredictiveAnalyticsService, useValue: {} },
                { provide: response_quality_service_1.ResponseQualityService, useValue: { validateResponse: jest.fn().mockResolvedValue({ passed: true }) } },
                { provide: bookings_service_1.BookingsService, useValue: { getCachedPackages: jest.fn(), cleanupStaleDraft: jest.fn(), getLatestConfirmedBooking: jest.fn() } },
                { provide: messages_service_1.MessagesService, useValue: { create: jest.fn() } },
                { provide: escalation_service_1.EscalationService, useValue: { isCustomerEscalated: jest.fn().mockResolvedValue(false), createEscalation: jest.fn() } },
                { provide: notifications_service_1.NotificationsService, useValue: {} },
                { provide: websocket_gateway_1.WebsocketGateway, useValue: {} },
                { provide: whatsapp_service_1.WhatsappService, useValue: {} },
                { provide: (0, bull_1.getQueueToken)('aiQueue'), useValue: { add: jest.fn() } },
            ],
        }).compile();
        service = module.get(ai_service_1.AiService);
        prisma = module.get(prisma_service_1.PrismaService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('attemptRecovery', () => {
        it('should retry with shorter history on context_length_exceeded', async () => {
            const error = { code: 'context_length_exceeded' };
            const context = {
                message: 'test',
                customerId: '123',
                history: [{ role: 'user', content: '1' }, { role: 'user', content: '2' }, { role: 'user', content: '3' }],
                retryCount: 0,
            };
            jest.spyOn(service, 'handleConversation').mockResolvedValue({ response: 'Recovered' });
            const result = await service.attemptRecovery(error, context);
            expect(service.handleConversation).toHaveBeenCalledWith('test', '123', [{ role: 'user', content: '2' }, { role: 'user', content: '3' }], undefined, 1);
            expect(result).toEqual({ response: 'Recovered' });
        });
        it('should return fallback message on max retries', async () => {
            const error = { code: 'context_length_exceeded' };
            const context = {
                message: 'test',
                customerId: '123',
                history: [],
                retryCount: 2,
            };
            const result = await service.attemptRecovery(error, context);
            expect(result.response).toContain("I'm having a little trouble");
        });
    });
    describe('Strategy Pattern Integration', () => {
        it('should use PackageInquiryStrategy for package queries', async () => {
            jest.spyOn(service, 'getCachedPackages').mockResolvedValue([
                { name: 'Studio Classic', price: 10000, features: ['1 hour', '1 outfit'] }
            ]);
            jest.spyOn(service, 'detectFrustration').mockResolvedValue(false);
            jest.spyOn(service, 'checkRateLimit').mockResolvedValue(true);
            jest.spyOn(service, 'sanitizeInput').mockReturnValue('tell me about studio classic');
            const result = await service.handleConversation('tell me about studio classic', '123', []);
            expect(result.response).toContain('Studio Classic');
            expect(result.response).toContain('10000');
        });
        it('should use BookingStrategy when draft exists', async () => {
            prisma.bookingDraft.findUnique.mockResolvedValue({
                customerId: '123',
                service: 'Studio Classic',
                step: 'date'
            });
            jest.spyOn(service, 'detectFrustration').mockResolvedValue(false);
            jest.spyOn(service, 'checkRateLimit').mockResolvedValue(true);
            jest.spyOn(service, 'sanitizeInput').mockReturnValue('tomorrow');
            jest.spyOn(service, 'extractBookingDetails').mockResolvedValue({ date: '2025-12-05' });
            jest.spyOn(service, 'mergeIntoDraft').mockResolvedValue({
                customerId: '123',
                service: 'Studio Classic',
                step: 'date',
                date: '2025-12-05'
            });
            jest.spyOn(service, 'checkAndCompleteIfConfirmed').mockResolvedValue({ action: 'continue' });
            jest.spyOn(service, 'generateBookingReply').mockResolvedValue('What time?');
            const result = await service.handleConversation('tomorrow', '123', []);
            expect(result.response).toBe('What time?');
        });
        it('should use BookingStrategy even if message starts with greeting', async () => {
            jest.spyOn(service, 'detectFrustration').mockResolvedValue(false);
            jest.spyOn(service, 'checkRateLimit').mockResolvedValue(true);
            jest.spyOn(service.advancedIntent, 'analyzeIntent').mockResolvedValue({
                primaryIntent: 'booking',
                secondaryIntents: ['greeting'],
                confidence: 0.95
            });
            const result = await service.handleConversation('Hi, can I book the standard package?', '123', []);
            expect(result.response).not.toContain("How can I help make your maternity session special today?");
            expect(result.metrics?.strategyUsed).toBe('booking');
        });
        it('should NOT use robotic "Done." opener', async () => {
            jest.spyOn(service, 'answerFaq').mockResolvedValue('Here are some outfits.');
            const result = await service.handleConversation('show me outfits', '123', []);
            expect(result.response).not.toMatch(/^Done\./);
        });
    });
});
//# sourceMappingURL=ai.service.spec.js.map