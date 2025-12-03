"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const payments_service_1 = require("../src/modules/payments/payments.service");
const bookings_service_1 = require("../src/modules/bookings/bookings.service");
const notifications_service_1 = require("../src/modules/notifications/notifications.service");
const testing_1 = require("@nestjs/testing");
const app_module_1 = require("../src/app.module");
async function main() {
    const prisma = new client_1.PrismaClient();
    console.log('Connecting to database...');
    await prisma.$connect();
    try {
        console.log('Starting Notification System Verification...');
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        const app = moduleFixture.createNestApplication();
        await app.init();
        const paymentsService = app.get(payments_service_1.PaymentsService);
        const bookingsService = app.get(bookings_service_1.BookingsService);
        const notificationsService = app.get(notifications_service_1.NotificationsService);
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
        const draft = await prisma.bookingDraft.create({
            data: {
                customerId: customer.id,
                service: 'Studio Shoot',
                dateTimeIso: new Date(Date.now() + 86400000).toISOString(),
                name: 'Notification Tester',
                recipientPhone: '0712345678',
                step: 'confirm',
            }
        });
        console.log(`Created booking draft: ${draft.id}`);
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
        console.log('Verifying Payment and Booking Notifications...');
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
        const latestNotifications = await prisma.notification.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' }
        });
        const paymentNotif = latestNotifications.find(n => n.type === 'payment' && n.message.includes(customer.name));
        const bookingNotif = latestNotifications.find(n => n.type === 'booking' && n.message.includes(customer.name));
        if (paymentNotif) {
            console.log('✅ Payment Notification found:', paymentNotif.title);
        }
        else {
            console.error('❌ Payment Notification NOT found');
        }
        if (bookingNotif) {
            console.log('✅ Booking Notification found:', bookingNotif.title);
        }
        else {
            console.error('❌ Booking Notification NOT found');
        }
        const booking = await prisma.booking.findFirst({
            where: { customerId: customer.id, status: 'confirmed' }
        });
        if (booking) {
            console.log(`Rescheduling booking: ${booking.id}`);
            const newDate = new Date(Date.now() + 172800000);
            await bookingsService.updateBooking(booking.id, {
                dateTime: newDate
            });
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
            }
            else {
                console.error('❌ Reschedule Notification NOT found');
            }
        }
        else {
            console.error('❌ Could not find confirmed booking to reschedule');
        }
        console.log('Cleaning up test data...');
        await prisma.notification.deleteMany({ where: { message: { contains: 'Notification Tester' } } });
        await prisma.booking.deleteMany({ where: { customerId: customer.id } });
        await prisma.payment.deleteMany({ where: { bookingDraftId: draft.id } });
        await prisma.customer.delete({ where: { id: customer.id } });
        await app.close();
        console.log('Verification Complete.');
        process.exit(0);
    }
    catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=test-notifications.js.map