"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CircuitBreakerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreakerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let CircuitBreakerService = CircuitBreakerService_1 = class CircuitBreakerService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(CircuitBreakerService_1.name);
    }
    async checkAndBreak(customerId, recentMessages) {
        const repetition = this.detectRepetition(recentMessages);
        if (repetition.count >= 3) {
            this.logger.warn(`[CIRCUIT_BREAKER] Detected ${repetition.count} repetitions for customer ${customerId}: "${repetition.pattern}"`);
            return {
                shouldBreak: true,
                reason: `AI repeated similar response ${repetition.count} times: "${repetition.pattern}"`,
                recovery: 'escalate',
                repetitionCount: repetition.count,
            };
        }
        const userFrustration = this.detectUserFrustration(recentMessages);
        if (userFrustration.isFrustrated) {
            this.logger.warn(`[CIRCUIT_BREAKER] Detected user frustration for ${customerId}: ${userFrustration.reason}`);
            return {
                shouldBreak: true,
                reason: `User frustration detected: ${userFrustration.reason}`,
                recovery: 'simplify',
            };
        }
        return { shouldBreak: false, recovery: 'retry' };
    }
    detectRepetition(messages) {
        const assistantMsgs = messages
            .filter((m) => m.role === 'assistant')
            .slice(-5)
            .map((m) => (typeof m.content === 'string' ? m.content : JSON.stringify(m.content)));
        if (assistantMsgs.length < 3) {
            return { count: 0, pattern: '' };
        }
        const lastMsg = assistantMsgs[assistantMsgs.length - 1];
        let similarCount = 1;
        for (let i = assistantMsgs.length - 2; i >= 0; i--) {
            if (this.areSimilar(lastMsg, assistantMsgs[i])) {
                similarCount++;
            }
            else {
                break;
            }
        }
        return {
            count: similarCount,
            pattern: lastMsg.substring(0, 60) + (lastMsg.length > 60 ? '...' : ''),
        };
    }
    areSimilar(msg1, msg2) {
        const normalize = (s) => s
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        const n1 = normalize(msg1);
        const n2 = normalize(msg2);
        const getFirstWords = (s, count = 5) => s.split(' ').slice(0, count).join(' ');
        const firstWords1 = getFirstWords(n1);
        const firstWords2 = getFirstWords(n2);
        if (firstWords1 === firstWords2 && firstWords1.length > 10) {
            return true;
        }
        const shorterLength = Math.min(n1.length, n2.length);
        if (shorterLength > 30) {
            const longer = n1.length > n2.length ? n1 : n2;
            const shorter = n1.length <= n2.length ? n1 : n2;
            const similarity = shorter.split(' ').filter(word => word.length > 3 && longer.includes(word)).length / shorter.split(' ').length;
            if (similarity > 0.7) {
                return true;
            }
        }
        return false;
    }
    detectUserFrustration(messages) {
        const userMsgs = messages
            .filter((m) => m.role === 'user')
            .slice(-5)
            .map((m) => (typeof m.content === 'string' ? m.content : ''));
        if (userMsgs.length < 2) {
            return { isFrustrated: false };
        }
        const frustrationPatterns = [
            /!!+/i,
            /\?\?+/i,
            /wtf|wth|omg|seriously|come on|please/i,
            /^(i said|i told you|i already|again)/i,
            /not working|doesn't work|broken|stuck/i,
            /^help$/i,
            /forget (it|this)|never ?mind|cancel everything/i,
        ];
        const recentUserMsgs = userMsgs.slice(-3);
        const frustratedCount = recentUserMsgs.filter((msg) => frustrationPatterns.some((pattern) => pattern.test(msg))).length;
        if (frustratedCount >= 2) {
            return {
                isFrustrated: true,
                reason: 'Multiple frustration indicators in recent messages',
            };
        }
        if (userMsgs.length >= 3) {
            const lastUserMsg = userMsgs[userMsgs.length - 1];
            const repetitions = userMsgs.slice(0, -1).filter((msg) => this.areSimilar(msg, lastUserMsg)).length;
            if (repetitions >= 2) {
                return {
                    isFrustrated: true,
                    reason: 'User repeating same message multiple times',
                };
            }
        }
        return { isFrustrated: false };
    }
    async recordTrip(customerId, reason) {
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
        }
        catch (error) {
            this.logger.error(`[CIRCUIT_BREAKER] Failed to record trip: ${error.message}`);
        }
    }
};
exports.CircuitBreakerService = CircuitBreakerService;
exports.CircuitBreakerService = CircuitBreakerService = CircuitBreakerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CircuitBreakerService);
//# sourceMappingURL=circuit-breaker.service.js.map