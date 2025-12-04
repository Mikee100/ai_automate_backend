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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var FollowupsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowupsService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const prisma_service_1 = require("../../prisma/prisma.service");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
const luxon_1 = require("luxon");
let FollowupsService = FollowupsService_1 = class FollowupsService {
    constructor(prisma, whatsappService, followupsQueue) {
        this.prisma = prisma;
        this.whatsappService = whatsappService;
        this.followupsQueue = followupsQueue;
        this.logger = new common_1.Logger(FollowupsService_1.name);
        this.STUDIO_TZ = 'Africa/Nairobi';
    }
    async scheduleFollowupsForBooking(bookingId) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { customer: true },
        });
        if (!booking) {
            throw new common_1.NotFoundException(`Booking ${bookingId} not found`);
        }
        const bookingDateTime = luxon_1.DateTime.fromJSDate(booking.dateTime).setZone(this.STUDIO_TZ);
        const deliveryDate = this.addWorkingDays(bookingDateTime, 10);
        const reviewDate = this.addWorkingDays(bookingDateTime, 11);
        const upsellDate = this.addWorkingDays(bookingDateTime, 12);
        const followups = [];
        if (deliveryDate > luxon_1.DateTime.now()) {
            const delivery = await this.createFollowup({
                bookingId,
                type: 'delivery',
                scheduledFor: deliveryDate.toISO(),
            });
            followups.push(delivery);
            await this.followupsQueue.add('send-followup', { followupId: delivery.id }, { delay: deliveryDate.diff(luxon_1.DateTime.now()).milliseconds });
        }
        if (reviewDate > luxon_1.DateTime.now()) {
            const review = await this.createFollowup({
                bookingId,
                type: 'review_request',
                scheduledFor: reviewDate.toISO(),
            });
            followups.push(review);
            await this.followupsQueue.add('send-followup', { followupId: review.id }, { delay: reviewDate.diff(luxon_1.DateTime.now()).milliseconds });
        }
        if (upsellDate > luxon_1.DateTime.now()) {
            const upsell = await this.createFollowup({
                bookingId,
                type: 'upsell',
                scheduledFor: upsellDate.toISO(),
                metadata: {
                    suggestedPackages: ['Newborn Package', 'Family Package'],
                },
            });
            followups.push(upsell);
            await this.followupsQueue.add('send-followup', { followupId: upsell.id }, { delay: upsellDate.diff(luxon_1.DateTime.now()).milliseconds });
        }
        this.logger.log(`Scheduled ${followups.length} follow-ups for booking ${bookingId}`);
        return followups;
    }
    addWorkingDays(startDate, daysToAdd) {
        let current = startDate;
        let addedDays = 0;
        while (addedDays < daysToAdd) {
            current = current.plus({ days: 1 });
            if (current.weekday !== 6 && current.weekday !== 7) {
                addedDays++;
            }
        }
        return current;
    }
    async createFollowup(data) {
        return this.prisma.postShootFollowup.create({
            data: {
                bookingId: data.bookingId,
                type: data.type,
                scheduledFor: new Date(data.scheduledFor),
                messageContent: data.messageContent,
                metadata: data.metadata || {},
            },
        });
    }
    async getFollowups(filters) {
        const where = {};
        if (filters.bookingId)
            where.bookingId = filters.bookingId;
        if (filters.type)
            where.type = filters.type;
        if (filters.status)
            where.status = filters.status;
        const limit = filters.limit ? parseInt(filters.limit) : 50;
        const offset = filters.offset ? parseInt(filters.offset) : 0;
        const [followups, total] = await Promise.all([
            this.prisma.postShootFollowup.findMany({
                where,
                include: {
                    booking: {
                        include: { customer: true },
                    },
                },
                orderBy: { scheduledFor: 'asc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.postShootFollowup.count({ where }),
        ]);
        return { followups, total };
    }
    async getFollowupById(id) {
        const followup = await this.prisma.postShootFollowup.findUnique({
            where: { id },
            include: {
                booking: {
                    include: { customer: true },
                },
            },
        });
        if (!followup) {
            throw new common_1.NotFoundException(`Follow-up ${id} not found`);
        }
        return followup;
    }
    async updateFollowup(id, data) {
        return this.prisma.postShootFollowup.update({
            where: { id },
            data: {
                ...(data.scheduledFor && { scheduledFor: new Date(data.scheduledFor) }),
                ...(data.status && { status: data.status }),
                ...(data.messageContent && { messageContent: data.messageContent }),
                ...(data.metadata && { metadata: data.metadata }),
            },
        });
    }
    async cancelFollowupsForBooking(bookingId) {
        const result = await this.prisma.postShootFollowup.updateMany({
            where: {
                bookingId,
                status: 'pending',
            },
            data: {
                status: 'cancelled',
            },
        });
        this.logger.log(`Cancelled ${result.count} follow-ups for booking ${bookingId}`);
        return result;
    }
    async sendFollowup(followupId) {
        const followup = await this.getFollowupById(followupId);
        if (followup.status !== 'pending') {
            this.logger.warn(`Follow-up ${followupId} is not pending (status: ${followup.status})`);
            return followup;
        }
        try {
            const message = this.generateFollowupMessage(followup);
            const customerPhone = followup.booking.customer.whatsappId || followup.booking.customer.phone;
            if (customerPhone) {
                await this.whatsappService.sendMessage(customerPhone, message);
            }
            await this.updateFollowup(followupId, {
                status: 'sent',
                messageContent: message,
            });
            await this.prisma.postShootFollowup.update({
                where: { id: followupId },
                data: { sentAt: new Date() },
            });
            this.logger.log(`Sent follow-up ${followupId} for booking ${followup.bookingId}`);
            return await this.getFollowupById(followupId);
        }
        catch (error) {
            this.logger.error(`Failed to send follow-up ${followupId}`, error);
            await this.updateFollowup(followupId, { status: 'failed' });
            throw error;
        }
    }
    async recordResponse(followupId, response) {
        const followup = await this.getFollowupById(followupId);
        const metadata = {
            ...(followup.metadata || {}),
            response: {
                ...(response.rating && { rating: parseInt(response.rating) }),
                ...(response.feedback && { feedback: response.feedback }),
                ...(response.upsellInterest && { upsellInterest: response.upsellInterest }),
                respondedAt: new Date().toISOString(),
            },
        };
        return this.updateFollowup(followupId, { metadata });
    }
    generateFollowupMessage(followup) {
        const booking = followup.booking;
        const customerName = booking.recipientName || booking.customer.name;
        if (followup.type === 'delivery') {
            return `📸 *Your Beautiful Photos Are Ready!* 📸

Hi ${customerName}! 💖

We're thrilled to let you know that your edited maternity photos are ready for download! ✨

We've poured our hearts into editing each image to perfection, and we can't wait for you to see them! 🌟

📥 *Download Your Photos:*
We'll be sending you a secure link shortly where you can download all your beautiful images.

💝 *What's Included:*
• All edited soft copy images from your ${booking.service} package
• High-resolution files perfect for printing
• Ready to share with family and friends!

Thank you for choosing Fiesta House Attire to capture this special moment in your journey. We hope these photos bring you joy for years to come! 💕

If you have any questions about your photos, feel free to reach out!

With love,
Fiesta House Attire Team 🌸`;
        }
        else if (followup.type === 'review_request') {
            return `⭐ *We'd Love Your Feedback!* ⭐

Hi ${customerName}! 💖

We hope you're absolutely loving your maternity photos! 📸✨

Your experience matters so much to us, and we'd be incredibly grateful if you could take a moment to share your thoughts.

🌟 *How was your experience?*
Please rate us from 1-5 stars:
⭐ (1 star) - Not satisfied
⭐⭐ (2 stars) - Could be better
⭐⭐⭐ (3 stars) - Good
⭐⭐⭐⭐ (4 stars) - Great!
⭐⭐⭐⭐⭐ (5 stars) - Absolutely amazing!

Simply reply with your rating and any feedback you'd like to share. Your honest review helps us serve expecting mothers better! 💕

Thank you for being part of the Fiesta House Attire family! 🌸

P.S. If you loved your experience, we'd be honored if you could share your photos and tag us on social media! 📱`;
        }
        else if (followup.type === 'upsell') {
            return `👶 *Special Offer Just for You!* 👶

Hi ${customerName}! 💖

We loved capturing your maternity journey, and we'd be honored to continue documenting your beautiful story!

🎁 *Exclusive Offer for Our Valued Clients:*

As a thank you for choosing us, we're offering you *15% OFF* your next photoshoot package! Perfect for:

📸 *Newborn Photography* - Capture those precious first days
👨‍👩‍👧 *Family Sessions* - Beautiful moments with your growing family
🎂 *Baby Milestones* - First birthday, sitting up, first steps

✨ *Why Book With Us Again?*
• You already know and trust our work
• We know your style and preferences
• Priority booking for our returning clients
• Special family discount packages

💝 *Ready to Book?*
Just reply to this message or call us at 0720 111928 to schedule your next session!

This offer is valid for the next 30 days. We can't wait to see your little one! 💕

With love,
Fiesta House Attire Team 🌸`;
        }
        return `Thank you for choosing Fiesta House Attire! 💖`;
    }
    async getFollowupAnalytics() {
        const [total, sent, pending, withResponses] = await Promise.all([
            this.prisma.postShootFollowup.count(),
            this.prisma.postShootFollowup.count({ where: { status: 'sent' } }),
            this.prisma.postShootFollowup.count({ where: { status: 'pending' } }),
            this.prisma.postShootFollowup.count({
                where: {
                    metadata: {
                        path: ['response'],
                        not: null,
                    },
                },
            }),
        ]);
        const reviews = await this.prisma.postShootFollowup.findMany({
            where: {
                type: 'review_request',
                status: 'sent',
            },
        });
        const ratings = reviews
            .map(r => r.metadata?.response?.rating)
            .filter(rating => rating !== undefined && rating !== null);
        const averageRating = ratings.length > 0
            ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
            : 0;
        const upsells = await this.prisma.postShootFollowup.findMany({
            where: {
                type: 'upsell',
                status: 'sent',
            },
        });
        const interestedInUpsell = upsells.filter(u => u.metadata?.response?.upsellInterest === 'interested').length;
        const upsellConversionRate = upsells.length > 0
            ? (interestedInUpsell / upsells.length) * 100
            : 0;
        return {
            total,
            sent,
            pending,
            responseRate: sent > 0 ? (withResponses / sent) * 100 : 0,
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews: ratings.length,
            upsellConversionRate: Math.round(upsellConversionRate * 10) / 10,
        };
    }
    async getUpcomingFollowups(limit = 10) {
        return this.prisma.postShootFollowup.findMany({
            where: {
                status: 'pending',
                scheduledFor: {
                    gte: new Date(),
                },
            },
            include: {
                booking: {
                    include: { customer: true },
                },
            },
            orderBy: { scheduledFor: 'asc' },
            take: limit,
        });
    }
};
exports.FollowupsService = FollowupsService;
exports.FollowupsService = FollowupsService = FollowupsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bull_1.InjectQueue)('followupsQueue')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        whatsapp_service_1.WhatsappService, Object])
], FollowupsService);
//# sourceMappingURL=followups.service.js.map