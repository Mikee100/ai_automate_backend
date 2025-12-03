import { ContentScraperService } from './content-scraper.service';
export declare class ContentScraperController {
    private readonly scraper;
    constructor(scraper: ContentScraperService);
    refresh(): Promise<{
        count: number;
    }>;
    status(): Promise<{
        count: any;
    }>;
    assets(category?: string): Promise<any>;
}
