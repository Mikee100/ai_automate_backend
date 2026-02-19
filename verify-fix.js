const { Test } = require('@nestjs/testing');
const { AiService } = require('./src/modules/ai/ai.service');
const { PrismaService } = require('./src/prisma/prisma.service');
const { ConfigService } = require('@nestjs/config');
const { BookingsService } = require('./src/modules/ai/../bookings/bookings.service');
const { MessagesService } = require('./src/modules/ai/../messages/messages.service');
const { EscalationService } = require('./src/modules/ai/../escalation/escalation.service');
const { getQueueToken } = require('@nestjs/bull');
const { BookingStrategy } = require('./src/modules/ai/strategies/booking.strategy');
const { PackageInquiryStrategy } = require('./src/modules/ai/strategies/package-inquiry.strategy');
const { FaqStrategy } = require('./src/modules/ai/strategies/faq.strategy');

async function test() {
    const module = await Test.createTestingModule({
        providers: [
            AiService,
            {
                provide: PrismaService,
                useValue: {
                    bookingDraft: { findUnique: jest.fn().mockResolvedValue(null), update: jest.fn(), create: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
                    customer: { findUnique: jest.fn().mockResolvedValue({ id: '123', name: 'Test User' }), update: jest.fn() },
                    booking: { findMany: jest.fn(), findFirst: jest.fn() },
                    payment: { findFirst: jest.fn() },
                    escalation: { findFirst: jest.fn() },
                    communicationLog: { create: jest.fn() }
                }
            },
            {
                provide: ConfigService,
                useValue: {
                    get: jest.fn((key) => {
                        if (key === 'OPENAI_API_KEY') return 'dummy';
                        if (key === 'STUDIO_TIMEZONE') return 'Africa/Nairobi';
                        return null;
                    })
                }
            },
            { provide: BookingsService, useValue: { getCachedPackages: jest.fn().mockResolvedValue([{ name: 'Standard Package', price: 15000 }]), getLatestConfirmedBooking: jest.fn() } },
            { provide: MessagesService, useValue: { create: jest.fn() } },
            { provide: EscalationService, useValue: { isCustomerEscalated: jest.fn().mockResolvedValue(false) } },
            { provide: getQueueToken('aiQueue'), useValue: { add: jest.fn() } },
        ],
    }).compile();

    const service = module.get(AiService);
    
    // Mock the humanizer to see the output
    const humanizer = service.responseHumanizer;
    
    console.log("--- TEST 1: Greeting + Booking Intent ---");
    // "Can I book the standard package?" should NOT trigger only a greeting
    // We mock the intent analysis that handleConversation would normally pass in
    const intentAnalysis = {
        primaryIntent: 'booking',
        secondaryIntents: ['greeting'],
        confidence: 0.95
    };
    
    // We need to mock advancedIntentService.analyzeIntent if we call handleConversation without pre-analyzed intent
    // But handleConversation calls it internally if not provided.
    
    const result = await service.handleConversation('Hi, can I book the standard package?', '123', [], undefined, 0);
    console.log("Response:", result.response);
    console.log("Strategy Used:", result.metrics?.strategyUsed);
    
    console.log("\n--- TEST 2: Robotic Response Check ---");
    const result2 = await service.handleConversation('Could you show me some of the outfits?', '123', [], undefined, 0);
    console.log("Response:", result2.response);
    if (result2.response.startsWith('Done.')) {
        console.error("FAIL: Robotic 'Done.' detected!");
    } else {
        console.log("SUCCESS: No robotic 'Done.' found.");
    }
}

// Mocking some global things for standalone run if needed, but easier to run via jest
// For now, I'll just run npm test and check if I can add a test case to ai.service.spec.ts instead.
