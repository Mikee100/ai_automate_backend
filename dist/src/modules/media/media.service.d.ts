import { PrismaService } from '../../prisma/prisma.service';
export declare class MediaService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getCategories(): Promise<string[]>;
    getByCategory(category: string, limit?: number): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string | null;
        url: string;
        description: string | null;
        category: string;
        subcategory: string | null;
        mediaType: string;
        source: string;
    }[]>;
    getBackdrops(limit?: number): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string | null;
        url: string;
        description: string | null;
        category: string;
        subcategory: string | null;
        mediaType: string;
        source: string;
    }[]>;
}
