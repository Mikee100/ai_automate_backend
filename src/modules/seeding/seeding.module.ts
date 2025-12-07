import { Module } from '@nestjs/common';
import { SeedingService } from './seeding.service';
import { AiModule } from '../ai/ai.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { ContentScraperModule } from '../content-scraper/content-scraper.module';

@Module({
    imports: [
        PrismaModule,
        AiModule,
        ConfigModule,
        ContentScraperModule,
    ],
    providers: [SeedingService],
    exports: [SeedingService],
})
export class SeedingModule { }
