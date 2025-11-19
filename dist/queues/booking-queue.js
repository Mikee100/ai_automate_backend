"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingQueue = void 0;
const bull_1 = require("@nestjs/bull");
exports.BookingQueue = bull_1.BullModule.registerQueue({
    name: 'bookingQueue',
});
//# sourceMappingURL=booking-queue.js.map