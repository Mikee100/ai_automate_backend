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
var ConversationLearningService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationLearningService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = require("openai");
const prisma_service_1 = require("../../../prisma/prisma.service");
let ConversationLearningService = ConversationLearningService_1 = class ConversationLearningService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.logger = new common_1.Logger(ConversationLearningService_1.name);
        this.openai = new openai_1.default({
            apiKey: this.configService.get('OPENAI_API_KEY')
        });
        this.enableRealTimeLearning = this.configService.get('ENABLE_REAL_TIME_LEARNING', true);
    }
    async recordLearning(customerId, entry, conversationId) {
        const learning = await this.prisma.conversationLearning.create({
            data: {
                customerId,
                conversationId,
                userMessage: entry.userMessage,
                aiResponse: entry.aiResponse,
                extractedIntent: entry.extractedIntent,
                detectedEmotionalTone: entry.emotionalTone,
                wasSuccessful: entry.wasSuccessful,
                conversationOutcome: entry.conversationOutcome,
                conversationLength: entry.conversationLength || 1,
                timeToResolution: entry.timeToResolution,
            },
        });
        this.logger.debug(`Recorded learning for customer ${customerId}, intent: ${entry.extractedIntent}`);
        if (this.enableRealTimeLearning) {
            this.processRealTimeLearning(learning, entry).catch(err => {
                this.logger.error('Error in real-time learning', err);
            });
        }
        return learning;
    }
    async processRealTimeLearning(learning, entry) {
        try {
            if (entry.wasSuccessful && entry.extractedIntent === 'faq') {
                await this.considerAddingToKB(learning);
            }
            if (!entry.wasSuccessful) {
                await this.analyzeFailurePattern(learning, entry);
            }
            await this.updateResponsePatterns(entry.extractedIntent, entry);
        }
        catch (error) {
            this.logger.error('Error in real-time learning processing', error);
        }
    }
    async considerAddingToKB(learning) {
        try {
            const existing = await this.prisma.knowledgeBase.findFirst({
                where: {
                    question: { contains: learning.userMessage.substring(0, 50), mode: 'insensitive' },
                },
            });
            if (existing) {
                const existingScore = await this.scoreKBEntry(existing.answer, learning.userMessage);
                const newScore = await this.scoreKBEntry(learning.aiResponse, learning.userMessage);
                if (newScore > existingScore) {
                    await this.prisma.knowledgeBase.update({
                        where: { id: existing.id },
                        data: {
                            answer: learning.aiResponse,
                            updatedAt: new Date(),
                        },
                    });
                    this.logger.log(`Updated KB entry: "${learning.userMessage.substring(0, 50)}..."`);
                }
                return;
            }
            const similarCount = await this.prisma.conversationLearning.count({
                where: {
                    userMessage: { contains: learning.userMessage.substring(0, 30), mode: 'insensitive' },
                    wasSuccessful: true,
                    extractedIntent: 'faq',
                },
            });
            if (similarCount >= 2) {
                await this.prisma.knowledgeBase.create({
                    data: {
                        question: learning.userMessage,
                        answer: learning.aiResponse,
                        category: 'general',
                        embedding: [],
                    },
                });
                this.logger.log(`Real-time KB update: Added "${learning.userMessage.substring(0, 50)}..."`);
            }
        }
        catch (error) {
            this.logger.error('Error in real-time KB update', error);
        }
    }
    async analyzeFailurePattern(learning, entry) {
        try {
            const failureAnalysis = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{
                        role: 'system',
                        content: 'Analyze why this customer service interaction failed. Return JSON with: reason (string), pattern (string), suggestion (string)'
                    }, {
                        role: 'user',
                        content: `User: ${entry.userMessage}\nAI: ${entry.aiResponse}\nOutcome: ${entry.conversationOutcome || 'failed'}`
                    }],
                response_format: { type: 'json_object' },
                temperature: 0.3,
            });
            const analysis = JSON.parse(failureAnalysis.choices[0].message.content || '{}');
            await this.prisma.conversationLearning.update({
                where: { id: learning.id },
                data: {
                    newKnowledgeExtracted: JSON.stringify(analysis),
                    shouldAddToKB: false,
                },
            });
            this.logger.warn(`Failure pattern identified: ${analysis.reason}`);
        }
        catch (error) {
            this.logger.error('Error analyzing failure pattern', error);
        }
    }
    async updateResponsePatterns(intent, entry) {
        try {
            const recentSuccessful = await this.getSuccessfulPatterns(intent, 5);
            if (entry.wasSuccessful && recentSuccessful.length > 0) {
                const patternMatch = recentSuccessful.some(pattern => this.similarity(pattern.aiResponse, entry.aiResponse) > 0.8);
                if (!patternMatch) {
                    this.logger.debug(`New successful pattern identified for intent: ${intent}`);
                }
            }
        }
        catch (error) {
            this.logger.error('Error updating response patterns', error);
        }
    }
    async scoreKBEntry(answer, question) {
        const lengthScore = Math.min(answer.length / 100, 1);
        const completenessScore = answer.includes('?') ? 0.8 : 1;
        return (lengthScore + completenessScore) / 2;
    }
    similarity(text1, text2) {
        const words1 = new Set(text1.toLowerCase().split(/\s+/));
        const words2 = new Set(text2.toLowerCase().split(/\s+/));
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        return intersection.size / union.size;
    }
    async markForKBExtraction(learningId, category, extractedKnowledge) {
        await this.prisma.conversationLearning.update({
            where: { id: learningId },
            data: {
                shouldAddToKB: true,
                category,
                newKnowledgeExtracted: extractedKnowledge,
            },
        });
        this.logger.log(`Marked learning ${learningId} for KB extraction in category: ${category}`);
    }
    async getSuccessfulPatterns(intent, limit = 10) {
        return this.prisma.conversationLearning.findMany({
            where: {
                extractedIntent: intent,
                wasSuccessful: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async getFailedConversations(intent, limit = 20) {
        const where = { wasSuccessful: false };
        if (intent)
            where.extractedIntent = intent;
        return this.prisma.conversationLearning.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async analyzePatterns(intent) {
        const successful = await this.getSuccessfulPatterns(intent, 50);
        const failed = await this.getFailedConversations(intent, 50);
        const analysis = {
            intent,
            totalSuccessful: successful.length,
            totalFailed: failed.length,
            successRate: successful.length / (successful.length + failed.length),
            avgTimeToResolution: this.calculateAverage(successful.map(s => s.timeToResolution).filter(Boolean)),
            avgConversationLength: this.calculateAverage(successful.map(s => s.conversationLength)),
            commonEmotionalTones: this.getCommonValues(successful.map(s => s.detectedEmotionalTone).filter(Boolean)),
            commonFailureReasons: this.analyzeFailures(failed),
        };
        this.logger.log(`Pattern analysis for intent "${intent}": ${analysis.successRate * 100}% success rate`);
        return analysis;
    }
    async extractPotentialFAQs(minOccurrences = 3) {
        const learnings = await this.prisma.conversationLearning.findMany({
            where: {
                wasSuccessful: true,
                shouldAddToKB: false,
            },
            orderBy: { createdAt: 'desc' },
            take: 500,
        });
        const questionGroups = new Map();
        learnings.forEach(learning => {
            const normalizedQuestion = this.normalizeQuestion(learning.userMessage);
            if (!questionGroups.has(normalizedQuestion)) {
                questionGroups.set(normalizedQuestion, []);
            }
            questionGroups.get(normalizedQuestion).push(learning);
        });
        const potentialFAQs = [];
        questionGroups.forEach((group, question) => {
            if (group.length >= minOccurrences) {
                const responses = group.map(g => g.aiResponse);
                const mostCommonResponse = this.getMostCommon(responses);
                potentialFAQs.push({
                    question,
                    answer: mostCommonResponse,
                    occurrences: group.length,
                    category: group[0].category || 'general',
                    avgSuccessRate: group.filter(g => g.wasSuccessful).length / group.length,
                });
            }
        });
        this.logger.log(`Extracted ${potentialFAQs.length} potential FAQ entries`);
        return potentialFAQs.sort((a, b) => b.occurrences - a.occurrences);
    }
    async getLearningInsights(days = 30) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        const learnings = await this.prisma.conversationLearning.findMany({
            where: { createdAt: { gte: since } },
        });
        const byIntent = new Map();
        const byEmotionalTone = new Map();
        const byOutcome = new Map();
        learnings.forEach(learning => {
            if (!byIntent.has(learning.extractedIntent)) {
                byIntent.set(learning.extractedIntent, { successful: 0, failed: 0 });
            }
            const intentStats = byIntent.get(learning.extractedIntent);
            if (learning.wasSuccessful)
                intentStats.successful++;
            else
                intentStats.failed++;
            if (learning.detectedEmotionalTone) {
                byEmotionalTone.set(learning.detectedEmotionalTone, (byEmotionalTone.get(learning.detectedEmotionalTone) || 0) + 1);
            }
            if (learning.conversationOutcome) {
                byOutcome.set(learning.conversationOutcome, (byOutcome.get(learning.conversationOutcome) || 0) + 1);
            }
        });
        return {
            totalConversations: learnings.length,
            overallSuccessRate: learnings.filter(l => l.wasSuccessful).length / learnings.length,
            intentBreakdown: Object.fromEntries(byIntent),
            emotionalToneBreakdown: Object.fromEntries(byEmotionalTone),
            outcomeBreakdown: Object.fromEntries(byOutcome),
            avgTimeToResolution: this.calculateAverage(learnings.map(l => l.timeToResolution).filter(Boolean)),
            avgConversationLength: this.calculateAverage(learnings.map(l => l.conversationLength)),
        };
    }
    async autoImproveKnowledgeBase() {
        const potentialFAQs = await this.extractPotentialFAQs(3);
        let added = 0;
        for (const faq of potentialFAQs) {
            const existing = await this.prisma.knowledgeBase.findFirst({
                where: {
                    question: { contains: faq.question.substring(0, 50), mode: 'insensitive' },
                },
            });
            if (!existing && faq.avgSuccessRate > 0.8) {
                await this.prisma.knowledgeBase.create({
                    data: {
                        question: faq.question,
                        answer: faq.answer,
                        category: faq.category,
                        embedding: [],
                    },
                });
                added++;
                this.logger.log(`Auto-added FAQ: "${faq.question.substring(0, 50)}..."`);
            }
        }
        this.logger.log(`Auto-improvement complete: Added ${added} new FAQ entries`);
        return { added, total: potentialFAQs.length };
    }
    calculateAverage(numbers) {
        const valid = numbers.filter(n => n !== null);
        if (valid.length === 0)
            return 0;
        return valid.reduce((sum, n) => sum + n, 0) / valid.length;
    }
    getCommonValues(values) {
        const counts = new Map();
        values.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([value]) => value);
    }
    getMostCommon(values) {
        const counts = new Map();
        values.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])[0][0];
    }
    normalizeQuestion(question) {
        return question
            .toLowerCase()
            .replace(/[?!.,]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 100);
    }
    analyzeFailures(failed) {
        const patterns = [];
        const shortConversations = failed.filter(f => f.conversationLength < 3).length;
        if (shortConversations > failed.length * 0.3) {
            patterns.push('Many failures in short conversations - may need better initial responses');
        }
        const longConversations = failed.filter(f => f.conversationLength > 10).length;
        if (longConversations > failed.length * 0.3) {
            patterns.push('Many failures in long conversations - may indicate confusion or stuck loops');
        }
        return patterns;
    }
};
exports.ConversationLearningService = ConversationLearningService;
exports.ConversationLearningService = ConversationLearningService = ConversationLearningService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], ConversationLearningService);
//# sourceMappingURL=conversation-learning.service.js.map