import { PrismaService } from '../src/prisma/prisma.service';
export declare class ContentScraperService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    scrapeFiestaHouse(): Promise<{
        count: number;
    }>;
    categorizeImage(alt: string, url: string): string;
    getStatus(): Promise<{
        count: any;
    }>;
    getAssets(category?: string): Promise<any>;
}
