import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CalendarService {
  private readonly services = [
    { name: 'Hair Cut', duration: 60 }, // minutes
    { name: 'Massage Therapy', duration: 90 },
    { name: 'Spa Treatment', duration: 120 },
    { name: 'Nail Service', duration: 45 },
  ];

  constructor(private prisma: PrismaService) {}

  async getAvailableSlots(date: Date, service?: string) {
    const selectedService = service || 'Hair Cut'; // default
    const serviceInfo = this.services.find(s => s.name === selectedService);
    const duration = serviceInfo ? serviceInfo.duration : 60; // default 60 min

    // Business hours: 9AM to 5PM, Monday to Friday
    const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return []; // No slots on weekends
    }

    const start = new Date(date);
    start.setHours(9, 0, 0, 0);
    const end = new Date(date);
    end.setHours(17, 0, 0, 0);

    const slots = [];
    for (let time = start; time < end; time.setMinutes(time.getMinutes() + duration)) {
      slots.push(new Date(time));
    }

    // Remove booked slots considering service duration
    const bookings = await this.prisma.booking.findMany({
      where: {
        dateTime: {
          gte: start,
          lt: end,
        },
        status: 'confirmed',
      },
    });

    const availableSlots = slots.filter(slot => {
      const slotEnd = new Date(slot.getTime() + duration * 60 * 1000);
      return !bookings.some(booking => {
        const bookingEnd = new Date(booking.dateTime.getTime() + duration * 60 * 1000);
        return (
          (slot >= booking.dateTime && slot < bookingEnd) ||
          (slotEnd > booking.dateTime && slotEnd <= bookingEnd) ||
          (slot <= booking.dateTime && slotEnd >= bookingEnd)
        );
      });
    });

    return availableSlots;
  }

  async syncCalendar() {
    // Stub: sync with external calendar (Google Calendar, etc.)
    console.log('Syncing calendar...');
  }
}
