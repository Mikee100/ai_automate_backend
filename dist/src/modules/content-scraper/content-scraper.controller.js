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
exports.ContentScraperController = void 0;
const common_1 = require("@nestjs/common");
const content_scraper_service_1 = require("./content-scraper.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const prisma_service_1 = require("../../prisma/prisma.service");
let ContentScraperController = class ContentScraperController {
    constructor(scraperService, prisma) {
        this.scraperService = scraperService;
        this.prisma = prisma;
    }
    async refreshContent() {
        const result = await this.scraperService.scrapeAllContent();
        return {
            success: result.errors.length === 0,
            ...result,
        };
    }
    async getStatus() {
        const stats = await this.scraperService.getStats();
        const knowledgeCount = await this.prisma.knowledgeBase.count();
        const knowledgeByCategory = await this.prisma.knowledgeBase.groupBy({
            by: ['category'],
            _count: true,
        });
        return {
            ...stats,
            totalKnowledge: knowledgeCount,
            knowledgeByCategory,
        };
    }
    async getBackdrops() {
        const backdrops = await this.scraperService.getBackdropImages(20);
        return {
            count: backdrops.length,
            backdrops,
        };
    }
    async getAssetsByCategory(category) {
        const assets = await this.scraperService.getMediaByCategory(category, 20);
        return {
            category,
            count: assets.length,
            assets,
        };
    }
};
exports.ContentScraperController = ContentScraperController;
__decorate([
    (0, common_1.Post)('refresh'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ContentScraperController.prototype, "refreshContent", null);
__decorate([
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ContentScraperController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)('backdrops'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ContentScraperController.prototype, "getBackdrops", null);
__decorate([
    (0, common_1.Get)('assets/:category'),
    __param(0, (0, common_1.Param)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ContentScraperController.prototype, "getAssetsByCategory", null);
exports.ContentScraperController = ContentScraperController = __decorate([
    (0, common_1.Controller)('content-scraper'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [content_scraper_service_1.ContentScraperService,
        prisma_service_1.PrismaService])
], ContentScraperController);
//# sourceMappingURL=content-scraper.controller.js.map