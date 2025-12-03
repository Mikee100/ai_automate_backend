"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentScraperModule = void 0;
const common_1 = require("@nestjs/common");
const content_scraper_service_1 = require("./content-scraper.service");
const content_scraper_controller_1 = require("./content-scraper.controller");
const prisma_service_1 = require("../src/prisma/prisma.service");
let ContentScraperModule = class ContentScraperModule {
};
exports.ContentScraperModule = ContentScraperModule;
exports.ContentScraperModule = ContentScraperModule = __decorate([
    (0, common_1.Module)({
        providers: [content_scraper_service_1.ContentScraperService, prisma_service_1.PrismaService],
        controllers: [content_scraper_controller_1.ContentScraperController],
    })
], ContentScraperModule);
//# sourceMappingURL=content-scraper.module.js.map