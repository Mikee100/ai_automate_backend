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
var CronService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const bull_1 = require("@nestjs/bull");
const prisma_service_1 = require("../../prisma/prisma.service");
const messages_service_1 = require("../messages/messages.service");
const luxon_1 = require("luxon");
let CronService = CronService_1 = class CronService {
    constructor(prisma, messagesService, aiQueue) {
        this.prisma = prisma;
        this.messagesService = messagesService;
        this.aiQueue = aiQueue;
        this.logger = new common_1.Logger(CronService_1.name);
        this.studioTz = 'Africa/Nairobi';
    }
    async sendBookingReminders() {
        this.logger.log('Running daily booking reminders cron job');
        try {
            const now = luxon_1.DateTime.now().setZone(this.studioTz);
            const twoDaysFromNow = now.plus({ days: 2 }).startOf('day');
            const oneDayFromNow = now.plus({ days: 1 }).startOf('day');
            const twoDaysEnd = twoDaysFromNow.endOf('day');
            const oneDayEnd = oneDayFromNow.endOf('day');
            const twoDayBookings = await this.prisma.booking.findMany({
                where: {
                    status: 'confirmed',
                    dateTime: {
                        gte: twoDaysFromNow.toJSDate(),
                        lt: twoDaysEnd.toJSDate(),
                    },
                },
                include: { customer: true },
            });
            this.logger.log(`Found ${twoDayBookings.length} bookings for 2-day reminders`);
            for (const booking of twoDayBookings) {
                try {
                    const bookingDt = luxon_1.DateTime.fromJSDate(booking.dateTime).setZone(this.studioTz);
                    const formattedDate = bookingDt.toFormat('MMMM d');
                    const formattedTime = bookingDt.toFormat('h:mm a');
                    const recipientName = booking.recipientName || booking.customer?.name || 'there';
                    const message = `Hi ${recipientName}! 💖\\n\\n` +
                        `Just a sweet reminder that your maternity photoshoot ` +
                        `is coming up *in 2 days* — on *${formattedDate} at ${formattedTime}*. ` +
                        `We're excited to capture your beautiful moments! ✨📸`;
                    await this.messagesService.sendOutboundMessage(booking.customerId, message, 'whatsapp');
                    this.logger.log(`Sent 2-day reminder for booking ${booking.id}`);
                }
                catch (err) {
                    this.logger.error(`Failed to send 2-day reminder for booking ${booking.id}`, err);
                }
            }
            const oneDayBookings = await this.prisma.booking.findMany({
                where: {
                    status: 'confirmed',
                    dateTime: {
                        gte: oneDayFromNow.toJSDate(),
                        lt: oneDayEnd.toJSDate(),
                    },
                },
                include: { customer: true },
            });
            this.logger.log(`Found ${oneDayBookings.length} bookings for 1-day reminders`);
            for (const booking of oneDayBookings) {
                try {
                    const bookingDt = luxon_1.DateTime.fromJSDate(booking.dateTime).setZone(this.studioTz);
                    const formattedDate = bookingDt.toFormat('MMMM d');
                    const formattedTime = bookingDt.toFormat('h:mm a');
                    const recipientName = booking.recipientName || booking.customer?.name || 'there';
                    const message = `Hi ${recipientName}! 💖\\n\\n` +
                        `Just a sweet reminder that your maternity photoshoot ` +
                        `is *tomorrow* — on *${formattedDate} at ${formattedTime}*. ` +
                        `We're excited to capture your beautiful moments! ✨📸`;
                    await this.messagesService.sendOutboundMessage(booking.customerId, message, 'whatsapp');
                    this.logger.log(`Sent 1-day reminder for booking ${booking.id}`);
                }
                catch (err) {
                    this.logger.error(`Failed to send 1-day reminder for booking ${booking.id}`, err);
                }
            }
            this.logger.log('Completed daily booking reminders cron job');
        }
        catch (error) {
            this.logger.error('Error in sendBookingReminders cron job', error);
        }
    }
    async sendPostShootFollowUps() {
        this.logger.log('Running daily post-shoot follow-ups cron job');
        try {
            const now = luxon_1.DateTime.now().setZone(this.studioTz);
            const yesterday = now.minus({ days: 1 }).startOf('day');
            const yesterdayEnd = yesterday.endOf('day');
            const completedBookings = await this.prisma.booking.findMany({
                where: {
                    status: 'confirmed',
                    dateTime: {
                        gte: yesterday.toJSDate(),
                        lt: yesterdayEnd.toJSDate(),
                    },
                },
                include: { customer: true },
            });
            this.logger.log(`Found ${completedBookings.length} bookings for post-shoot follow-ups`);
            for (const booking of completedBookings) {
                try {
                    const recipientName = booking.recipientName || booking.customer?.name || 'there';
                    const message = `Hi ${recipientName}! 💖\\n\\n` +
                        `We hope you had a wonderful experience at your maternity photoshoot yesterday! ` +
                        `We'd love to hear how it went. How was everything? ` +
                        `Your photos will be ready soon, and we can't wait to share them with you! ✨📸\\n\\n` +
                        `If you have any feedback or questions, feel free to let us know. We're here for you! 🌸`;
                    await this.messagesService.sendOutboundMessage(booking.customerId, message, 'whatsapp');
                    this.logger.log(`Sent post-shoot follow-up for booking ${booking.id}`);
                }
                catch (err) {
                    this.logger.error(`Failed to send follow-up for booking ${booking.id}`, err);
                }
            }
            this.logger.log('Completed daily post-shoot follow-ups cron job');
        }
        catch (error) {
            this.logger.error('Error in sendPostShootFollowUps cron job', error);
        }
    }
    async triggerRemindersManually() {
        this.logger.log('Manually triggering reminders');
        await this.sendBookingReminders();
    }
    async triggerFollowUpsManually() {
        this.logger.log('Manually triggering follow-ups');
        await this.sendPostShootFollowUps();
    }
};
exports.CronService = CronService;
__decorate([
    (0, schedule_1.Cron)('0 9 * * *', {
        timeZone: 'Africa/Nairobi',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CronService.prototype, "sendBookingReminders", null);
__decorate([
    (0, schedule_1.Cron)('0 10 * * *', {
        timeZone: 'Africa/Nairobi',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CronService.prototype, "sendPostShootFollowUps", null);
exports.CronService = CronService = CronService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bull_1.InjectQueue)('aiQueue')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        messages_service_1.MessagesService, Object])
], CronService);
//# sourceMappingURL=cron.service.js.map