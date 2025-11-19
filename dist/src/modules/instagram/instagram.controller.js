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
exports.InstagramController = void 0;
const common_1 = require("@nestjs/common");
const instagram_service_1 = require("./instagram.service");
let InstagramController = class InstagramController {
    constructor(instagramService) {
        this.instagramService = instagramService;
    }
    getSettings() {
        return this.instagramService.getSettings();
    }
    updateSettings(settings) {
        return this.instagramService.updateSettings(settings);
    }
    testConnection() {
        return this.instagramService.testConnection();
    }
    sendMessage(body) {
        console.log('📤 Controller: sendMessage called with body:', body);
        return this.instagramService.sendMessage(body.to, body.message);
    }
    getMessages(page, limit, direction, customerId) {
        return this.instagramService.getMessages({
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
            direction: direction,
            customerId,
        });
    }
    getConversations() {
        return this.instagramService.getConversations();
    }
};
exports.InstagramController = InstagramController;
__decorate([
    (0, common_1.Get)('settings'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], InstagramController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Post)('settings'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InstagramController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Post)('test-connection'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], InstagramController.prototype, "testConnection", null);
__decorate([
    (0, common_1.Post)('send'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InstagramController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Get)('messages'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('direction')),
    __param(3, (0, common_1.Query)('customerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], InstagramController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Get)('conversations'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], InstagramController.prototype, "getConversations", null);
exports.InstagramController = InstagramController = __decorate([
    (0, common_1.Controller)('instagram'),
    __metadata("design:paramtypes", [instagram_service_1.InstagramService])
], InstagramController);
//# sourceMappingURL=instagram.controller.js.map