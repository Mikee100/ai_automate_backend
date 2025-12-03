"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const axios_1 = require("axios");
const prisma = new client_1.PrismaClient();
const BASE_URL = 'http://localhost:3000';
async function main() {
    console.log('🧪 Starting Instagram Webhook & 24-Hour Window Tests\n');
    const testInstagramId = 'test_ig_user_' + Date.now();
    try {
        console.log('Test 1: Simulating incoming Instagram webhook...');
        const webhookPayload = {
            object: 'instagram',
            entry: [{
                    messaging: [{
                            sender: { id: testInstagramId },
                            message: { text: 'Hello from test!' }
                        }]
                }]
        };
        const webhookResponse = await axios_1.default.post(`${BASE_URL}/webhooks/instagram`, webhookPayload);
        console.log('✅ Webhook processed successfully');
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('\nTest 2: Verifying lastInstagramMessageAt was updated...');
        const customer = await prisma.customer.findUnique({
            where: { instagramId: testInstagramId }
        });
        if (!customer) {
            throw new Error('Customer not created by webhook');
        }
        if (!customer.lastInstagramMessageAt) {
            throw new Error('lastInstagramMessageAt not set');
        }
        console.log('✅ lastInstagramMessageAt updated:', customer.lastInstagramMessageAt);
        console.log('\nTest 3: Testing canSendMessage (should be allowed)...');
        const canSendResponse = await axios_1.default.get(`${BASE_URL}/instagram/can-send/${testInstagramId}`);
        if (!canSendResponse.data.allowed) {
            throw new Error('canSendMessage should return allowed=true within 24hrs');
        }
        console.log('✅ Can send message:', canSendResponse.data);
        console.log(`   Hours remaining: ${canSendResponse.data.hoursRemaining?.toFixed(2)}`);
        console.log('\nTest 4: Testing expired 24-hour window...');
        const expiredTime = new Date(Date.now() - 25 * 60 * 60 * 1000);
        await prisma.customer.update({
            where: { instagramId: testInstagramId },
            data: { lastInstagramMessageAt: expiredTime }
        });
        const canSendExpired = await axios_1.default.get(`${BASE_URL}/instagram/can-send/${testInstagramId}`);
        if (canSendExpired.data.allowed) {
            throw new Error('canSendMessage should return allowed=false after 24hrs');
        }
        console.log('✅ Cannot send after 24hrs:', canSendExpired.data.reason);
        console.log('\nTest 5: Attempting to send message with expired window...');
        try {
            await axios_1.default.post(`${BASE_URL}/instagram/send`, {
                to: testInstagramId,
                message: 'This should fail'
            });
            throw new Error('Send should have failed with expired window');
        }
        catch (error) {
            if (error.response?.status === 400) {
                console.log('✅ Send correctly rejected:', error.response.data.message);
            }
            else {
                throw error;
            }
        }
        console.log('\nTest 6: Resetting to valid window...');
        await prisma.customer.update({
            where: { instagramId: testInstagramId },
            data: { lastInstagramMessageAt: new Date() }
        });
        const canSendValid = await axios_1.default.get(`${BASE_URL}/instagram/can-send/${testInstagramId}`);
        if (!canSendValid.data.allowed) {
            throw new Error('Should be able to send within valid window');
        }
        console.log('✅ Can send within valid window');
        console.log('\n✅ All tests passed!\n');
        console.log('Cleaning up test data...');
        await prisma.message.deleteMany({ where: { customerId: customer.id } });
        await prisma.customer.delete({ where: { id: customer.id } });
        console.log('✅ Cleanup complete');
    }
    catch (error) {
        console.error('\n❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=test-instagram-webhook.js.map