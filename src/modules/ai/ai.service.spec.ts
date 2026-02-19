import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { AiService } from './ai.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { BookingsService } from '../bookings/bookings.service';
import { MessagesService } from '../messages/messages.service';
import { EscalationService } from '../escalation/escalation.service';
import { CircuitBreakerService } from './services/circuit-breaker.service';
import { CustomerMemoryService } from './services/customer-memory.service';
import { ConversationLearningService } from './services/conversation-learning.service';
import { DomainExpertiseService } from './services/domain-expertise.service';
import { AdvancedIntentService } from './services/advanced-intent.service';
import { PersonalizationService } from './services/personalization.service';
import { ResponseHumanizerService } from './services/response-humanizer.service';
import { FeedbackLoopService } from './services/feedback-loop.service';
import { PredictiveAnalyticsService } from './services/predictive-analytics.service';
import { ResponseQualityService } from './services/response-quality.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WebsocketGateway } from '../../websockets/websocket.gateway';
import { WhatsappService } from '../whatsapp/whatsapp.service';

jest.mock('openai');

describe('AiService', () => {
    let service: AiService;
    let prisma: PrismaService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AiService,
                {
                    provide: PrismaService,
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
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => {
                            if (key === 'OPENAI_API_KEY') return 'dummy-key';
                            return null;
                        })
                    }
                },
                { provide: CircuitBreakerService, useValue: { checkAndBreak: jest.fn().mockResolvedValue({ shouldBreak: false }), recordTrip: jest.fn() } },
                { provide: CustomerMemoryService, useValue: { getPersonalizationContext: jest.fn().mockResolvedValue({}), updatePreferences: jest.fn(), addConversationSummary: jest.fn() } },
                { provide: ConversationLearningService, useValue: { recordLearning: jest.fn() } },
                { provide: DomainExpertiseService, useValue: {} },
                { provide: AdvancedIntentService, useValue: { analyzeIntent: jest.fn().mockResolvedValue({ primaryIntent: 'other' }) } },
                { provide: PersonalizationService, useValue: { extractPreferencesFromMessage: jest.fn().mockReturnValue({}), generateGreeting: jest.fn() } },
                { provide: ResponseHumanizerService, useValue: { humanizeResponse: jest.fn((text) => text) } },
                { provide: FeedbackLoopService, useValue: {} },
                { provide: PredictiveAnalyticsService, useValue: {} },
                { provide: ResponseQualityService, useValue: { validateResponse: jest.fn().mockResolvedValue({ passed: true }) } },
                { provide: BookingsService, useValue: { getCachedPackages: jest.fn(), cleanupStaleDraft: jest.fn(), getLatestConfirmedBooking: jest.fn() } },
                { provide: MessagesService, useValue: { create: jest.fn() } },
                { provide: EscalationService, useValue: { isCustomerEscalated: jest.fn().mockResolvedValue(false), createEscalation: jest.fn() } },
                { provide: NotificationsService, useValue: {} },
                { provide: WebsocketGateway, useValue: {} },
                { provide: WhatsappService, useValue: {} },
                { provide: getQueueToken('aiQueue'), useValue: { add: jest.fn() } },
            ],
        }).compile();

        service = module.get<AiService>(AiService);
        prisma = module.get<PrismaService>(PrismaService);
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

            // Mock handleConversation to return success on retry
            jest.spyOn(service, 'handleConversation').mockResolvedValue({ response: 'Recovered' });

            const result = await (service as any).attemptRecovery(error, context);
            // It should slice history to last 2 messages
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

            const result = await (service as any).attemptRecovery(error, context);
            expect(result.response).toContain("I'm having a little trouble");
        });
    });

    describe('Strategy Pattern Integration', () => {
        it('should use PackageInquiryStrategy for package queries', async () => {
            // Mock getCachedPackages to return some packages
            jest.spyOn(service, 'getCachedPackages').mockResolvedValue([
                { name: 'Studio Classic', price: 10000, features: ['1 hour', '1 outfit'] }
            ]);

            // Mock detectFrustration to return false
            jest.spyOn(service as any, 'detectFrustration').mockResolvedValue(false);
            // Mock checkRateLimit to return true
            jest.spyOn(service as any, 'checkRateLimit').mockResolvedValue(true);
            // Mock sanitizeInput
            jest.spyOn(service as any, 'sanitizeInput').mockReturnValue('tell me about studio classic');

            const result = await service.handleConversation('tell me about studio classic', '123', []);

            expect(result.response).toContain('Studio Classic');
            expect(result.response).toContain('10000');
        });

        it('should use BookingStrategy when draft exists', async () => {
            // Mock draft existence
            (prisma.bookingDraft.findUnique as jest.Mock).mockResolvedValue({
                customerId: '123',
                service: 'Studio Classic',
                step: 'date'
            });

            // Mock detectFrustration to return false
            jest.spyOn(service as any, 'detectFrustration').mockResolvedValue(false);
            // Mock checkRateLimit to return true
            jest.spyOn(service as any, 'checkRateLimit').mockResolvedValue(true);
            // Mock sanitizeInput
            jest.spyOn(service as any, 'sanitizeInput').mockReturnValue('tomorrow');
            // Mock extractBookingDetails
            jest.spyOn(service as any, 'extractBookingDetails').mockResolvedValue({ date: '2025-12-05' });
            // Mock mergeIntoDraft
            jest.spyOn(service as any, 'mergeIntoDraft').mockResolvedValue({
                customerId: '123',
                service: 'Studio Classic',
                step: 'date',
                date: '2025-12-05'
            });
            // Mock checkAndCompleteIfConfirmed
            jest.spyOn(service as any, 'checkAndCompleteIfConfirmed').mockResolvedValue({ action: 'continue' });
            // Mock generateBookingReply
            jest.spyOn(service as any, 'generateBookingReply').mockResolvedValue('What time?');

            const result = await service.handleConversation('tomorrow', '123', []);

            expect(result.response).toBe('What time?');
        });
        it('should use BookingStrategy even if message starts with greeting', async () => {
            // Mock detectFrustration to return false
            jest.spyOn(service as any, 'detectFrustration').mockResolvedValue(false);
            // Mock checkRateLimit to return true
            jest.spyOn(service as any, 'checkRateLimit').mockResolvedValue(true);

            // Mock intent analysis to return booking primary with greeting secondary
            jest.spyOn((service as any).advancedIntent, 'analyzeIntent').mockResolvedValue({
                primaryIntent: 'booking',
                secondaryIntents: ['greeting'],
                confidence: 0.95
            });

            // Mock strategies to ensure BookingStrategy is checked
            // We'll just check if it routes correctly. In practice, BookingStrategy.canHandle check context.intentAnalysis

            const result = await service.handleConversation('Hi, can I book the standard package?', '123', []);

            // Should NOT be the hardcoded greeting from AiService
            expect(result.response).not.toContain("How can I help make your maternity session special today?");
            expect(result.metrics?.strategyUsed).toBe('booking');
        });

        it('should NOT use robotic "Done." opener', async () => {
            // Mock FAQ response
            jest.spyOn(service as any, 'answerFaq').mockResolvedValue('Here are some outfits.');

            const result = await service.handleConversation('show me outfits', '123', []);

            expect(result.response).not.toMatch(/^Done\./);
        });
    });
});
