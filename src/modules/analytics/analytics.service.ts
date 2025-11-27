
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { analyzeSentiment } from './sentiment.util';
import { MessagesService } from '../messages/messages.service';
const keyword_extractor = require('keyword-extractor');
@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => MessagesService)) private messagesService: MessagesService,
  ) { }
  // WhatsApp Sentiment by Topic/Intent
  async whatsappSentimentByTopic() {
    // Get recent WhatsApp inbound messages
    const messages = await this.prisma.message.findMany({
      where: { platform: 'whatsapp', direction: 'inbound' },
      select: { id: true, content: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    // Group by intent/topic
    const topicMap: Record<string, { positive: number; negative: number; neutral: number; total: number }> = {};
    for (const msg of messages) {
      const intent = await this.messagesService.classifyIntent(msg.content);
      if (!topicMap[intent]) {
        topicMap[intent] = { positive: 0, negative: 0, neutral: 0, total: 0 };
      }
      const { mood } = analyzeSentiment(msg.content);
      topicMap[intent][mood]++;
      topicMap[intent].total++;
    }
    // Format for charting: [{ topic, positive, negative, neutral, total }]
    return Object.entries(topicMap).map(([topic, counts]) => ({ topic, ...counts }));
  }

  // Returns a placeholder for returning customers analytics
  returningCustomers() {
    // TODO: Implement actual logic
    return [];
  }

  // WhatsApp Sentiment Analytics
  async whatsappSentimentAnalytics() {
    // Get recent WhatsApp inbound messages (limit to 500 for performance)
    const messages = await this.prisma.message.findMany({
      where: { platform: 'whatsapp', direction: 'inbound' },
      select: { id: true, content: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    const moodCounts = { positive: 0, negative: 0, neutral: 0 };
    const moodSamples = { positive: [], negative: [], neutral: [] };
    for (const msg of messages) {
      const { mood } = analyzeSentiment(msg.content);
      moodCounts[mood]++;
      if (moodSamples[mood].length < 3) {
        moodSamples[mood].push({ content: msg.content, createdAt: msg.createdAt });
      }
    }
    const total = messages.length || 1;
    return {
      distribution: {
        positive: Math.round((moodCounts.positive / total) * 100),
        negative: Math.round((moodCounts.negative / total) * 100),
        neutral: Math.round((moodCounts.neutral / total) * 100),
      },
      samples: moodSamples,
      total,
    };
  }

  async totalWhatsAppCustomers() {
    return this.prisma.customer.count({
      where: { whatsappId: { not: null } },
    });
  }

  async newWhatsAppCustomersPerDay() {
    return this.prisma.customer.groupBy({
      by: ['createdAt'],
      where: { whatsappId: { not: null } },
      _count: { _all: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async customersWithBooking() {
    return this.prisma.customer.count({
      where: {
        whatsappId: { not: null },
        bookings: { some: {} },
      },
    });
  }

  async totalInboundWhatsAppMessages() {
    return this.prisma.message.count({
      where: { platform: 'whatsapp', direction: 'inbound' },
    });
  }

  async totalOutboundWhatsAppMessages() {
    return this.prisma.message.count({
      where: { platform: 'whatsapp', direction: 'outbound' },
    });
  }

  async peakChatHours() {
    const result: any[] = await this.prisma.$queryRaw`SELECT DATE_PART('hour', "createdAt") as hour, COUNT(*) as count FROM "messages" WHERE platform = 'whatsapp' AND direction = 'inbound' GROUP BY hour ORDER BY hour`;
    return result.map(row => ({
      hour: Number(row.hour),
      count: typeof row.count === 'bigint' ? Number(row.count) : row.count
    }));
  }

  async peakChatDays() {
    const result: any[] = await this.prisma.$queryRaw`SELECT TO_CHAR("createdAt", 'Day') as day, COUNT(*) as count FROM "messages" WHERE platform = 'whatsapp' AND direction = 'inbound' GROUP BY day ORDER BY COUNT(*) DESC`;
    return result.map(row => ({
      day: row.day,
      count: typeof row.count === 'bigint' ? Number(row.count) : row.count
    }));
  }

  async whatsappBookingConversionRate() {
    const total = await this.prisma.customer.count({ where: { whatsappId: { not: null } } });
    const withBooking = await this.prisma.customer.count({
      where: { whatsappId: { not: null }, bookings: { some: {} } },
    });
    return total === 0 ? 0 : withBooking / total;
  }

  async bookingStatusCounts() {
    return this.prisma.booking.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
  }

  async aiDisabledFrequency() {
    return this.prisma.customer.count({ where: { aiEnabled: false } });
  }

  async depositRevenue() {
    const result = await this.prisma.payment.aggregate({
      where: { status: 'success' },
      _sum: { amount: true },
    });
    // Convert BigInt to Number if needed
    return {
      ...result,
      _sum: {
        amount: result._sum.amount ? Number(result._sum.amount) : 0,
      }
    }
  }
  // Returns a count of customers with AI enabled vs disabled
  async aiEnabledVsDisabled() {
    const enabled = await this.prisma.customer.count({ where: { aiEnabled: true } });
    const disabled = await this.prisma.customer.count({ where: { aiEnabled: false } });
    return { enabled, disabled };
  }

  // WhatsApp Sentiment Trend Over Time
  async whatsappSentimentTrend() {
    // Get recent WhatsApp inbound messages (limit to 500 for performance)
    const messages = await this.prisma.message.findMany({
      where: { platform: 'whatsapp', direction: 'inbound' },
      select: { id: true, content: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
      take: 500,
    });
    // Group by day (YYYY-MM-DD)
    const trend: Record<string, { positive: number; negative: number; neutral: number; total: number }> = {};
    for (const msg of messages) {
      const day = msg.createdAt.toISOString().slice(0, 10);
      if (!trend[day]) {
        trend[day] = { positive: 0, negative: 0, neutral: 0, total: 0 };
      }
      const { mood } = analyzeSentiment(msg.content);
      trend[day][mood]++;
      trend[day].total++;
    }
    // Format for charting: [{ date, positive, negative, neutral, total }]
    return Object.entries(trend).map(([date, counts]) => ({ date, ...counts }));
  }

  // WhatsApp Most Positive/Negative Messages
  async whatsappMostExtremeMessages() {
    // Get recent WhatsApp inbound messages (limit to 500 for performance)
    const messages = await this.prisma.message.findMany({
      where: { platform: 'whatsapp', direction: 'inbound' },
      select: { id: true, content: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    // Analyze sentiment and keep score
    const scored = messages.map(msg => {
      const sentiment = analyzeSentiment(msg.content);
      return { ...msg, ...sentiment };
    });
    // Sort by score
    const sorted = [...scored].sort((a, b) => b.score - a.score);
    return {
      mostPositive: sorted.slice(0, 3),
      mostNegative: sorted.slice(-3).reverse(),
    };
  }

  // WhatsApp Keyword/Topic Trends
  async whatsappKeywordTrends() {
    // Get recent WhatsApp inbound messages (limit to 500 for performance)
    const messages = await this.prisma.message.findMany({
      where: { platform: 'whatsapp', direction: 'inbound' },
      select: { id: true, content: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    // Extract keywords and count globally
    const keywordCounts: Record<string, number> = {};
    for (const msg of messages) {
      const keywords = keyword_extractor.extract(msg.content, { language: 'english', remove_digits: true, return_changed_case: true, remove_duplicates: true });
      for (const kw of keywords) {
        keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
      }
    }
    // Return top 20 keywords overall
    return Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([keyword, count]) => ({ keyword, count }));
  }
  // WhatsApp Agent/AI Performance Analytics
  async whatsappAgentAIPerformance() {
    // Get recent WhatsApp inbound messages (limit to 500 for performance)
    const messages = await this.prisma.message.findMany({
      where: { platform: 'whatsapp', direction: 'inbound' },
      select: { id: true, content: true, createdAt: true, handledBy: true, isResolved: true, isEscalated: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    // Partition by handledBy: 'agent' or 'ai'
    const stats = {
      agent: { count: 0, positive: 0, negative: 0, neutral: 0, resolved: 0, escalated: 0 },
      ai: { count: 0, positive: 0, negative: 0, neutral: 0, resolved: 0, escalated: 0 },
    };
    for (const msg of messages) {
      const who = msg.handledBy === 'agent' ? 'agent' : 'ai';
      stats[who].count++;
      const { mood } = analyzeSentiment(msg.content);
      stats[who][mood]++;
      if (msg.isResolved) stats[who].resolved++;
      if (msg.isEscalated) stats[who].escalated++;
    }
    // Calculate rates
    const format = (s) => ({
      ...s,
      sentiment: {
        positive: s.count ? Math.round((s.positive / s.count) * 100) : 0,
        negative: s.count ? Math.round((s.negative / s.count) * 100) : 0,
        neutral: s.count ? Math.round((s.neutral / s.count) * 100) : 0,
      },
      resolutionRate: s.count ? Math.round((s.resolved / s.count) * 100) : 0,
      escalationRate: s.count ? Math.round((s.escalated / s.count) * 100) : 0,
    });
    return {
      agent: format(stats.agent),
      ai: format(stats.ai),
    };
  }
  // Enhanced AI Performance Metrics
  async aiPerformanceMetrics() {
    // Get messages from last 30 days for relevant metrics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const messages = await this.prisma.message.findMany({
      where: {
        platform: 'whatsapp',
        createdAt: { gte: thirtyDaysAgo }
      },
      include: { customer: true },
      orderBy: { createdAt: 'desc' }
    });

    const inboundMessages = messages.filter(m => m.direction === 'inbound');
    const outboundMessages = messages.filter(m => m.direction === 'outbound');

    // Calculate response times (time between inbound and next outbound)
    // Only count responses within 5 minutes (300,000ms) to avoid counting cross-conversation delays
    const responseTimes: number[] = [];
    const MAX_RESPONSE_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

    for (let i = 0; i < inboundMessages.length; i++) {
      const inbound = inboundMessages[i];
      const nextOutbound = outboundMessages.find(
        m => m.customerId === inbound.customerId && m.createdAt > inbound.createdAt
      );
      if (nextOutbound) {
        const timeMs = nextOutbound.createdAt.getTime() - inbound.createdAt.getTime();
        // Only include if response is within 5 minutes (immediate conversation)
        if (timeMs <= MAX_RESPONSE_TIME) {
          responseTimes.push(timeMs);
        }
      }
    }

    // Calculate percentiles
    const sorted = [...responseTimes].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
    const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    // Booking conversion rate
    const totalCustomers = await this.prisma.customer.count({
      where: { whatsappId: { not: null } }
    });
    const customersWithBooking = await this.prisma.customer.count({
      where: {
        whatsappId: { not: null },
        bookings: { some: {} }
      }
    });
    const bookingConversionRate = totalCustomers > 0
      ? (customersWithBooking / totalCustomers) * 100
      : 0;

    // Smart actions performance (check logs for '[SMART ACTION]')
    const smartActionMessages = outboundMessages.filter(
      m => m.content.includes('Done! ✅') || m.content.includes('sent a lovely reminder')
    );

    // Package queries (check for package list responses)
    const packageQueryResponses = outboundMessages.filter(
      m => m.content.includes('packages with you') || m.content.includes('KSH')
    );

    // Intent distribution (simplified - counting keywords)
    const intents = {
      booking: inboundMessages.filter(m => /(book|appointment|schedule|reserve)/i.test(m.content)).length,
      pricing: inboundMessages.filter(m => /(price|cost|package|how much)/i.test(m.content)).length,
      inquiry: inboundMessages.filter(m => /(\?|what|when|where|how)/i.test(m.content)).length,
      confirmation: inboundMessages.filter(m => /(yes|yeah|confirm|correct)/i.test(m.content)).length,
      other: 0
    };
    intents.other = inboundMessages.length - (intents.booking + intents.pricing + intents.inquiry + intents.confirmation);

    // Customer satisfaction proxy (based on sentiment)
    let positiveSentiment = 0;
    let negativeSentiment = 0;
    for (const msg of inboundMessages.slice(0, 200)) {
      const { mood } = analyzeSentiment(msg.content);
      if (mood === 'positive') positiveSentiment++;
      if (mood === 'negative') negativeSentiment++;
    }
    const satisfactionScore = inboundMessages.length > 0
      ? ((positiveSentiment / Math.min(inboundMessages.length, 200)) * 100)
      : 0;

    // Messages per conversation (avg messages per customer)
    const customersWithMessages = await this.prisma.customer.findMany({
      where: { messages: { some: {} } },
      include: { _count: { select: { messages: true } } }
    });
    const avgMessagesPerConversation = customersWithMessages.length > 0
      ? customersWithMessages.reduce((sum, c) => sum + c._count.messages, 0) / customersWithMessages.length
      : 0;

    return {
      // Response times
      avgResponseTimeMs: Math.round(avgResponseTime),
      p50ResponseTimeMs: Math.round(p50),
      p95ResponseTimeMs: Math.round(p95),
      p99ResponseTimeMs: Math.round(p99),

      // Conversions
      totalConversations: inboundMessages.length,
      bookingConversionRate: Math.round(bookingConversionRate * 10) / 10,
      customersWithBooking,
      totalCustomers,

      // Actions
      smartActionsTriggered: smartActionMessages.length,
      packageQueriesHandled: packageQueryResponses.length,

      // Engagement
      avgMessagesPerConversation: Math.round(avgMessagesPerConversation * 10) / 10,
      totalInbound: inboundMessages.length,
      totalOutbound: outboundMessages.length,

      // Intent distribution
      topIntents: [
        { intent: 'booking', count: intents.booking },
        { intent: 'pricing', count: intents.pricing },
        { intent: 'inquiry', count: intents.inquiry },
        { intent: 'confirmation', count: intents.confirmation },
        { intent: 'other', count: intents.other }
      ].sort((a, b) => b.count - a.count),

      // Satisfaction
      customerSatisfactionScore: Math.round(satisfactionScore * 10) / 10,
      positiveSentiment,
      negativeSentiment,

      // Period
      periodDays: 30,
      lastUpdated: new Date().toISOString()
    };
  }


}
