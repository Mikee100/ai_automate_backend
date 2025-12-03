// src/modules/content-scraper/content-scraper.controller.ts
import { Controller, Post, Get, UseGuards, Param } from '@nestjs/common';
import { ContentScraperService } from './content-scraper.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('content-scraper')
@UseGuards(JwtAuthGuard)
export class ContentScraperController {
    constructor(
        private readonly scraperService: ContentScraperService,
        private readonly prisma: PrismaService,
    ) { }

    /**
     * Trigger manual content refresh from website
     */
    @Post('refresh')
    async refreshContent() {
        const result = await this.scraperService.scrapeAllContent();
        return {
            success: result.errors.length === 0,
            ...result,
        };
    }

    /**
     * Get scraping statistics
     */
    @Get('status')
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

    /**
     * Get all backdrop images
     */
    @Get('backdrops')
    async getBackdrops() {
        const backdrops = await this.scraperService.getBackdropImages(20);
        return {
            count: backdrops.length,
            backdrops,
        };
    }

    /**
     * Get media by category
     */
    @Get('assets/:category')
    async getAssetsByCategory(@Param('category') category: string) {
        const assets = await this.scraperService.getMediaByCategory(category, 20);
        return {
            category,
            count: assets.length,
            assets,
        };
    }
}
