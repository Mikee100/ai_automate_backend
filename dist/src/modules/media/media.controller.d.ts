import { MediaService } from './media.service';
export declare class MediaController {
    private readonly mediaService;
    constructor(mediaService: MediaService);
    getCategories(): Promise<string[]>;
    getByCategory(category: string, limit?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        title: string | null;
        url: string;
        description: string | null;
        subcategory: string | null;
        mediaType: string;
        source: string;
    }[]>;
    getBackdrops(limit?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        title: string | null;
        url: string;
        description: string | null;
        subcategory: string | null;
        mediaType: string;
        source: string;
    }[]>;
    getPortfolio(limit?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        title: string | null;
        url: string;
        description: string | null;
        subcategory: string | null;
        mediaType: string;
        source: string;
    }[]>;
}
