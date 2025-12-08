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
var AiQueueProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiQueueProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const ai_service_1 = require("../src/modules/ai/ai.service");
let AiQueueProcessor = AiQueueProcessor_1 = class AiQueueProcessor {
    constructor(aiService) {
        this.aiService = aiService;
        this.logger = new common_1.Logger(AiQueueProcessor_1.name);
    }
    async process(job) {
        this.logger.log(`Processing job id=${job.id} with data: ${JSON.stringify(job.data)}`);
        try {
            const { question } = job.data;
            if (!question) {
                this.logger.warn(`Job id=${job.id} missing 'question' field. Data: ${JSON.stringify(job.data)}`);
                throw new Error("Job data missing 'question' field");
            }
            const answer = await this.aiService.processAiRequest(job.data);
            this.logger.log(`Job id=${job.id} processed successfully. Answer: ${JSON.stringify(answer)}`);
            return { answer };
        }
        catch (error) {
            this.logger.error(`Error processing job id=${job.id}: ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.AiQueueProcessor = AiQueueProcessor;
exports.AiQueueProcessor = AiQueueProcessor = AiQueueProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, bull_1.Processor)('aiQueue'),
    __metadata("design:paramtypes", [ai_service_1.AiService])
], AiQueueProcessor);
//# sourceMappingURL=ai-queue.processor.js.map