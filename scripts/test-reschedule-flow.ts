import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from '../src/modules/ai/ai.service';
import { BookingsService } from '../src/modules/bookings/bookings.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { DateTime } from 'luxon';
import { getQueueToken } from '@nestjs/bull';
import { MessagesService } from '../src/modules/messages/messages.service'; // Fixed import path for the class
// We need to import the Service classes to use as tokens
import { MessagesService as MessagesServiceClass } from '../src/modules/messages/messages.service';
import { PaymentsService } from '../src/modules/payments/payments.service';
import { EscalationService } from '../src/modules/escalation/escalation.service';

async function run() {
    // Mock implementations
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
        get: (key: string, def?: any) => {
            // Load from process.env
            return process.env[key] || def;
        }
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
        providers: [
            AiService,
            BookingsService,
            PrismaService,
            { provide: ConfigService, useValue: mockConfigService },
            { provide: MessagesServiceClass, useValue: mockMessagesService },
            { provide: PaymentsService, useValue: mockPaymentsService },
            { provide: EscalationService, useValue: { isCustomerEscalated: async () => false } },
            { provide: getQueueToken('bookingQueue'), useValue: mockQueue },
            { provide: getQueueToken('aiQueue'), useValue: mockQueue },
        ],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    const aiService = moduleRef.get<AiService>(AiService);
    const bookingsService = moduleRef.get<BookingsService>(BookingsService);
    const prisma = moduleRef.get<PrismaService>(PrismaService);

    const customerId = 'test-reschedule-user-' + Date.now();
    const STUDIO_TZ = 'Africa/Nairobi';

    console.log('🚀 Starting Reschedule Flow Test (Mocked)');
    console.log(`👤 Test Customer ID: ${customerId}`);

    try {
        // 1. Setup: Create Customer and Confirmed Booking
        await prisma.customer.create({
            data: {
                id: customerId,
                name: 'Test Rescheduler',
                phone: '254700000000',
            },
        });

        // Create a booking for tomorrow
        const tomorrow = DateTime.now().setZone(STUDIO_TZ).plus({ days: 1 }).set({ hour: 10, minute: 0 }).toJSDate();
        const booking = await prisma.booking.create({
            data: {
                customerId,
                service: 'Maternity Shoot', // Ensure this matches a real package or mock it if needed
                dateTime: tomorrow,
                status: 'confirmed',
                recipientName: 'Test Rescheduler',
                recipientPhone: '254700000000',
            },
        });
        console.log(`✅ Created initial booking: ${booking.id} at ${tomorrow.toISOString()}`);

        // 2. Test Step 1: Initiate Reschedule
        console.log('\n--- Step 1: User asks to reschedule ---');
        const msg1 = "I want to reschedule my booking";
        const res1 = await aiService.handleConversation(msg1, customerId, [], bookingsService);
        console.log(`User: "${msg1}"`);
        console.log(`AI: "${res1.response}"`);

        const draft1 = await prisma.bookingDraft.findUnique({ where: { customerId } });
        if (draft1?.step === 'reschedule') {
            console.log('✅ Draft created with step="reschedule"');
        } else {
            console.error('❌ Draft NOT in reschedule mode:', draft1);
            process.exit(1);
        }

        // 3. Test Step 2: Provide New Date
        console.log('\n--- Step 2: User provides new date ---');
        // Move to day after tomorrow
        const dayAfter = DateTime.now().setZone(STUDIO_TZ).plus({ days: 2 }).set({ hour: 14, minute: 0 });
        const msg2 = `Move it to ${dayAfter.toFormat('yyyy-MM-dd')} at 2pm`;
        const res2 = await aiService.handleConversation(msg2, customerId, [], bookingsService);
        console.log(`User: "${msg2}"`);
        console.log(`AI: "${res2.response}"`);

        const draft2 = await prisma.bookingDraft.findUnique({ where: { customerId } });
        if (draft2?.dateTimeIso) {
            console.log(`✅ Draft updated with new date: ${draft2.dateTimeIso}`);
        } else {
            console.error('❌ Draft missing new date');
        }

        // 4. Test Step 3: Confirm
        console.log('\n--- Step 3: User confirms ---');
        const msg3 = "Yes confirm";
        const res3 = await aiService.handleConversation(msg3, customerId, [], bookingsService);
        console.log(`User: "${msg3}"`);
        console.log(`AI: "${res3.response}"`);

        // Verify Booking Updated
        const updatedBooking = await prisma.booking.findUnique({ where: { id: booking.id } });
        const updatedDt = DateTime.fromJSDate(updatedBooking!.dateTime).setZone(STUDIO_TZ);

        // Allow small difference (e.g. seconds)
        if (Math.abs(updatedDt.diff(dayAfter, 'minutes').minutes) < 1) {
            console.log(`✅ Booking successfully updated to: ${updatedDt.toISO()}`);
        } else {
            console.error(`❌ Booking update mismatch. Expected ${dayAfter.toISO()}, got ${updatedDt.toISO()}`);
        }

        // Verify Draft Deleted
        const finalDraft = await prisma.bookingDraft.findUnique({ where: { customerId } });
        if (!finalDraft) {
            console.log('✅ Draft successfully cleaned up');
        } else {
            console.error('❌ Draft still exists');
        }

    } catch (error) {
        console.error('❌ Test Failed:', error);
    } finally {
        // Cleanup
        console.log('\n🧹 Cleaning up...');
        await prisma.booking.deleteMany({ where: { customerId } });
        await prisma.bookingDraft.deleteMany({ where: { customerId } });
        await prisma.customer.delete({ where: { id: customerId } });
        await app.close();
    }
}

run();
