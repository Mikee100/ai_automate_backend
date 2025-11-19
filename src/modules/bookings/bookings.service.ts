import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import * as chrono from 'chrono-node';

@Injectable()
export class BookingsService {
  private readonly services = [
    { name: 'Hair Cut', duration: 60 }, // minutes
    { name: 'Massage Therapy', duration: 90 },
    { name: 'Spa Treatment', duration: 120 },
    { name: 'Nail Service', duration: 45 },
  ];

  constructor(
    private prisma: PrismaService,
    @InjectQueue('bookingQueue') private bookingQueue: Queue,
  ) {}

  // Booking Draft methods
  async getBookingDraft(customerId: string) {
    console.log('LOG: Getting booking draft for customer:', customerId);
    return this.prisma.bookingDraft.findUnique({
      where: { customerId },
    });
  }

  async createBookingDraft(customerId: string) {
    console.log('LOG: Creating new booking draft for customer:', customerId);
    return this.prisma.bookingDraft.create({
      data: {
        customerId,
        step: 'service',
      },
    });
  }

  async updateBookingDraft(customerId: string, updates: Partial<{
    service: string;
    date: Date;
    time: string;
    name: string;
    step: string;
  }>) {
    console.log('LOG: Updating booking draft for customer:', customerId, 'with updates:', updates);
    return this.prisma.bookingDraft.update({
      where: { customerId },
      data: updates,
    });
  }

  async deleteBookingDraft(customerId: string) {
    console.log('LOG: Deleting booking draft for customer:', customerId);
    return this.prisma.bookingDraft.delete({
      where: { customerId },
    });
  }

  async completeBookingDraft(customerId: string) {
    console.log('LOG: Completing booking draft for customer:', customerId);
    const draft = await this.getBookingDraft(customerId);
    if (!draft || !draft.service || !draft.date || !draft.time || !draft.name) {
      throw new Error('Incomplete booking draft');
    }

    // Parse time and combine with date
    const [time, period] = draft.time.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    const hour24 = period === 'PM' && hours !== 12 ? hours + 12 : period === 'AM' && hours === 12 ? 0 : hours;
    const dateTime = new Date(draft.date);
    dateTime.setHours(hour24, minutes || 0, 0, 0);

    // Create confirmed booking
    const booking = await this.createBooking(customerId, `Completed draft booking: ${draft.service}`, draft.service, dateTime);
    await this.confirmBooking(booking.id);

    // Delete draft
    await this.deleteBookingDraft(customerId);

    console.log('LOG: Booking draft completed and confirmed:', booking.id);
    return booking;
  }

  getServices() {
    return this.services;
  }

