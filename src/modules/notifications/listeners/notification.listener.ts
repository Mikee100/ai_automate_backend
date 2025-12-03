import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
    BookingCreatedEvent,
    BookingRescheduledEvent,
    BookingCancelledEvent,
} from '../../bookings/events/booking.events';
import { NotificationsService } from '../notifications.service';
import { DateTime } from 'luxon';

@Injectable()
export class NotificationListener {
    private readonly logger = new Logger(NotificationListener.name);

    constructor(private notificationsService: NotificationsService) { }

    @OnEvent('booking.created')
    async handleBookingCreated(event: BookingCreatedEvent) {
        this.logger.log(`[Event] BookingCreated: bookingId=${event.bookingId}`);

        try {
            const formattedDateTime = DateTime.fromJSDate(event.dateTime)
                .setZone('Africa/Nairobi')
                .toFormat('LLL dd, yyyy h:mm a');

            await this.notificationsService.createNotification({
                type: 'booking',
                title: `New Booking - ${event.service}`,
                message: `${event.customerName || 'Customer'} booked ${event.service} for ${formattedDateTime}`,
                metadata: {
                    bookingId: event.bookingId,
                    customerId: event.customerId,
                    service: event.service,
                    dateTime: event.dateTime.toISOString(),
                },
            });

            this.logger.log(`[Event] Booking notification created for ${event.bookingId}`);
        } catch (error) {
            this.logger.error(`[Event] Failed to create booking notification for ${event.bookingId}`, error);
        }
    }

    @OnEvent('booking.rescheduled')
    async handleBookingRescheduled(event: BookingRescheduledEvent) {
        this.logger.log(`[Event] BookingRescheduled: bookingId=${event.bookingId}`);

        try {
            const oldDateTime = DateTime.fromJSDate(event.oldDateTime).setZone('Africa/Nairobi');
            const newDateTime = DateTime.fromJSDate(event.newDateTime).setZone('Africa/Nairobi');

            await this.notificationsService.createNotification({
                type: 'reschedule',
                title: `Booking Rescheduled - ${event.service}`,
                message: `${event.customerName || 'Customer'} rescheduled from ${oldDateTime.toFormat('LLL dd, yyyy h:mm a')} to ${newDateTime.toFormat('LLL dd, yyyy h:mm a')}`,
                metadata: {
                    bookingId: event.bookingId,
                    customerId: event.customerId,
                    customerName: event.customerName,
                    service: event.service,
                    oldDateTime: event.oldDateTime.toISOString(),
                    newDateTime: event.newDateTime.toISOString(),
                },
            });

            this.logger.log(`[Event] Reschedule notification created for ${event.bookingId}`);
        } catch (error) {
            this.logger.error(`[Event] Failed to create reschedule notification for ${event.bookingId}`, error);
        }
    }

    @OnEvent('booking.cancelled')
    async handleBookingCancelled(event: BookingCancelledEvent) {
        this.logger.log(`[Event] BookingCancelled: bookingId=${event.bookingId}`);

        try {
            const formattedDateTime = DateTime.fromJSDate(event.dateTime)
                .setZone('Africa/Nairobi')
                .toFormat('LLL dd, yyyy h:mm a');

            await this.notificationsService.createNotification({
                type: 'booking',
                title: `Booking Cancelled - ${event.service}`,
                message: `Booking for ${event.service} on ${formattedDateTime} was cancelled`,
                metadata: {
                    bookingId: event.bookingId,
                    customerId: event.customerId,
                    service: event.service,
                    dateTime: event.dateTime.toISOString(),
                },
            });

            this.logger.log(`[Event] Cancellation notification created for ${event.bookingId}`);
        } catch (error) {
            this.logger.error(`[Event] Failed to create cancellation notification for ${event.bookingId}`, error);
        }
    }
}
