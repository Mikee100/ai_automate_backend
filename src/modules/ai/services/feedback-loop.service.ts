// src/modules/ai/services/feedback-loop.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConversationLearningService } from './conversation-learning.service';

@Injectable()
export class FeedbackLoopService {
    private readonly logger = new Logger(FeedbackLoopService.name);

    constructor(
        private prisma: PrismaService,
        private conversationLearning: ConversationLearningService,
    ) { }

    /**
     * Collect feedback on AI response
     */
    async collectFeedback(predictionId: number, feedback: {
        thumbsUp?: boolean;
        rating?: number;
        comment?: string;
        wasHelpful?: boolean;
        wasAccurate?: boolean;
        wasEmpathetic?: boolean;
    }) {
        const responseFeedback = await this.prisma.responseFeedback.create({
            data: {
                predictionId,
                ...feedback,
            },
        });

        this.logger.log(`Collected feedback for prediction ${predictionId}: ${feedback.thumbsUp ? '👍' : '👎'}`);

        // Real-time learning: Process feedback immediately
        this.processFeedbackRealTime(predictionId, feedback).catch(err => {
            this.logger.error('Error in real-time feedback processing', err);
        });

        // Trigger learning if negative feedback
        if (feedback.thumbsUp === false || (feedback.rating && feedback.rating < 3)) {
            await this.triggerImprovement(predictionId);
        }

        return responseFeedback;
    }

    /**
     * Process feedback in real-time
     */
    private async processFeedbackRealTime(
        predictionId: number,
        feedback: {
            thumbsUp?: boolean;
            rating?: number;
            wasHelpful?: boolean;
            wasAccurate?: boolean;
            wasEmpathetic?: boolean;
        }
    ): Promise<void> {
        try {
            const prediction = await this.prisma.aiPrediction.findUnique({
                where: { id: predictionId },
            });

            if (!prediction) return;

            // If positive feedback, consider adding to knowledge base
            if (feedback.thumbsUp === true || (feedback.rating && feedback.rating >= 4)) {
                await this.considerAddingSuccessfulResponseToKB(prediction);
            }

            // If negative feedback, analyze what went wrong
            if (feedback.thumbsUp === false || (feedback.rating && feedback.rating < 3)) {
                await this.analyzeNegativeFeedback(prediction, feedback);
            }
        } catch (error) {
            this.logger.error('Error in real-time feedback processing', error);
        }
    }

    /**
     * Consider adding successful response to KB in real-time
     */
    private async considerAddingSuccessfulResponseToKB(prediction: any): Promise<void> {
        try {
            // Check if this looks like a FAQ question
            const isFAQ = /^(what|how|when|where|why|can|do|is|are|does|will)/i.test(prediction.input.trim());

            if (!isFAQ) return;

            // Check if similar question exists
            const existing = await this.prisma.knowledgeBase.findFirst({
                where: {
                    question: { contains: prediction.input.substring(0, 50), mode: 'insensitive' },
                },
            });

            if (existing) {
                // Update if this response is better
                const existingLength = existing.answer.length;
                const newLength = prediction.prediction.length;
                
                // Prefer longer, more detailed responses
                if (newLength > existingLength * 1.2) {
                    await this.prisma.knowledgeBase.update({
                        where: { id: existing.id },
                        data: {
                            answer: prediction.prediction,
                            updatedAt: new Date(),
                        },
                    });
                    this.logger.log(`Real-time KB update: Improved answer for "${prediction.input.substring(0, 50)}..."`);
                }
                return;
            }

            // Add new FAQ entry
            await this.prisma.knowledgeBase.create({
                data: {
                    question: prediction.input,
                    answer: prediction.prediction,
                    category: 'general',
                    embedding: [], // Will be populated by embedding service
                },
            });
            this.logger.log(`Real-time KB update: Added new FAQ "${prediction.input.substring(0, 50)}..."`);
        } catch (error) {
            this.logger.error('Error adding successful response to KB', error);
        }
    }

    /**
     * Analyze negative feedback in real-time
     */
    private async analyzeNegativeFeedback(
        prediction: any,
        feedback: {
            wasHelpful?: boolean;
            wasAccurate?: boolean;
            wasEmpathetic?: boolean;
        }
    ): Promise<void> {
        try {
            const issues: string[] = [];
            if (feedback.wasHelpful === false) issues.push('not_helpful');
            if (feedback.wasAccurate === false) issues.push('inaccurate');
            if (feedback.wasEmpathetic === false) issues.push('not_empathetic');

            // Store failure analysis
            await this.prisma.conversationLearning.create({
                data: {
                    customerId: 'system',
                    userMessage: prediction.input,
                    aiResponse: prediction.prediction,
                    extractedIntent: 'unknown',
                    wasSuccessful: false,
                    conversationOutcome: `negative_feedback: ${issues.join(', ')}`,
                    shouldAddToKB: false,
                },
            });

            this.logger.warn(`Negative feedback analyzed: ${issues.join(', ')} for "${prediction.input.substring(0, 50)}..."`);
        } catch (error) {
            this.logger.error('Error analyzing negative feedback', error);
        }
    }

