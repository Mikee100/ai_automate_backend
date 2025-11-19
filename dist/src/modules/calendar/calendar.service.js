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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let CalendarService = class CalendarService {
    constructor(prisma) {
        this.prisma = prisma;
        this.services = [
            { name: 'Hair Cut', duration: 60 },
            { name: 'Massage Therapy', duration: 90 },
            { name: 'Spa Treatment', duration: 120 },
            { name: 'Nail Service', duration: 45 },
        ];
    }
    async getAvailableSlots(date, service) {
        const selectedService = service || 'Hair Cut';
        const serviceInfo = this.services.find(s => s.name === selectedService);
        const duration = serviceInfo ? serviceInfo.duration : 60;
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return [];
        }
        const start = new Date(date);
        start.setHours(9, 0, 0, 0);
        const end = new Date(date);
        end.setHours(17, 0, 0, 0);
        const slots = [];
        for (let time = start; time < end; time.setMinutes(time.getMinutes() + duration)) {
            slots.push(new Date(time));
        }
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
                return ((slot >= booking.dateTime && slot < bookingEnd) ||
                    (slotEnd > booking.dateTime && slotEnd <= bookingEnd) ||
                    (slot <= booking.dateTime && slotEnd >= bookingEnd));
            });
        });
        return availableSlots;
    }
    async syncCalendar() {
        console.log('Syncing calendar...');
    }
};
exports.CalendarService = CalendarService;
exports.CalendarService = CalendarService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CalendarService);
//# sourceMappingURL=calendar.service.js.map