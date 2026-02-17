import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
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
        private configService: ConfigService,
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
     * Hourly cron job to check for abandoned bookings and send gentle nudges.
     * Identifies drafts stuck in 'confirm' or pending payments.
     */
    @Cron(CronExpression.EVERY_HOUR)
    async checkAbandonedBookings() {
        this.logger.log('Running hourly abandoned booking recovery check');

        try {
            const oneHourAgo = DateTime.now().setZone(this.studioTz).minus({ hours: 1 }).toJSDate();
            const thirtyMinsAgo = DateTime.now().setZone(this.studioTz).minus({ minutes: 30 }).toJSDate();
            const twentyFourHoursAgo = DateTime.now().setZone(this.studioTz).minus({ hours: 24 }).toJSDate();

            // 1. Find drafts stuck in 'confirm' step for > 1 hour
            const abandonedDrafts = await this.prisma.bookingDraft.findMany({
                where: {
                    step: 'confirm',
                    updatedAt: { lt: oneHourAgo },
                    // Make sure they haven't been nudged in the last 24 hours
                    customer: {
                        proactiveOutreaches: {
                            none: {
                                type: 'abandoned_booking',
                                createdAt: { gte: twentyFourHoursAgo }
                            }
                        }
                    }
                },
                include: { customer: true }
            });

            // 2. Find pending payments for > 30 minutes
            const pendingPayments = await this.prisma.payment.findMany({
                where: {
                    status: 'pending',
                    createdAt: { lt: thirtyMinsAgo },
                    bookingDraft: {
                        customer: {
                            proactiveOutreaches: {
                                none: {
                                    type: 'abandoned_booking',
                                    createdAt: { gte: twentyFourHoursAgo }
                                }
                            }
                        }
                    }
                },
                include: {
                    bookingDraft: {
                        include: { customer: true }
                    }
                }
            });

            const uniqueCustomers = new Map<string, any>();

            abandonedDrafts.forEach(d => uniqueCustomers.set(d.customerId, { draft: d, customer: d.customer }));
            pendingPayments.forEach(p => {
                if (p.bookingDraft) {
                    uniqueCustomers.set(p.bookingDraft.customerId, { draft: p.bookingDraft, customer: p.bookingDraft.customer, isPaymentIssue: true });
                }
            });

            this.logger.log(`Found ${uniqueCustomers.size} potential abandoned bookings to nudge.`);

            for (const [customerId, data] of uniqueCustomers.entries()) {
                const { draft, customer, isPaymentIssue } = data;

                try {
                    const recipientName = draft.recipientName || customer.name || 'there';
                    const service = draft.service || 'your photoshoot';

                    let nudgeMessage = '';
                    if (isPaymentIssue) {
                        nudgeMessage = `Hi ${recipientName}! 🌸 Just checking in to see if you had any trouble with the deposit prompt for your *${service}*? \n\nI'm still holding your spot, but if the prompt didn't show up or you have any questions, just let me know! I'm here to help. 💖`;
                    } else {
                        nudgeMessage = `Hi ${recipientName}! 🌸 I noticed we were almost finished with your *${service}* booking. \n\nI'd love to get that confirmed for you so we can start getting everything ready! Did you have any questions about the package or the date? ✨`;
                    }

                    // Send the message
                    await this.messagesService.sendOutboundMessage(customerId, nudgeMessage, 'whatsapp');

                    // Record the outreach to prevent over-notifying
                    await this.prisma.proactiveOutreach.create({
                        data: {
                            customerId,
                            type: 'abandoned_booking',
                            status: 'sent',
                            scheduledFor: new Date(),
                            sentAt: new Date(),
                            messageContent: nudgeMessage,
                            channel: 'whatsapp'
                        }
                    });

                    this.logger.log(`Sent abandoned booking nudge to customer ${customerId}`);
                } catch (err) {
                    this.logger.error(`Failed to send nudge to customer ${customerId}`, err);
                }
            }

        } catch (error) {
            this.logger.error('Error in checkAbandonedBookings cron job', error);
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

    /**
     * Manual trigger for testing nudges
     */
    async triggerNudgesManually() {
        this.logger.log('Manually triggering nudges');
        await this.checkAbandonedBookings();
    }
}