    /**
     * Trigger improvement process for failed interaction
     */
    private async triggerImprovement(predictionId: number) {
        const prediction = await this.prisma.aiPrediction.findUnique({
            where: { id: predictionId },
        });

        if (!prediction) return;

        this.logger.warn(`Triggering improvement for failed prediction: "${prediction.input}"`);

        // Log for analysis
        await this.prisma.conversationLearning.create({
            data: {
                customerId: 'system', // System-level learning
                userMessage: prediction.input,
                aiResponse: prediction.prediction,
                extractedIntent: 'unknown',
                wasSuccessful: false,
                conversationOutcome: 'negative_feedback',
                shouldAddToKB: true, // Flag for review
            },
        });
    }

    /**
     * Generate improvement report
     */
    async generateImprovementReport(days = 7) {
        const since = new Date();
        since.setDate(since.getDate() - days);

        const feedbacks = await this.prisma.responseFeedback.findMany({
            where: {
                createdAt: { gte: since },
            },
            include: {
                prediction: true,
            },
        });

        const totalFeedback = feedbacks.length;
        const positiveFeedback = feedbacks.filter(f => f.thumbsUp === true).length;
        const negativeFeedback = feedbacks.filter(f => f.thumbsUp === false).length;
        const avgRating = feedbacks
            .filter(f => f.rating !== null)
            .reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.filter(f => f.rating).length || 0;

        // Analyze common issues
        const unhelpfulResponses = feedbacks.filter(f => f.wasHelpful === false);
        const inaccurateResponses = feedbacks.filter(f => f.wasAccurate === false);
        const unempatheticResponses = feedbacks.filter(f => f.wasEmpathetic === false);

        const report = {
            period: `Last ${days} days`,
            totalFeedback,
            positiveFeedback,
            negativeFeedback,
            satisfactionRate: totalFeedback > 0 ? positiveFeedback / totalFeedback : 0,
            avgRating,
            issues: {
                unhelpful: unhelpfulResponses.length,
                inaccurate: inaccurateResponses.length,
                unempathetic: unempatheticResponses.length,
            },
            topIssues: this.identifyTopIssues(feedbacks),
            recommendations: this.generateRecommendations(feedbacks),
        };

        this.logger.log(`Improvement report generated: ${(report.satisfactionRate * 100).toFixed(1)}% satisfaction`);
        return report;
    }

    /**
     * Identify top issues from feedback
     */
    private identifyTopIssues(feedbacks: any[]): string[] {
        const issues: string[] = [];
        const negativeFeedbacks = feedbacks.filter(f => f.thumbsUp === false || (f.rating && f.rating < 3));

        if (negativeFeedbacks.length === 0) return [];

        // Group by prediction input to find patterns
        const intentMap = new Map<string, number>();
        negativeFeedbacks.forEach(f => {
            const input = f.prediction.input.toLowerCase();
            // Extract potential intent keywords
            const keywords = input.match(/\b(book|package|price|reschedule|cancel|when|what|how)\b/g) || [];
            keywords.forEach(kw => {
                intentMap.set(kw, (intentMap.get(kw) || 0) + 1);
            });
        });

        // Top 3 problematic areas
        const sorted = Array.from(intentMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);
        sorted.forEach(([keyword, count]) => {
            issues.push(`${count} issues related to "${keyword}" queries`);
        });

        return issues;
    }

    /**
     * Generate improvement recommendations
     */
    private generateRecommendations(feedbacks: any[]): string[] {
        const recommendations: string[] = [];
        const negativeFeedbacks = feedbacks.filter(f => f.thumbsUp === false);

        if (negativeFeedbacks.length === 0) {
            recommendations.push('Great job! Keep maintaining current quality standards.');
            return recommendations;
        }

        const unhelpfulCount = feedbacks.filter(f => f.wasHelpful === false).length;
        const inaccurateCount = feedbacks.filter(f => f.wasAccurate === false).length;
        const unempatheticCount = feedbacks.filter(f => f.wasEmpathetic === false).length;

        if (unhelpfulCount > feedbacks.length * 0.2) {
            recommendations.push('Improve response helpfulness - consider adding more actionable information');
        }

        if (inaccurateCount > feedbacks.length * 0.15) {
            recommendations.push('Review knowledge base accuracy - some responses may contain outdated information');
        }

        if (unempatheticCount > feedbacks.length * 0.15) {
            recommendations.push('Enhance emotional intelligence - responses may need more empathy and warmth');
        }

        if (negativeFeedbacks.length > feedbacks.length * 0.3) {
            recommendations.push('High negative feedback rate - consider reviewing conversation flows');
        }

        return recommendations;
    }

    /**
     * Auto-trigger knowledge base improvements
     */
    async autoTriggerImprovements() {
        this.logger.log('Running auto-improvement process...');

        // Extract potential FAQs from successful conversations
        const result = await this.conversationLearning.autoImproveKnowledgeBase();

        // Generate improvement report
        const report = await this.generateImprovementReport(7);

        this.logger.log(`Auto-improvement complete: Added ${result.added} FAQs, Satisfaction: ${(report.satisfactionRate * 100).toFixed(1)}%`);

        return {
            faqsAdded: result.added,
            satisfactionRate: report.satisfactionRate,
            recommendations: report.recommendations,
        };
    }

    /**
     * Track A/B test results
     */
    async trackABTest(variant: string, predictionId: number, wasSuccessful: boolean) {
        // Store A/B test results in metadata
        await this.prisma.aiPrediction.update({
            where: { id: predictionId },
            data: {
                // Store variant in a custom field or use existing fields creatively
                modelVersion: `${variant}`, // Repurpose this field for A/B testing
            },
        });

        this.logger.debug(`A/B test tracked: variant=${variant}, success=${wasSuccessful}`);
    }
}
