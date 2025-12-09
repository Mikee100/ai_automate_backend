import { PrismaService } from '../../prisma/prisma.service';
export declare class ContentScraperService {
    private prisma;
    private readonly logger;
    private readonly baseUrl;
    constructor(prisma: PrismaService);
    scrapeAllContent(): Promise<{
        imagesScraped: number;
        faqsAdded: number;
        errors: string[];
    }>;
    private scrapePortfolioPage;
    private saveMediaAssets;
    private addBackdropFAQs;
    getStats(): Promise<{
        totalMedia: number;
        mediaByCategory: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.MediaAssetGroupByOutputType, "category"[]> & {
            _count: number;
        })[];
        faqsWithMedia: number;
    }>;
    getMediaByCategory(category: string, limit?: number): Promise<{
        id: string;
        category: string;
        createdAt: Date;
        updatedAt: Date;
        url: string;
        title: string | null;
        description: string | null;
        subcategory: string | null;
        mediaType: string;
        source: string;
    }[]>;
    getBackdropImages(limit?: number): Promise<{
        id: string;
        category: string;
        createdAt: Date;
        updatedAt: Date;
        url: string;
        title: string | null;
        description: string | null;
        subcategory: string | null;
        mediaType: string;
        source: string;
    }[]>;
    private scrapePageContent;
    private saveKnowledgeContent;
    private generateKnowledgeEntries;
    private mapCategoryToKnowledgeCategory;
}
