import { ContentScraperService } from './content-scraper.service';
import { PrismaService } from '../../prisma/prisma.service';
export declare class ContentScraperController {
    private readonly scraperService;
    private readonly prisma;
    constructor(scraperService: ContentScraperService, prisma: PrismaService);
    refreshContent(): Promise<{
        imagesScraped: number;
        faqsAdded: number;
        errors: string[];
        success: boolean;
    }>;
    getStatus(): Promise<{
        totalKnowledge: number;
        knowledgeByCategory: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.KnowledgeBaseGroupByOutputType, "category"[]> & {
            _count: number;
        })[];
        totalMedia: number;
        mediaByCategory: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.MediaAssetGroupByOutputType, "category"[]> & {
            _count: number;
        })[];
        faqsWithMedia: number;
    }>;
    getBackdrops(): Promise<{
        count: number;
        backdrops: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string | null;
            description: string | null;
            category: string;
            subcategory: string | null;
            url: string;
            mediaType: string;
            source: string;
        }[];
    }>;
    getAssetsByCategory(category: string): Promise<{
        category: string;
        count: number;
        assets: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string | null;
            description: string | null;
            category: string;
            subcategory: string | null;
            url: string;
            mediaType: string;
            source: string;
        }[];
    }>;
}
