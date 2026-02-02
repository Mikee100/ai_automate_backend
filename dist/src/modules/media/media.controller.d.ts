import { MediaService } from './media.service';
export declare class MediaController {
    private readonly mediaService;
    constructor(mediaService: MediaService);
    getCategories(): Promise<string[]>;
    getByCategory(category: string, limit?: string): Promise<{
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
    }[]>;
    getBackdrops(limit?: string): Promise<{
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
    }[]>;
    getPortfolio(limit?: string): Promise<{
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
    }[]>;
}
