// src/modules/content-scraper/content-scraper.module.ts
import { Module } from '@nestjs/common';
import { ContentScraperService } from './content-scraper.service';
import { ContentScraperController } from './content-scraper.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
    providers: [ContentScraperService, PrismaService],
    controllers: [ContentScraperController],
    exports: [ContentScraperService],
})
export class ContentScraperModule { }
