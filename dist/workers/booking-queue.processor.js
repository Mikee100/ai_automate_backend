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
exports.BookingQueueProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const bookings_service_1 = require("../src/modules/bookings/bookings.service");
let BookingQueueProcessor = class BookingQueueProcessor {
    constructor(bookingsService) {
        this.bookingsService = bookingsService;
    }
    async process(job) {
        const { bookingId } = job.data;
        await this.bookingsService.confirmBooking(bookingId);
        return { confirmed: true };
    }
};
exports.BookingQueueProcessor = BookingQueueProcessor;
exports.BookingQueueProcessor = BookingQueueProcessor = __decorate([
    (0, common_1.Injectable)(),
    (0, bull_1.Processor)('bookingQueue'),
    __metadata("design:paramtypes", [bookings_service_1.BookingsService])
], BookingQueueProcessor);
//# sourceMappingURL=booking-queue.processor.js.map