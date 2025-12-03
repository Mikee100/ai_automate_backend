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
                        bookingDraft: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn(), delete: jest.fn() },
                        customer: { findUnique: jest.fn() },
                        booking: { findMany: jest.fn() }
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
                { provide: bookings_service_1.BookingsService, useValue: { getCachedPackages: jest.fn() } },
                { provide: messages_service_1.MessagesService, useValue: {} },
                { provide: escalation_service_1.EscalationService, useValue: { isCustomerEscalated: jest.fn().mockResolvedValue(false) } },
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
    });
});
//# sourceMappingURL=ai.service.spec.js.map