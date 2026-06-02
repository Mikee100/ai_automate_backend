import { BookingStrategy } from './booking.strategy';

describe('BookingStrategy', () => {
  let strategy: BookingStrategy;

  const logger = {
    log: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    strategy = new BookingStrategy();
    jest.clearAllMocks();
  });

  it('canHandle should prioritize payment resend even when no draft', () => {
    const result = strategy.canHandle('reschedule', {
      hasDraft: false,
      message: 'resend payment prompt',
      intentAnalysis: { primaryIntent: 'reschedule' },
    });

    expect(result).toBe(true);
  });

  it('canHandle should skip explicit reschedule intent', () => {
    const result = strategy.canHandle('booking', {
      hasDraft: true,
      message: 'I want to reschedule my appointment',
      intentAnalysis: { primaryIntent: 'booking' },
      draft: { step: 'date' },
    });

    expect(result).toBe(false);
  });

  it('generateResponse should redirect instagram users to WhatsApp and clear draft', async () => {
    const response = await strategy.generateResponse('I want to book tomorrow', {
      enrichedContext: { platform: 'instagram' },
      logger,
      history: [],
      historyLimit: 6,
      customerId: 'cust_1',
      hasDraft: false,
      prisma: {},
      bookingsService: {},
      aiService: {},
    });

    expect(response).toBeTruthy();
    expect(response.draft).toBeNull();
    expect(response.response).toContain('official WhatsApp');
    expect(response.response).toContain('wa.me');
  });

  it('generateResponse should resend failed payment prompt for WhatsApp users', async () => {
    const resendMessage = 'Payment prompt resent. Please check your phone.';

    const aiService = {
      getOrCreateDraft: jest.fn().mockResolvedValue({
        step: 'confirm',
        service: 'Standard Package',
      }),
    };

    const bookingsService = {
      hasFailedPayment: jest.fn().mockResolvedValue(false),
      getLatestPaymentForDraft: jest.fn().mockResolvedValue({
        status: 'failed',
        createdAt: new Date().toISOString(),
        phone: '254700000000',
      }),
      resendPaymentPrompt: jest.fn().mockResolvedValue({
        message: resendMessage,
      }),
    };

    const response = await strategy.generateResponse('resend payment prompt', {
      enrichedContext: { platform: 'whatsapp' },
      logger,
      history: [],
      historyLimit: 6,
      customerId: 'cust_2',
      hasDraft: true,
      prisma: {},
      bookingsService,
      aiService,
    });

    expect(aiService.getOrCreateDraft).toHaveBeenCalledWith('cust_2');
    expect(bookingsService.getLatestPaymentForDraft).toHaveBeenCalledWith('cust_2');
    expect(bookingsService.resendPaymentPrompt).toHaveBeenCalledWith('cust_2');
    expect(response.response).toBe(resendMessage);
  });
});
