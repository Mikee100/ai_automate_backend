import { MediaService } from './media.service';
export declare class MediaController {
    private readonly mediaService;
    constructor(mediaService: MediaService);
    getCategories(): Promise<string[]>;
    getByCategory(category: string, limit?: string): Promise<{
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
    getBackdrops(limit?: string): Promise<{
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
    getPortfolio(limit?: string): Promise<{
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
