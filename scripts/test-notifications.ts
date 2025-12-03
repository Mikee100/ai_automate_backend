
import { PrismaClient } from '@prisma/client';
import { PaymentsService } from '../src/modules/payments/payments.service';
import { BookingsService } from '../src/modules/bookings/bookings.service';
import { NotificationsService } from '../src/modules/notifications/notifications.service';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication } from '@nestjs/common';

async function main() {
    const prisma = new PrismaClient();
    console.log('Connecting to database...');
    await prisma.$connect();

    try {
        console.log('Starting Notification System Verification...');

        // 1. Setup Test Module to get Services
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        const app: INestApplication = moduleFixture.createNestApplication();
        await app.init();

        const paymentsService = app.get<PaymentsService>(PaymentsService);
        const bookingsService = app.get<BookingsService>(BookingsService);
        const notificationsService = app.get<NotificationsService>(NotificationsService);

        // 2. Create a Test Customer
        const customerId = 'test-notif-user-' + Date.now();
        const customer = await prisma.customer.create({
            data: {
                id: customerId,
                name: 'Notification Tester',
                phone: '254712345678',
                whatsappId: customerId,
            }
        });
        console.log(`Created test customer: ${customer.id}`);

        // 3. Create a Booking Draft
        const draft = await prisma.bookingDraft.create({
            data: {
                customerId: customer.id,
                service: 'Studio Shoot',
                dateTimeIso: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
                name: 'Notification Tester',
                recipientPhone: '0712345678',
                step: 'confirm',
            }
        });
        console.log(`Created booking draft: ${draft.id}`);

        // 4. Simulate Payment Callback (Success)
        // We need to manually create a payment record first as handleCallback expects it
        const payment = await prisma.payment.create({
            data: {
                bookingDraftId: draft.id,
                amount: 2000,
                phone: '254712345678',
                status: 'pending',
                checkoutRequestId: 'ws_CO_' + Date.now(),
            }
        });

        console.log(`Simulating Payment Callback for CheckoutRequestID: ${payment.checkoutRequestId}`);

        await paymentsService.handleCallback({
            Body: {
                stkCallback: {
                    CheckoutRequestID: payment.checkoutRequestId,
                    ResultCode: 0,
                    ResultDesc: 'The service request is processed successfully.',
                    CallbackMetadata: {
                        Item: [
                            { Name: 'Amount', Value: 2000 },
                            { Name: 'MpesaReceiptNumber', Value: 'TEST_RECEIPT_' + Date.now() },
                            { Name: 'PhoneNumber', Value: 254712345678 }
                        ]
                    }
                }
            }
        });

        // 5. Verify Notifications (Payment + Booking)
        console.log('Verifying Payment and Booking Notifications...');
        // Give it a moment as notifications might be async or just to be safe
        await new Promise(r => setTimeout(r, 1000));

        const notifications = await prisma.notification.findMany({
            where: {
                metadata: {
                    path: ['customerId'],
                    equals: customer.id
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Note: Metadata query in Prisma with JSON can be tricky, let's just fetch latest notifications
        const latestNotifications = await prisma.notification.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' }
        });

        const paymentNotif = latestNotifications.find(n => n.type === 'payment' && n.message.includes(customer.name));
        const bookingNotif = latestNotifications.find(n => n.type === 'booking' && n.message.includes(customer.name));

        if (paymentNotif) {
            console.log('✅ Payment Notification found:', paymentNotif.title);
        } else {
            console.error('❌ Payment Notification NOT found');
        }

        if (bookingNotif) {
            console.log('✅ Booking Notification found:', bookingNotif.title);
        } else {
            console.error('❌ Booking Notification NOT found');
        }

        // 6. Test Reschedule Notification
        // Get the confirmed booking
        const booking = await prisma.booking.findFirst({
            where: { customerId: customer.id, status: 'confirmed' }
        });

        if (booking) {
            console.log(`Rescheduling booking: ${booking.id}`);
            const newDate = new Date(Date.now() + 172800000); // 2 days from now

            await bookingsService.updateBooking(booking.id, {
                dateTime: newDate
            });

            // Verify Reschedule Notification
            await new Promise(r => setTimeout(r, 1000));
            const rescheduleNotif = await prisma.notification.findFirst({
                where: {
                    type: 'reschedule',
                    message: { contains: customer.name }
                },
                orderBy: { createdAt: 'desc' }
            });

            if (rescheduleNotif) {
                console.log('✅ Reschedule Notification found:', rescheduleNotif.title);
            } else {
                console.error('❌ Reschedule Notification NOT found');
            }
        } else {
            console.error('❌ Could not find confirmed booking to reschedule');
        }

        // Cleanup
        console.log('Cleaning up test data...');
        await prisma.notification.deleteMany({ where: { message: { contains: 'Notification Tester' } } });
        await prisma.booking.deleteMany({ where: { customerId: customer.id } });
        await prisma.payment.deleteMany({ where: { bookingDraftId: draft.id } }); // Draft is deleted by handleCallback usually, but payment remains
        // Draft is deleted by handleCallback, so we check if it exists before delete or just ignore
        await prisma.customer.delete({ where: { id: customer.id } });

        await app.close();
        console.log('Verification Complete.');
        process.exit(0);

    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
