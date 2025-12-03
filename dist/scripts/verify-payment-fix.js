"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Starting verification...');
    const customerId = 'test-verification-customer-' + Date.now();
    await prisma.customer.create({
        data: {
            id: customerId,
            name: 'Test Verification',
            phone: '254700000000',
        }
    });
    const draft = await prisma.bookingDraft.create({
        data: {
            customerId,
            service: 'Standard Package',
            step: 'service'
        }
    });
    console.log('Created draft:', draft.id);
    const checkoutRequestId = 'ws_CO_DMZ_12345_' + Date.now();
    const payment1 = await prisma.payment.create({
        data: {
            bookingDraftId: draft.id,
            amount: 10,
            phone: '254700000000',
            status: 'success',
            checkoutRequestId: checkoutRequestId
        }
    });
    console.log('Created Payment 1 (Success):', payment1.id);
    const customerId2 = 'test-verification-customer-2-' + Date.now();
    await prisma.customer.create({
        data: {
            id: customerId2,
            name: 'Test Verification 2',
            phone: '254700000000',
        }
    });
    const draft2 = await prisma.bookingDraft.create({
        data: {
            customerId: customerId2,
            service: 'Standard Package',
            step: 'service'
        }
    });
    const payment2 = await prisma.payment.create({
        data: {
            bookingDraftId: draft2.id,
            amount: 10,
            phone: '254700000000',
            status: 'pending',
            checkoutRequestId: checkoutRequestId
        }
    });
    console.log('Created Payment 2 (Pending):', payment2.id);
    const foundByCheckoutId = await prisma.payment.findFirst({
        where: { checkoutRequestId }
    });
    console.log('\n--- BUG DEMONSTRATION ---');
    console.log('Query by checkoutRequestId found:', foundByCheckoutId?.id);
    console.log('Status:', foundByCheckoutId?.status);
    if (foundByCheckoutId?.id === payment1.id) {
        console.log('FAIL: Found the OLD payment (Success) instead of the NEW one (Pending). This causes the hallucination!');
    }
    else {
        console.log('LUCK: Found the new one, but order is not guaranteed.');
    }
    const foundById = await prisma.payment.findUnique({
        where: { id: payment2.id }
    });
    console.log('\n--- FIX VERIFICATION ---');
    console.log('Query by paymentId found:', foundById?.id);
    console.log('Status:', foundById?.status);
    if (foundById?.id === payment2.id && foundById?.status === 'pending') {
        console.log('SUCCESS: Found the correct pending payment using unique ID.');
    }
    else {
        console.log('FAIL: Did not find the correct payment.');
    }
    await prisma.payment.deleteMany({ where: { id: { in: [payment1.id, payment2.id] } } });
    await prisma.bookingDraft.deleteMany({ where: { id: { in: [draft.id, draft2.id] } } });
    await prisma.customer.deleteMany({ where: { id: { in: [customerId, customerId2] } } });
}
main()
    .catch(e => console.error(e))
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=verify-payment-fix.js.map