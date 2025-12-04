import { CircuitBreakerService } from '../src/modules/ai/services/circuit-breaker.service';
import { PrismaService } from '../src/prisma/prisma.service';

// Mock PrismaService
const mockPrismaService = {
    escalation: {
        create: async (data: any) => {
            console.log('  [Mock] Escalation created:', data.data.reason);
            return { id: 'mock-escalation-id', ...data.data };
        },
    },
} as unknown as PrismaService;

async function runTest() {
    console.log('🧪 Starting Circuit Breaker Test (Standalone)...');

    // Instantiate directly
    const circuitBreaker = new CircuitBreakerService(mockPrismaService);

    // Test Case 1: Normal Conversation (Should NOT break)
    console.log('\n📝 Test Case 1: Normal Conversation');
    const normalHistory: any[] = [
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hello! How can I help?' },
        { role: 'user', content: 'I want to book' },
        { role: 'assistant', content: 'Sure, what package?' },
    ];

    const result1 = await circuitBreaker.checkAndBreak('test-user-1', normalHistory);
    console.log(`Result: ${result1.shouldBreak ? '🔴 BREAK' : '🟢 OK'}`);
    if (result1.shouldBreak) console.error('❌ Failed: Should not have broken');
    else console.log('✅ Passed');

    // Test Case 2: Repetitive Assistant (Should BREAK)
    console.log('\n📝 Test Case 2: Repetitive Assistant Loop');
    const repetitiveHistory: any[] = [
        { role: 'user', content: 'Reschedule' },
        { role: 'assistant', content: 'You have a booking on Dec 5. Would you like to modify that?' },
        { role: 'user', content: 'Yes' },
        { role: 'assistant', content: 'You have a booking on Dec 5. Would you like to modify that?' }, // Repetition 1
        { role: 'user', content: 'I said yes' },
        { role: 'assistant', content: 'You have a booking on Dec 5. Would you like to modify that?' }, // Repetition 2
        { role: 'user', content: 'PLEASE' },
        { role: 'assistant', content: 'You have a booking on Dec 5. Would you like to modify that?' }, // Repetition 3 (Trigger)
    ];

    const result2 = await circuitBreaker.checkAndBreak('test-user-2', repetitiveHistory);
    console.log(`Result: ${result2.shouldBreak ? '🔴 BREAK' : '🟢 OK'}`);
    if (result2.shouldBreak) {
        console.log(`Reason: ${result2.reason}`);
        console.log('✅ Passed');
    } else {
        console.error('❌ Failed: Should have broken due to repetition');
    }

    // Test Case 3: User Frustration (Should BREAK)
    console.log('\n📝 Test Case 3: User Frustration');
    const frustratedHistory: any[] = [
        { role: 'assistant', content: 'How can I help?' },
        { role: 'user', content: 'This is not working!!' },
        { role: 'assistant', content: 'I am sorry.' },
        { role: 'user', content: 'WTF is wrong with this bot??' },
    ];

    const result3 = await circuitBreaker.checkAndBreak('test-user-3', frustratedHistory);
    console.log(`Result: ${result3.shouldBreak ? '🔴 BREAK' : '🟢 OK'}`);
    if (result3.shouldBreak) {
        console.log(`Reason: ${result3.reason}`);
        console.log('✅ Passed');
    } else {
        console.error('❌ Failed: Should have broken due to frustration');
    }
}

runTest().catch(console.error);
