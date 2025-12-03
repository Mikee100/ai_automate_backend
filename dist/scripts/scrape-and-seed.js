"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const content_scraper_service_1 = require("../src/modules/content-scraper/content-scraper.service");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const logger = new common_1.Logger('ScrapeAndSeed');
    try {
        const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
        const scraperService = app.get(content_scraper_service_1.ContentScraperService);
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
    }
    catch (error) {
        logger.error('Failed to run scrape and seed script', error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=scrape-and-seed.js.map