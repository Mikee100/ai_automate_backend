/**
 * Test Script: Instagram Webhook Flow & 24-Hour Window Validation
 * 
 * This script tests:
 * 1. Simulates incoming Instagram message webhook
 * 2. Verifies lastInstagramMessageAt is updated
 * 3. Verifies canSendMessage returns true within 24hr window
 * 4. Verifies canSendMessage returns false after 24hrs
 * 5. Tests sendMessage with valid and invalid windows
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';

async function main() {
    console.log('🧪 Starting Instagram Webhook & 24-Hour Window Tests\n');

    const testInstagramId = 'test_ig_user_' + Date.now();

    try {
        // Test 1: Simulate incoming Instagram webhook
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

        const webhookResponse = await axios.post(`${BASE_URL}/webhooks/instagram`, webhookPayload);
        console.log('✅ Webhook processed successfully');

        // Wait a moment for processing
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 2: Verify lastInstagramMessageAt was updated
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

        // Test 3: Verify canSendMessage returns true (within 24hr window)
        console.log('\nTest 3: Testing canSendMessage (should be allowed)...');
        const canSendResponse = await axios.get(`${BASE_URL}/instagram/can-send/${testInstagramId}`);

        if (!canSendResponse.data.allowed) {
            throw new Error('canSendMessage should return allowed=true within 24hrs');
        }

        console.log('✅ Can send message:', canSendResponse.data);
        console.log(`   Hours remaining: ${canSendResponse.data.hoursRemaining?.toFixed(2)}`);

        // Test 4: Simulate expired window (manually update timestamp to 25 hours ago)
        console.log('\nTest 4: Testing expired 24-hour window...');
        const expiredTime = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
        await prisma.customer.update({
            where: { instagramId: testInstagramId },
            data: { lastInstagramMessageAt: expiredTime }
        });

        const canSendExpired = await axios.get(`${BASE_URL}/instagram/can-send/${testInstagramId}`);

        if (canSendExpired.data.allowed) {
            throw new Error('canSendMessage should return allowed=false after 24hrs');
        }

        console.log('✅ Cannot send after 24hrs:', canSendExpired.data.reason);

        // Test 5: Try sending message with expired window (should fail)
        console.log('\nTest 5: Attempting to send message with expired window...');
        try {
            await axios.post(`${BASE_URL}/instagram/send`, {
                to: testInstagramId,
                message: 'This should fail'
            });
            throw new Error('Send should have failed with expired window');
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('✅ Send correctly rejected:', error.response.data.message);
            } else {
                throw error;
            }
        }

        // Test 6: Reset to valid window and verify send would work (without actually sending to API)
        console.log('\nTest 6: Resetting to valid window...');
        await prisma.customer.update({
            where: { instagramId: testInstagramId },
            data: { lastInstagramMessageAt: new Date() }
        });

        const canSendValid = await axios.get(`${BASE_URL}/instagram/can-send/${testInstagramId}`);
        if (!canSendValid.data.allowed) {
            throw new Error('Should be able to send within valid window');
        }
        console.log('✅ Can send within valid window');

        console.log('\n✅ All tests passed!\n');

        // Cleanup
        console.log('Cleaning up test data...');
        await prisma.message.deleteMany({ where: { customerId: customer.id } });
        await prisma.customer.delete({ where: { id: customer.id } });
        console.log('✅ Cleanup complete');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
