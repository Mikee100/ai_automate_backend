"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageQueue = void 0;
const bull_1 = require("@nestjs/bull");
exports.MessageQueue = bull_1.BullModule.registerQueue({
    name: 'messageQueue',
});
//# sourceMappingURL=message-queue.js.map