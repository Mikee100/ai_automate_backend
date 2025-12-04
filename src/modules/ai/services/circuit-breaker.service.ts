import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

interface HistoryMsg {
    role: 'user' | 'assistant' | 'system';
    content: string | any;
}

interface CircuitBreakerResult {
    shouldBreak: boolean;
    reason?: string;
    recovery: 'retry' | 'simplify' | 'escalate';
    repetitionCount?: number;
}

@Injectable()
export class CircuitBreakerService {
    private readonly logger = new Logger(CircuitBreakerService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Check if conversation is stuck in a loop and should be broken
     */
    async checkAndBreak(
        customerId: string,
        recentMessages: HistoryMsg[]
    ): Promise<CircuitBreakerResult> {
        // Detect repetition in assistant responses
        const repetition = this.detectRepetition(recentMessages);

        if (repetition.count >= 3) {
            this.logger.warn(
                `[CIRCUIT_BREAKER] Detected ${repetition.count} repetitions for customer ${customerId}: "${repetition.pattern}"`
            );

            return {
                shouldBreak: true,
                reason: `AI repeated similar response ${repetition.count} times: "${repetition.pattern}"`,
                recovery: 'escalate',
                repetitionCount: repetition.count,
            };
        }

        // Check for user frustration patterns
        const userFrustration = this.detectUserFrustration(recentMessages);
        if (userFrustration.isFrustrated) {
            this.logger.warn(
                `[CIRCUIT_BREAKER] Detected user frustration for ${customerId}: ${userFrustration.reason}`
            );

            return {
                shouldBreak: true,
                reason: `User frustration detected: ${userFrustration.reason}`,
                recovery: 'simplify',
            };
        }

        return { shouldBreak: false, recovery: 'retry' };
    }

    /**
     * Detect repetition in recent assistant messages
     */
    private detectRepetition(messages: HistoryMsg[]): {
        count: number;
        pattern: string;
    } {
        const assistantMsgs = messages
            .filter((m) => m.role === 'assistant')
            .slice(-5) // Last 5 assistant messages
            .map((m) => (typeof m.content === 'string' ? m.content : JSON.stringify(m.content)));

        if (assistantMsgs.length < 3) {
            return { count: 0, pattern: '' };
        }

        // Check for similar patterns
        const lastMsg = assistantMsgs[assistantMsgs.length - 1];
        let similarCount = 1;

        for (let i = assistantMsgs.length - 2; i >= 0; i--) {
            if (this.areSimilar(lastMsg, assistantMsgs[i])) {
                similarCount++;
            } else {
                break; // Stop at first non-similar message
            }
        }

        return {
            count: similarCount,
            pattern: lastMsg.substring(0, 60) + (lastMsg.length > 60 ? '...' : ''),
        };
    }

    /**
     * Check if two messages are semantically similar
     */
    private areSimilar(msg1: string, msg2: string): boolean {
        // Normalize both messages
        const normalize = (s: string) =>
            s
                .toLowerCase()
                .replace(/[^\w\s]/g, '') // Remove punctuation
                .replace(/\s+/g, ' ') // Normalize whitespace
                .trim();

        const n1 = normalize(msg1);
        const n2 = normalize(msg2);

        // Check if messages start with same phrase (first 5-7 words)
        const getFirstWords = (s: string, count: number = 5) =>
            s.split(' ').slice(0, count).join(' ');

        const firstWords1 = getFirstWords(n1);
        const firstWords2 = getFirstWords(n2);

        // If first 5 words match, they're similar
        if (firstWords1 === firstWords2 && firstWords1.length > 10) {
            return true;
        }

        // Also check if one contains significant portion of the other
        const shorterLength = Math.min(n1.length, n2.length);
        if (shorterLength > 30) {
            const longer = n1.length > n2.length ? n1 : n2;
            const shorter = n1.length <= n2.length ? n1 : n2;

            // If 70% of shorter message is in longer message, they're similar
            const similarity = shorter.split(' ').filter(word =>
                word.length > 3 && longer.includes(word)
            ).length / shorter.split(' ').length;

            if (similarity > 0.7) {
                return true;
            }
        }

        return false;
    }

    /**
     * Detect user frustration from message patterns
     */
    private detectUserFrustration(messages: HistoryMsg[]): {
        isFrustrated: boolean;
        reason?: string;
    } {
        const userMsgs = messages
            .filter((m) => m.role === 'user')
            .slice(-5) // Last 5 user messages
            .map((m) => (typeof m.content === 'string' ? m.content : ''));

        if (userMsgs.length < 2) {
            return { isFrustrated: false };
        }

        // Check for frustration indicators
        const frustrationPatterns = [
            /!!+/i, // Multiple exclamation marks
            /\?\?+/i, // Multiple question marks
            /wtf|wth|omg|seriously|come on|please/i,
            /^(i said|i told you|i already|again)/i,
            /not working|doesn't work|broken|stuck/i,
            /^help$/i,
            /forget (it|this)|never ?mind|cancel everything/i,
        ];

        // Check last 3 messages for frustration
        const recentUserMsgs = userMsgs.slice(-3);
        const frustratedCount = recentUserMsgs.filter((msg) =>
            frustrationPatterns.some((pattern) => pattern.test(msg))
        ).length;

        if (frustratedCount >= 2) {
            return {
                isFrustrated: true,
                reason: 'Multiple frustration indicators in recent messages',
            };
        }

        // Check if user is repeating themselves
        if (userMsgs.length >= 3) {
            const lastUserMsg = userMsgs[userMsgs.length - 1];
            const repetitions = userMsgs.slice(0, -1).filter((msg) =>
                this.areSimilar(msg, lastUserMsg)
            ).length;

            if (repetitions >= 2) {
                return {
                    isFrustrated: true,
                    reason: 'User repeating same message multiple times',
                };
            }
        }

        return { isFrustrated: false };
    }

    /**
     * Record when circuit breaker trips for analytics
     */
    async recordTrip(customerId: string, reason: string) {
        try {
            await this.prisma.escalation.create({
                data: {
                    customerId,
                    reason: 'ai_circuit_breaker',
                    description: reason,
                    status: 'pending',
                    metadata: {
                        triggeredBy: 'circuit_breaker',
                        timestamp: new Date().toISOString(),
                    },
                },
            });

            this.logger.log(`[CIRCUIT_BREAKER] Recorded trip for customer ${customerId}`);
        } catch (error) {
            this.logger.error(`[CIRCUIT_BREAKER] Failed to record trip: ${error.message}`);
        }
    }
}
