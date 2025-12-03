import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { AiService } from './ai.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { BookingsService } from '../bookings/bookings.service';
import { MessagesService } from '../messages/messages.service';
import { EscalationService } from '../escalation/escalation.service';

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
                        bookingDraft: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn(), delete: jest.fn() },
                        customer: { findUnique: jest.fn() },
                        booking: { findMany: jest.fn() }
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
                { provide: BookingsService, useValue: { getCachedPackages: jest.fn() } },
                { provide: MessagesService, useValue: {} },
                { provide: EscalationService, useValue: { isCustomerEscalated: jest.fn().mockResolvedValue(false) } },
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
    });
});
