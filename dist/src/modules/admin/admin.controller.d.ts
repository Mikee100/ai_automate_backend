import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
export declare class AdminController {
    private configService;
    constructor(configService: ConfigService);
    getFacebookPages(accessToken: string, res: Response): Promise<Response<any, Record<string, any>>>;
    private getPagesListHTML;
}
