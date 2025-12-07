import { OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { ConfigService } from '@nestjs/config';
import { ContentScraperService } from '../content-scraper/content-scraper.service';
export declare class SeedingService implements OnApplicationBootstrap {
    private readonly prisma;
    private readonly aiService;
    private readonly configService;
    private readonly scraperService;
    private readonly logger;
    constructor(prisma: PrismaService, aiService: AiService, configService: ConfigService, scraperService: ContentScraperService);
    onApplicationBootstrap(): Promise<void>;
    seedPackages(): Promise<void>;
    seedKnowledgeBase(): Promise<void>;
    seedScrapedContent(): Promise<void>;
}
