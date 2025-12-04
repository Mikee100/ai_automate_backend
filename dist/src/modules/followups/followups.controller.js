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
exports.FollowupsController = void 0;
const common_1 = require("@nestjs/common");
const followups_service_1 = require("./followups.service");
const followup_dto_1 = require("./dto/followup.dto");
let FollowupsController = class FollowupsController {
    constructor(followupsService) {
        this.followupsService = followupsService;
    }
    async getFollowups(filters) {
        return this.followupsService.getFollowups(filters);
    }
    async getAnalytics() {
        return this.followupsService.getFollowupAnalytics();
    }
    async getBookingFollowups(bookingId) {
        return this.followupsService.getFollowups({ bookingId });
    }
    async getUpcomingFollowups(limit) {
        const limitNum = limit ? parseInt(limit) : 10;
        return this.followupsService.getUpcomingFollowups(limitNum);
    }
    async getFollowup(id) {
        return this.followupsService.getFollowupById(id);
    }
    async sendFollowup(id) {
        return this.followupsService.sendFollowup(id);
    }
    async recordResponse(id, response) {
        return this.followupsService.recordResponse(id, response);
    }
    async updateFollowup(id, data) {
        return this.followupsService.updateFollowup(id, data);
    }
    async cancelFollowup(id) {
        return this.followupsService.updateFollowup(id, { status: 'cancelled' });
    }
};
exports.FollowupsController = FollowupsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [followup_dto_1.FollowupFilterDto]),
    __metadata("design:returntype", Promise)
], FollowupsController.prototype, "getFollowups", null);
__decorate([
    (0, common_1.Get)('analytics'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FollowupsController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Get)('booking/:bookingId'),
    __param(0, (0, common_1.Param)('bookingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FollowupsController.prototype, "getBookingFollowups", null);
__decorate([
    (0, common_1.Get)('upcoming'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FollowupsController.prototype, "getUpcomingFollowups", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FollowupsController.prototype, "getFollowup", null);
__decorate([
    (0, common_1.Post)(':id/send'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FollowupsController.prototype, "sendFollowup", null);
__decorate([
    (0, common_1.Patch)(':id/response'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, followup_dto_1.RecordFollowupResponseDto]),
    __metadata("design:returntype", Promise)
], FollowupsController.prototype, "recordResponse", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, followup_dto_1.UpdateFollowupDto]),
    __metadata("design:returntype", Promise)
], FollowupsController.prototype, "updateFollowup", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FollowupsController.prototype, "cancelFollowup", null);
exports.FollowupsController = FollowupsController = __decorate([
    (0, common_1.Controller)('followups'),
    __metadata("design:paramtypes", [followups_service_1.FollowupsService])
], FollowupsController);
//# sourceMappingURL=followups.controller.js.map