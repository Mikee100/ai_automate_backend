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
var FollowupsQueueProcessor_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowupsQueueProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const followups_service_1 = require("../modules/followups/followups.service");
let FollowupsQueueProcessor = FollowupsQueueProcessor_1 = class FollowupsQueueProcessor {
    constructor(followupsService) {
        this.followupsService = followupsService;
        this.logger = new common_1.Logger(FollowupsQueueProcessor_1.name);
    }
    async handleSendFollowup(job) {
        const { followupId } = job.data;
        this.logger.log(`Processing follow-up ${followupId}`);
        try {
            await this.followupsService.sendFollowup(followupId);
            this.logger.log(`Successfully sent follow-up ${followupId}`);
        }
        catch (error) {
            this.logger.error(`Failed to send follow-up ${followupId}`, error);
            throw error;
        }
    }
};
exports.FollowupsQueueProcessor = FollowupsQueueProcessor;
__decorate([
    (0, bull_1.Process)('send-followup'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FollowupsQueueProcessor.prototype, "handleSendFollowup", null);
exports.FollowupsQueueProcessor = FollowupsQueueProcessor = FollowupsQueueProcessor_1 = __decorate([
    (0, bull_1.Processor)('followupsQueue'),
    __metadata("design:paramtypes", [typeof (_a = typeof followups_service_1.FollowupsService !== "undefined" && followups_service_1.FollowupsService) === "function" ? _a : Object])
], FollowupsQueueProcessor);
//# sourceMappingURL=followups-queue.processor.js.map