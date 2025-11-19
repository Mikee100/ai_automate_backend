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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const prisma_service_1 = require("../../prisma/prisma.service");
const chrono = require("chrono-node");
let BookingsService = class BookingsService {
    constructor(prisma, bookingQueue) {
        this.prisma = prisma;
        this.bookingQueue = bookingQueue;
        this.services = [
            { name: 'Hair Cut', duration: 60 },
            { name: 'Massage Therapy', duration: 90 },
            { name: 'Spa Treatment', duration: 120 },
            { name: 'Nail Service', duration: 45 },
        ];
    }
    async getBookingDraft(customerId) {
        console.log('LOG: Getting booking draft for customer:', customerId);
        return this.prisma.bookingDraft.findUnique({
            where: { customerId },
        });
    }
    async createBookingDraft(customerId) {
        console.log('LOG: Creating new booking draft for customer:', customerId);
        return this.prisma.bookingDraft.create({
            data: {
                customerId,
                step: 'service',
            },
        });
    }
    async updateBookingDraft(customerId, updates) {
        console.log('LOG: Updating booking draft for customer:', customerId, 'with updates:', updates);
        return this.prisma.bookingDraft.update({
            where: { customerId },
            data: updates,
        });
    }
    async deleteBookingDraft(customerId) {
        console.log('LOG: Deleting booking draft for customer:', customerId);
        return this.prisma.bookingDraft.delete({
            where: { customerId },
        });
    }
    async completeBookingDraft(customerId) {
        console.log('LOG: Completing booking draft for customer:', customerId);
        const draft = await this.getBookingDraft(customerId);
        if (!draft || !draft.service || !draft.date || !draft.time || !draft.name) {
            throw new Error('Incomplete booking draft');
        }
        const [time, period] = draft.time.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        const hour24 = period === 'PM' && hours !== 12 ? hours + 12 : period === 'AM' && hours === 12 ? 0 : hours;
        const dateTime = new Date(draft.date);
        dateTime.setHours(hour24, minutes || 0, 0, 0);
        const booking = await this.createBooking(customerId, `Completed draft booking: ${draft.service}`, draft.service, dateTime);
        await this.confirmBooking(booking.id);
        await this.deleteBookingDraft(customerId);
        console.log('LOG: Booking draft completed and confirmed:', booking.id);
        return booking;
    }
    getServices() {
        return this.services;
    }
    async createBooking(customerId, message, service, dateTime) {
        let parsedDateTime;
        if (dateTime) {
            parsedDateTime = dateTime;
        }
        else if (message) {
            const parsed = chrono.parse(message);
            if (!parsed.length) {
                throw new Error('No date/time found in message');
            }
            parsedDateTime = parsed[0].start.date();
        }
        else {
            throw new Error('Either message or dateTime must be provided');
        }
        const selectedService = service || 'General Appointment';
        const serviceInfo = this.services.find(s => s.name === selectedService);
        const duration = serviceInfo ? serviceInfo.duration : 60;
        let customer = await this.prisma.customer.findUnique({
            where: { id: customerId },
        });
        if (!customer) {
            customer = await this.prisma.customer.create({
                data: {
                    id: customerId,
                    name: 'Unknown',
                    email: `${customerId}@example.com`,
                },
            });
        }
        const existing = await this.prisma.booking.findMany({
            where: {
                dateTime: {
                    gte: new Date(parsedDateTime.getTime() - duration * 60 * 1000),
                    lte: new Date(parsedDateTime.getTime() + duration * 60 * 1000),
                },
                status: 'confirmed',
            },
        });
        if (existing.length > 0) {
            throw new Error('Time slot conflict');
        }
        const booking = await this.prisma.booking.create({
            data: {
                customerId,
                service: selectedService,
                dateTime: parsedDateTime,
                status: 'provisional',
            },
        });
        await this.bookingQueue.add('confirmBooking', { bookingId: booking.id });
        return booking;
    }
    async updateBooking(bookingId, updates) {
        const currentBooking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
        });
        if (!currentBooking) {
            throw new Error('Booking not found');
        }
        if (updates.dateTime) {
            const serviceInfo = this.services.find(s => s.name === currentBooking.service || updates.service);
            const duration = serviceInfo ? serviceInfo.duration : 60;
            const existing = await this.prisma.booking.findMany({
                where: {
                    id: { not: bookingId },
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
        const updatedBooking = await this.prisma.booking.update({
            where: { id: bookingId },
            data: updates,
        });
        if (currentBooking.status === 'provisional') {
            await this.bookingQueue.add('confirmBooking', { bookingId: bookingId });
        }
        return updatedBooking;
    }
    async confirmBooking(bookingId) {
        return this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'confirmed' },
        });
    }
    async cancelBooking(bookingId) {
        return this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'cancelled' },
        });
    }
    async getBookings(customerId) {
        const bookings = await this.prisma.booking.findMany({
            where: customerId ? { customerId } : {},
            include: { customer: true },
        });
        return {
            bookings,
            total: bookings.length,
        };
    }
    async createBookingFromMessage(message) {
        const parsed = chrono.parse(message.content);
        if (parsed.length > 0) {
            const dateTime = parsed[0].start.date();
            await this.createBooking(message.customerId, message.content);
        }
    }
    async checkAvailability(dateTime, service) {
        const serviceInfo = service ? this.services.find(s => s.name === service) : null;
        const duration = serviceInfo ? serviceInfo.duration : 60;
        const start = new Date(dateTime.getTime() - duration * 60 * 1000);
        const end = new Date(dateTime.getTime() + duration * 60 * 1000);
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
        const suggestions = [];
        const dayStart = new Date(dateTime);
        dayStart.setHours(9, 0, 0, 0);
        const dayEnd = new Date(dateTime);
        dayEnd.setHours(17, 0, 0, 0);
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
                if (suggestions.length >= 5)
                    break;
            }
            current = new Date(current.getTime() + 60 * 60 * 1000);
        }
        return { available: false, suggestions };
    }
    async getAvailableSlotsForDate(date) {
        const dateObj = new Date(date);
        const availableSlots = [];
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
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bull_1.InjectQueue)('bookingQueue')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map