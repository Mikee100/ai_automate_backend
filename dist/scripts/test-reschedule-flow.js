"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const ai_service_1 = require("../src/modules/ai/ai.service");
const bookings_service_1 = require("../src/modules/bookings/bookings.service");
const prisma_service_1 = require("../src/prisma/prisma.service");
const config_1 = require("@nestjs/config");
const luxon_1 = require("luxon");
const bull_1 = require("@nestjs/bull");
const messages_service_1 = require("../src/modules/messages/messages.service");
const payments_service_1 = require("../src/modules/payments/payments.service");
const escalation_service_1 = require("../src/modules/escalation/escalation.service");
async function run() {
    const mockMessagesService = {
        sendOutboundMessage: async (to, msg) => console.log(`[MockMessage] To: ${to}, Msg: ${msg}`),
    };
    const mockPaymentsService = {
        initiateSTKPush: async () => 'mock-checkout-id',
    };
    const mockQueue = {
        add: async () => ({}),
    };
    const mockConfigService = {
        get: (key, def) => {
            return process.env[key] || def;
        }
    };
    const moduleRef = await testing_1.Test.createTestingModule({
        providers: [
            ai_service_1.AiService,
            bookings_service_1.BookingsService,
            prisma_service_1.PrismaService,
            { provide: config_1.ConfigService, useValue: mockConfigService },
            { provide: messages_service_1.MessagesService, useValue: mockMessagesService },
            { provide: payments_service_1.PaymentsService, useValue: mockPaymentsService },
            { provide: escalation_service_1.EscalationService, useValue: { isCustomerEscalated: async () => false } },
            { provide: (0, bull_1.getQueueToken)('bookingQueue'), useValue: mockQueue },
            { provide: (0, bull_1.getQueueToken)('aiQueue'), useValue: mockQueue },
        ],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();
    const aiService = moduleRef.get(ai_service_1.AiService);
    const bookingsService = moduleRef.get(bookings_service_1.BookingsService);
    const prisma = moduleRef.get(prisma_service_1.PrismaService);
    const customerId = 'test-reschedule-user-' + Date.now();
    const STUDIO_TZ = 'Africa/Nairobi';
    console.log('🚀 Starting Reschedule Flow Test (Mocked)');
    console.log(`👤 Test Customer ID: ${customerId}`);
    try {
        await prisma.customer.create({
            data: {
                id: customerId,
                name: 'Test Rescheduler',
                phone: '254700000000',
            },
        });
        const tomorrow = luxon_1.DateTime.now().setZone(STUDIO_TZ).plus({ days: 1 }).set({ hour: 10, minute: 0 }).toJSDate();
        const booking = await prisma.booking.create({
            data: {
                customerId,
                service: 'Maternity Shoot',
                dateTime: tomorrow,
                status: 'confirmed',
                recipientName: 'Test Rescheduler',
                recipientPhone: '254700000000',
            },
        });
        console.log(`✅ Created initial booking: ${booking.id} at ${tomorrow.toISOString()}`);
        console.log('\n--- Step 1: User asks to reschedule ---');
        const msg1 = "I want to reschedule my booking";
        const res1 = await aiService.handleConversation(msg1, customerId, [], bookingsService);
        console.log(`User: "${msg1}"`);
        console.log(`AI: "${res1.response}"`);
        const draft1 = await prisma.bookingDraft.findUnique({ where: { customerId } });
        if (draft1?.step === 'reschedule') {
            console.log('✅ Draft created with step="reschedule"');
        }
        else {
            console.error('❌ Draft NOT in reschedule mode:', draft1);
            process.exit(1);
        }
        console.log('\n--- Step 2: User provides new date ---');
        const dayAfter = luxon_1.DateTime.now().setZone(STUDIO_TZ).plus({ days: 2 }).set({ hour: 14, minute: 0 });
        const msg2 = `Move it to ${dayAfter.toFormat('yyyy-MM-dd')} at 2pm`;
        const res2 = await aiService.handleConversation(msg2, customerId, [], bookingsService);
        console.log(`User: "${msg2}"`);
        console.log(`AI: "${res2.response}"`);
        const draft2 = await prisma.bookingDraft.findUnique({ where: { customerId } });
        if (draft2?.dateTimeIso) {
            console.log(`✅ Draft updated with new date: ${draft2.dateTimeIso}`);
        }
        else {
            console.error('❌ Draft missing new date');
        }
        console.log('\n--- Step 3: User confirms ---');
        const msg3 = "Yes confirm";
        const res3 = await aiService.handleConversation(msg3, customerId, [], bookingsService);
        console.log(`User: "${msg3}"`);
        console.log(`AI: "${res3.response}"`);
        const updatedBooking = await prisma.booking.findUnique({ where: { id: booking.id } });
        const updatedDt = luxon_1.DateTime.fromJSDate(updatedBooking.dateTime).setZone(STUDIO_TZ);
        if (Math.abs(updatedDt.diff(dayAfter, 'minutes').minutes) < 1) {
            console.log(`✅ Booking successfully updated to: ${updatedDt.toISO()}`);
        }
        else {
            console.error(`❌ Booking update mismatch. Expected ${dayAfter.toISO()}, got ${updatedDt.toISO()}`);
        }
        const finalDraft = await prisma.bookingDraft.findUnique({ where: { customerId } });
        if (!finalDraft) {
            console.log('✅ Draft successfully cleaned up');
        }
        else {
            console.error('❌ Draft still exists');
        }
    }
    catch (error) {
        console.error('❌ Test Failed:', error);
    }
    finally {
        console.log('\n🧹 Cleaning up...');
        await prisma.booking.deleteMany({ where: { customerId } });
        await prisma.bookingDraft.deleteMany({ where: { customerId } });
        await prisma.customer.delete({ where: { id: customerId } });
        await app.close();
    }
}
run();
//# sourceMappingURL=test-reschedule-flow.js.map