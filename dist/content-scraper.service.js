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
var ContentScraperService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentScraperService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const cheerio = require("cheerio");
const prisma_service_1 = require("../src/prisma/prisma.service");
let ContentScraperService = ContentScraperService_1 = class ContentScraperService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ContentScraperService_1.name);
    }
    async scrapeFiestaHouse() {
        const url = 'https://fiestahouseattire.com/exclusive-maternity-photography-in-kenya-with-fiesta-house-attire/';
        const { data } = await axios_1.default.get(url);
        const $ = cheerio.load(data);
        const images = [];
        $('img').each((_, el) => {
            const src = $(el).attr('src');
            const alt = $(el).attr('alt') || '';
            if (src && src.includes('/wp-content/uploads/')) {
                images.push({
                    url: src,
                    title: alt,
                    description: alt,
                    category: this.categorizeImage(alt, src),
                    subcategory: undefined,
                    mediaType: 'image',
                    source: 'website',
                });
            }
        });
        let count = 0;
        for (const img of images) {
            const exists = await this.prisma.mediaAsset.findFirst({ where: { url: img.url } });
            if (!exists) {
                await this.prisma.mediaAsset.create({ data: img });
                count++;
            }
        }
        return { count };
    }
    categorizeImage(alt, url) {
        const lower = (alt + url).toLowerCase();
        if (lower.includes('beach'))
            return 'beach';
        if (lower.includes('family'))
            return 'family';
        if (lower.includes('studio'))
            return 'studio';
        if (lower.includes('outdoor'))
            return 'outdoor';
        if (lower.includes('backdrop') || lower.includes('background'))
            return 'backdrop';
        if (lower.includes('maternity'))
            return 'maternity';
        return 'portfolio';
    }
    async getStatus() {
        const count = await this.prisma.mediaAsset.count();
        return { count };
    }
    async getAssets(category) {
        if (category) {
            return this.prisma.mediaAsset.findMany({ where: { category } });
        }
        return this.prisma.mediaAsset.findMany();
    }
};
exports.ContentScraperService = ContentScraperService;
exports.ContentScraperService = ContentScraperService = ContentScraperService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], ContentScraperService);
//# sourceMappingURL=content-scraper.service.js.map