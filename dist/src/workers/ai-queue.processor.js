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
const ai_service_1 = require("../modules/ai/ai.service");
const messenger_send_service_1 = require("../modules/webhooks/messenger-send.service");
const messages_service_1 = require("../modules/messages/messages.service");
let AiQueueProcessor = AiQueueProcessor_1 = class AiQueueProcessor {
    constructor(aiService, messengerSendService, messagesService) {
        this.aiService = aiService;
        this.messengerSendService = messengerSendService;
        this.messagesService = messagesService;
        this.logger = new common_1.Logger(AiQueueProcessor_1.name);
    }
    async handleMessengerAiJob(job) {
        const { customerId, message, platform } = job.data;
        this.logger.log(`Processing AI job for Messenger: customerId=${customerId}, message=${message}`);
        if (platform !== 'messenger') {
            this.logger.warn('Job platform is not messenger, skipping.');
            return;
        }
        const history = await this.messagesService.getConversationHistory(customerId, 10);
        const aiResult = await this.aiService.handleConversation(message, customerId, history);
        const aiResponse = aiResult?.response || "Sorry, I couldn't process your request.";
        const customer = await this.messagesService.getCustomerById(customerId);
        if (!customer?.messengerId) {
            this.logger.error('Customer does not have a Messenger ID, cannot send response.');
            return;
        }
        await this.messengerSendService.sendMessage(customer.messengerId, aiResponse);
        this.logger.log('AI response sent to Messenger.');
    }
};
exports.AiQueueProcessor = AiQueueProcessor;
__decorate([
    (0, bull_1.Process)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiQueueProcessor.prototype, "handleMessengerAiJob", null);
exports.AiQueueProcessor = AiQueueProcessor = AiQueueProcessor_1 = __decorate([
    (0, bull_1.Processor)('aiQueue'),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ai_service_1.AiService,
        messenger_send_service_1.MessengerSendService,
        messages_service_1.MessagesService])
], AiQueueProcessor);
//# sourceMappingURL=ai-queue.processor.js.map