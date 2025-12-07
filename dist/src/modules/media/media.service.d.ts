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
        description: string | null;
        url: string;
        title: string | null;
        subcategory: string | null;
        mediaType: string;
        source: string;
    }[]>;
    getBackdrops(limit?: number): Promise<{
        id: string;
        category: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        url: string;
        title: string | null;
        subcategory: string | null;
        mediaType: string;
        source: string;
    }[]>;
}