  async createBooking(customerId: string, message?: string, service?: string, dateTime?: Date) {
    let parsedDateTime: Date;

    if (dateTime) {
      parsedDateTime = dateTime;
    } else if (message) {
      // Extract date/time from message using chrono
      const parsed = chrono.parse(message);
      if (!parsed.length) {
        throw new Error('No date/time found in message');
      }
      parsedDateTime = parsed[0].start.date();
    } else {
      throw new Error('Either message or dateTime must be provided');
    }

    const selectedService = service || 'General Appointment';
    const serviceInfo = this.services.find(s => s.name === selectedService);
    const duration = serviceInfo ? serviceInfo.duration : 60; // default 60 min

    // Ensure customer exists, create if not
    let customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          id: customerId,
          name: 'Unknown', // Placeholder, can be updated later
          email: `${customerId}@example.com`, // Placeholder
        },
      });
    }

    // Check for conflicts based on service duration
    const existing = await this.prisma.booking.findMany({
      where: {
        dateTime: {
          gte: new Date(parsedDateTime.getTime() - duration * 60 * 1000), // duration before
          lte: new Date(parsedDateTime.getTime() + duration * 60 * 1000), // duration after
        },
        status: 'confirmed',
      },
    });

    if (existing.length > 0) {
      throw new Error('Time slot conflict');
    }

    // Create provisional booking
    const booking = await this.prisma.booking.create({
      data: {
        customerId,
        service: selectedService,
        dateTime: parsedDateTime,
        status: 'provisional',
      },
    });

    // Add to queue for confirmation
    await this.bookingQueue.add('confirmBooking', { bookingId: booking.id });

    return booking;
  }

  async updateBooking(bookingId: string, updates: { service?: string; dateTime?: Date }) {
    // Check current booking
    const currentBooking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!currentBooking) {
      throw new Error('Booking not found');
    }

    // Validate new dateTime if provided
    if (updates.dateTime) {
      const serviceInfo = this.services.find(s => s.name === currentBooking.service || updates.service);
      const duration = serviceInfo ? serviceInfo.duration : 60;
      const existing = await this.prisma.booking.findMany({
        where: {
          id: { not: bookingId }, // Exclude current booking
          dateTime: {
            gte: new Date(updates.dateTime.getTime() - duration * 60 * 1000),
            lte: new Date(updates.dateTime.getTime() + duration * 60 * 1000),
          },
          status: 'confirmed',
        },
      });

      if (existing.length > 0) {
        throw new Error('Time slot conflict');
      }
    }

    // Update booking
    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: updates,
    });

    // If status was provisional, re-queue for confirmation
    if (currentBooking.status === 'provisional') {
      await this.bookingQueue.add('confirmBooking', { bookingId: bookingId });
    }

    return updatedBooking;
  }

  async confirmBooking(bookingId: string) {
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'confirmed' },
    });
  }

  async cancelBooking(bookingId: string) {
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'cancelled' },
    });
  }

  async getBookings(customerId?: string) {
    const bookings = await this.prisma.booking.findMany({
      where: customerId ? { customerId } : {},
      include: { customer: true },
    });
    return {
      bookings,
      total: bookings.length,
    };
  }

  async createBookingFromMessage(message: any) {
    const parsed = chrono.parse(message.content);
    if (parsed.length > 0) {
      const dateTime = parsed[0].start.date();
      await this.createBooking(message.customerId, message.content);
    }
  }

  async checkAvailability(dateTime: Date, service?: string): Promise<{ available: boolean; suggestions?: Date[] }> {
    const serviceInfo = service ? this.services.find(s => s.name === service) : null;
    const duration = serviceInfo ? serviceInfo.duration : 60; // default 60 min

    const start = new Date(dateTime.getTime() - duration * 60 * 1000); // duration before
    const end = new Date(dateTime.getTime() + duration * 60 * 1000); // duration after

    const conflicts = await this.prisma.booking.findMany({
      where: {
        dateTime: {
          gte: start,
          lte: end,
        },
        status: 'confirmed',
      },
    });

    if (conflicts.length === 0) {
      return { available: true };
    }

    // Suggest next available slots for the same day
    const suggestions: Date[] = [];
    const dayStart = new Date(dateTime);
    dayStart.setHours(9, 0, 0, 0); // 9 AM
    const dayEnd = new Date(dateTime);
    dayEnd.setHours(17, 0, 0, 0); // 5 PM

    let current = new Date(dayStart);
    while (current < dayEnd) {
      const checkStart = new Date(current.getTime() - duration * 60 * 1000);
      const checkEnd = new Date(current.getTime() + duration * 60 * 1000);
      const checkConflicts = await this.prisma.booking.findMany({
        where: {
          dateTime: {
            gte: checkStart,
            lte: checkEnd,
          },
          status: 'confirmed',
        },
      });
      if (checkConflicts.length === 0) {
        suggestions.push(new Date(current));
        if (suggestions.length >= 5) break; // Limit to 5 suggestions
      }
      current = new Date(current.getTime() + 60 * 60 * 1000); // Next hour
    }

    return { available: false, suggestions };
  }

  async getAvailableSlotsForDate(date: string): Promise<Date[]> {
    const dateObj = new Date(date);
    const availableSlots: Date[] = [];

    // Check slots from 9 AM to 5 PM
    for (let hour = 9; hour < 17; hour++) {
      const slotTime = new Date(dateObj);
      slotTime.setHours(hour, 0, 0, 0);

      const availability = await this.checkAvailability(slotTime);
      if (availability.available) {
        availableSlots.push(slotTime);
      }
    }

    return availableSlots;
  }
}
