import { PrismaService } from '../../prisma/prisma.service';
export declare class MediaService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getCategories(): Promise<string[]>;
    getByCategory(category: string, limit?: number): Promise<{
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
    getBackdrops(limit?: number): Promise<{
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
}
