import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { MessagesService } from '../messages/messages.service';
import { DateTime } from 'luxon';

@Injectable()
export class CronService {
    private readonly logger = new Logger(CronService.name);
    private readonly studioTz = 'Africa/Nairobi';

    constructor(
        private prisma: PrismaService,
        private messagesService: MessagesService,
        @InjectQueue('aiQueue') private aiQueue: Queue,
    ) { }

    /**
     * Daily cron job to send reminders
     * Runs every day at 9:00 AM Nairobi time
     * Sends reminders for bookings 2 days and 1 day away
     */
    @Cron('0 9 * * *', {
        timeZone: 'Africa/Nairobi',
    })
    async sendBookingReminders() {
        this.logger.log('Running daily booking reminders cron job');

        try {
            const now = DateTime.now().setZone(this.studioTz);

            // Calculate target dates for reminders
            const twoDaysFromNow = now.plus({ days: 2 }).startOf('day');
            const oneDayFromNow = now.plus({ days: 1 }).startOf('day');
            const twoDaysEnd = twoDaysFromNow.endOf('day');
            const oneDayEnd = oneDayFromNow.endOf('day');

            // Find bookings for 2 days from now
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
                    const bookingDt = DateTime.fromJSDate(booking.dateTime).setZone(this.studioTz);
                    const formattedDate = bookingDt.toFormat('MMMM d');
                    const formattedTime = bookingDt.toFormat('h:mm a');
                    const recipientName = booking.recipientName || booking.customer?.name || 'there';

                    const message =
                        `Hi ${recipientName}! 💖\\n\\n` +
                        `Just a sweet reminder that your maternity photoshoot ` +
                        `is coming up *in 2 days* — on *${formattedDate} at ${formattedTime}*. ` +
                        `We're excited to capture your beautiful moments! ✨📸`;

                    await this.messagesService.sendOutboundMessage(
                        booking.customerId,
                        message,
                        'whatsapp'
                    );

                    this.logger.log(`Sent 2-day reminder for booking ${booking.id}`);
                } catch (err) {
                    this.logger.error(`Failed to send 2-day reminder for booking ${booking.id}`, err);
                }
            }

            // Find bookings for 1 day from now (tomorrow)
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
                    const bookingDt = DateTime.fromJSDate(booking.dateTime).setZone(this.studioTz);
                    const formattedDate = bookingDt.toFormat('MMMM d');
                    const formattedTime = bookingDt.toFormat('h:mm a');
                    const recipientName = booking.recipientName || booking.customer?.name || 'there';

                    const message =
                        `Hi ${recipientName}! 💖\\n\\n` +
                        `Just a sweet reminder that your maternity photoshoot ` +
                        `is *tomorrow* — on *${formattedDate} at ${formattedTime}*. ` +
                        `We're excited to capture your beautiful moments! ✨📸`;

                    await this.messagesService.sendOutboundMessage(
                        booking.customerId,
                        message,
                        'whatsapp'
                    );

                    this.logger.log(`Sent 1-day reminder for booking ${booking.id}`);
                } catch (err) {
                    this.logger.error(`Failed to send 1-day reminder for booking ${booking.id}`, err);
                }
            }

            this.logger.log('Completed daily booking reminders cron job');
        } catch (error) {
            this.logger.error('Error in sendBookingReminders cron job', error);
        }
    }

    /**
     * Daily cron job to send follow-ups
     * Runs every day at 10:00 AM Nairobi time
     * Sends "How was your shoot?" messages for bookings that happened yesterday
     */
    @Cron('0 10 * * *', {
        timeZone: 'Africa/Nairobi',
    })
    async sendPostShootFollowUps() {
        this.logger.log('Running daily post-shoot follow-ups cron job');

        try {
            const now = DateTime.now().setZone(this.studioTz);

            // Calculate yesterday's date range
            const yesterday = now.minus({ days: 1 }).startOf('day');
            const yesterdayEnd = yesterday.endOf('day');

            // Find bookings that happened yesterday
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

                    const message =
                        `Hi ${recipientName}! 💖\\n\\n` +
                        `We hope you had a wonderful experience at your maternity photoshoot yesterday! ` +
                        `We'd love to hear how it went. How was everything? ` +
                        `Your photos will be ready soon, and we can't wait to share them with you! ✨📸\\n\\n` +
                        `If you have any feedback or questions, feel free to let us know. We're here for you! 🌸`;

                    await this.messagesService.sendOutboundMessage(
                        booking.customerId,
                        message,
                        'whatsapp'
                    );

                    this.logger.log(`Sent post-shoot follow-up for booking ${booking.id}`);
                } catch (err) {
                    this.logger.error(`Failed to send follow-up for booking ${booking.id}`, err);
                }
            }

            this.logger.log('Completed daily post-shoot follow-ups cron job');
        } catch (error) {
            this.logger.error('Error in sendPostShootFollowUps cron job', error);
        }
    }

    /**
     * Manual trigger for testing reminders
     */
    async triggerRemindersManually() {
        this.logger.log('Manually triggering reminders');
        await this.sendBookingReminders();
    }

    /**
     * Manual trigger for testing follow-ups
     */
    async triggerFollowUpsManually() {
        this.logger.log('Manually triggering follow-ups');
        await this.sendPostShootFollowUps();
    }
}
