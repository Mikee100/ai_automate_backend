"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiQueue = void 0;
const bull_1 = require("@nestjs/bull");
exports.AiQueue = bull_1.BullModule.registerQueue({
    name: 'aiQueue',
});
//# sourceMappingURL=ai-queue.js.map