// scripts/scrape-and-seed.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ContentScraperService } from '../src/modules/content-scraper/content-scraper.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
    const logger = new Logger('ScrapeAndSeed');

    try {
        const app = await NestFactory.createApplicationContext(AppModule);
        const scraperService = app.get(ContentScraperService);

        logger.log('Starting content scraping and seeding...');

        const result = await scraperService.scrapeAllContent();

        logger.log('Scraping completed!');
        logger.log(`Images scraped: ${result.imagesScraped}`);
        logger.log(`FAQs added: ${result.faqsAdded}`);

        if (result.errors.length > 0) {
            logger.warn('Errors encountered:');
            result.errors.forEach(err => logger.warn(`- ${err}`));
        }

        await app.close();
        process.exit(0);
    } catch (error) {
        logger.error('Failed to run scrape and seed script', error);
        process.exit(1);
    }
}

bootstrap();
