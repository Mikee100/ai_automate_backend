"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ContentScraperService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentScraperService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const axios_1 = require("axios");
const cheerio = require("cheerio");
let ContentScraperService = ContentScraperService_1 = class ContentScraperService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ContentScraperService_1.name);
        this.baseUrl = 'https://fiestahouseattire.com';
    }
    async scrapeAllContent() {
        const errors = [];
        let imagesScraped = 0;
        let faqsAdded = 0;
        try {
            const portfolioImages = await this.scrapePortfolioPage();
            imagesScraped += await this.saveMediaAssets(portfolioImages);
            faqsAdded += await this.addBackdropFAQs();
            this.logger.log(`Scraping complete: ${imagesScraped} images, ${faqsAdded} FAQs added`);
        }
        catch (error) {
            const errorMsg = `Scraping failed: ${error.message}`;
            this.logger.error(errorMsg);
            errors.push(errorMsg);
        }
        return { imagesScraped, faqsAdded, errors };
    }
    async scrapePortfolioPage() {
        const url = `${this.baseUrl}/exclusive-maternity-photography-in-kenya-with-fiesta-house-attire/`;
        this.logger.log(`Scraping portfolio page: ${url}`);
        const images = [];
        try {
            const response = await axios_1.default.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
                timeout: 10000,
            });
            const $ = cheerio.load(response.data);
            $('img').each((_, element) => {
                const $img = $(element);
                const src = $img.attr('data-src') || $img.attr('data-lazy-src') || $img.attr('src');
                const alt = $img.attr('alt') || '';
                if (src && (src.includes('/wp-content/uploads/') || src.includes('fiestahouseattire.com'))) {
                    if (src.startsWith('data:') || src.includes('emoji') || src.includes('logo') || src.includes('icon')) {
                        return;
                    }
                    let category = 'portfolio';
                    let subcategory = 'maternity';
                    const lowerAlt = alt.toLowerCase();
                    if (lowerAlt.includes('backdrop') || lowerAlt.includes('background') || lowerAlt.includes('studio')) {
                        category = 'backdrop';
                        subcategory = 'studio';
                    }
                    else if (lowerAlt.includes('beach')) {
                        subcategory = 'beach';
                    }
                    else if (lowerAlt.includes('family')) {
                        subcategory = 'family';
                    }
                    else if (lowerAlt.includes('outdoor')) {
                        subcategory = 'outdoor';
                    }
                    images.push({
                        url: src.startsWith('http') ? src : `${this.baseUrl}${src}`,
                        alt: alt || undefined,
                        title: alt || undefined,
                        category,
                    });
                }
            });
            this.logger.log(`Found ${images.length} portfolio images from page`);
        }
        catch (error) {
            this.logger.error(`Failed to scrape portfolio page: ${error.message}`);
        }
        if (images.length < 5) {
            this.logger.log('Adding fallback images...');
            const fallbackImages = [
                { url: 'https://fiestahouseattire.com/wp-content/uploads/2024/01/IMG_9885.jpg', category: 'backdrop', alt: 'Maternity photoshoot studio backdrop' },
                { url: 'https://fiestahouseattire.com/wp-content/uploads/2024/01/IMG_5362.jpg', category: 'portfolio', alt: 'Maternity photoshoot packages' },
                { url: 'https://fiestahouseattire.com/wp-content/uploads/2021/03/DSC_0038-683x1024.jpg', category: 'backdrop', alt: 'Flower backdrop' },
                { url: 'https://fiestahouseattire.com/wp-content/uploads/2021/03/DSC_0089-683x1024.jpg', category: 'backdrop', alt: 'Chandelier setting' },
                { url: 'https://fiestahouseattire.com/wp-content/uploads/2021/03/DSC_0156-683x1024.jpg', category: 'portfolio', alt: 'Outdoor maternity' },
                { url: 'https://fiestahouseattire.com/wp-content/uploads/2021/03/DSC_0245-683x1024.jpg', category: 'portfolio', alt: 'Beach maternity' },
            ];
            images.push(...fallbackImages);
        }
        return images;
    }
    async saveMediaAssets(images) {
        let saved = 0;
        for (const image of images) {
            try {
                const existing = await this.prisma.mediaAsset.findFirst({
                    where: { url: image.url },
                });
                if (!existing) {
                    await this.prisma.mediaAsset.create({
                        data: {
                            url: image.url,
                            title: image.title,
                            description: image.alt,
                            category: image.category || 'portfolio',
                            subcategory: 'maternity',
                            mediaType: 'image',
                            source: 'website',
                        },
                    });
                    saved++;
                    this.logger.debug(`Saved image: ${image.url.substring(0, 60)}...`);
                }
            }
            catch (error) {
                this.logger.warn(`Failed to save image ${image.url}: ${error.message}`);
            }
        }
        return saved;
    }
    async addBackdropFAQs() {
        const backdropFaqs = [
            {
                question: 'What types of backgrounds do you have?',
                answer: `We offer over 15 exquisitely curated sets designed to celebrate pregnancy! Our backdrops include:\n\n🌸 **Luxurious Flower Backdrops** - Romantic and elegant floral arrangements\n✨ **Glamorous Chandeliers** - Sophisticated and stunning\n🌿 **Lush Green Garden Setting** - Natural and fresh outdoor vibe\n🎨 **Boho Themes** - Artistic and bohemian style\n🪜 **Grand Staircases** - Majestic and timeless\n🎈 **Custom Balloon Backdrops** - Festive and personalized (Platinum/VIP/VVIP packages)\n⛵ **Unique Boat Set** - Dreamy and artistic portraits\n🎭 **Timeless Plain Backdrops** - Classic and elegant\n\nEach backdrop is crafted to make you feel radiant and create stunning, timeless images. Let me show you some examples from our portfolio!`,
                category: 'Services',
            },
            {
                question: 'Can I see examples of your backdrops?',
                answer: `Absolutely! I'd love to show you our beautiful backdrops. We have an extensive portfolio featuring:\n\n- Luxurious flower arrangements\n- Glamorous chandelier settings\n- Natural garden backdrops\n- Boho and artistic themes\n- Grand staircases\n- Custom balloon displays\n- Unique boat set for dreamy portraits\n\nLet me share some stunning examples from our recent sessions!`,
                category: 'Services',
            },
            {
                question: 'Do you have a flower backdrop?',
                answer: `Yes! Our luxurious flower backdrops are among our most popular choices. They create a romantic and elegant atmosphere that beautifully celebrates your pregnancy journey.\n\nWe have multiple floral arrangements featuring:\n🌸 Fresh, vibrant blooms\n🌺 Soft, delicate petals\n🌹 Romantic rose walls\n🌼 Mixed seasonal flowers\n\nThese backdrops are perfect for creating timeless, magazine-worthy maternity photos. Let me show you some examples!`,
                category: 'Services',
            },
            {
                question: 'What studio sets are available?',
                answer: `Our studio offers 15+ professionally designed sets! Here's what we have:\n\n🌸 **Floral Themes**: Luxurious flower walls and arrangements\n✨ **Glamour**: Chandelier sets for sophisticated elegance\n🌿 **Nature**: Lush garden-like settings indoors\n🎨 **Artistic**: Boho and creative themed backdrops\n🪜 **Classic**: Grand staircases and timeless plain backdrops\n🎈 **Festive**: Custom balloon backdrops (Platinum+ packages)\n⛵ **Unique**: Dreamy boat set for artistic portraits\n\nEach set is designed to highlight your natural glow and create stunning memories. Would you like to see photos of specific backdrops?`,
                category: 'Services',
            },
            {
                question: 'Show me your backdrops',
                answer: `I'd be delighted to show you our beautiful backdrops! We have over 15 stunning sets including flower walls, chandeliers, garden settings, boho themes, grand staircases, and even a unique boat set.\n\nLet me share some examples from our portfolio that showcase the variety and beauty of our studio backdrops!`,
                category: 'Services',
            },
        ];
        let added = 0;
        for (const faq of backdropFaqs) {
            try {
                const existing = await this.prisma.knowledgeBase.findFirst({
                    where: { question: faq.question },
                });
                if (!existing) {
                    await this.prisma.knowledgeBase.create({
                        data: {
                            question: faq.question,
                            answer: faq.answer,
                            category: faq.category,
                            embedding: [],
                            mediaUrls: [],
                        },
                    });
                    added++;
                    this.logger.log(`Added FAQ: ${faq.question}`);
                }
                else {
                    await this.prisma.knowledgeBase.update({
                        where: { id: existing.id },
                        data: { answer: faq.answer },
                    });
                    this.logger.log(`Updated FAQ: ${faq.question}`);
                }
            }
            catch (error) {
                this.logger.error(`Failed to add FAQ: ${faq.question} - ${error.message}`);
            }
        }
        return added;
    }
    async getStats() {
        const mediaCount = await this.prisma.mediaAsset.count();
        const mediaByCategory = await this.prisma.mediaAsset.groupBy({
            by: ['category'],
            _count: true,
        });
        const faqsWithMedia = await this.prisma.knowledgeBase.count({
            where: {
                mediaUrls: {
                    isEmpty: false,
                },
            },
        });
        return {
            totalMedia: mediaCount,
            mediaByCategory,
            faqsWithMedia,
        };
    }
    async getMediaByCategory(category, limit = 10) {
        return this.prisma.mediaAsset.findMany({
            where: { category },
            take: limit,
            orderBy: { createdAt: 'desc' },
        });
    }
    async getBackdropImages(limit = 20) {
        return this.prisma.mediaAsset.findMany({
            where: {
                OR: [
                    { category: 'backdrop' },
                    { category: 'studio' },
                    { category: 'portfolio' },
                ],
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
        });
    }
    async scrapePageContent(path, category) {
        const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
        this.logger.log(`Scraping content from: ${url}`);
        try {
            const response = await axios_1.default.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
                timeout: 15000,
            });
            const $ = cheerio.load(response.data);
            const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled Page';
            const headings = [];
            $('h1, h2, h3, h4, h5, h6').each((_, el) => {
                const text = $(el).text().trim();
                if (text && text.length > 3)
                    headings.push(text);
            });
            const paragraphs = [];
            $('p, div.entry-content p, div.content p, section p').each((_, el) => {
                const text = $(el).text().trim();
                if (text && text.length > 10 && !text.includes('©') && !text.includes('All rights reserved')) {
                    paragraphs.push(text);
                }
            });
            $('ul li, ol li').each((_, el) => {
                const text = $(el).text().trim();
                if (text && text.length > 5)
                    paragraphs.push(`• ${text}`);
            });
            const content = [...headings, ...paragraphs].join('\n\n');
            if (content.length < 50) {
                this.logger.warn(`Insufficient content scraped from ${url}`);
                return null;
            }
            return {
                url,
                title,
                content,
                category,
                headings,
                paragraphs,
            };
        }
        catch (error) {
            this.logger.error(`Failed to scrape content from ${url}: ${error.message}`);
            return null;
        }
    }
    async saveKnowledgeContent(scrapedContent) {
        let saved = 0;
        try {
            const entries = this.generateKnowledgeEntries(scrapedContent);
            for (const entry of entries) {
                try {
                    const existing = await this.prisma.knowledgeBase.findFirst({
                        where: {
                            question: entry.question,
                        },
                    });
                    if (!existing) {
                        await this.prisma.knowledgeBase.create({
                            data: {
                                question: entry.question,
                                answer: entry.answer,
                                category: entry.category,
                                embedding: [],
                                mediaUrls: [],
                            },
                        });
                        saved++;
                        this.logger.debug(`Saved knowledge: ${entry.question.substring(0, 50)}...`);
                    }
                }
                catch (error) {
                    this.logger.warn(`Failed to save knowledge entry: ${error.message}`);
                }
            }
        }
        catch (error) {
            this.logger.error(`Failed to save knowledge content: ${error.message}`);
        }
        return saved;
    }
    generateKnowledgeEntries(content) {
        const entries = [];
        content.headings.forEach((heading, index) => {
            if (heading.length > 5) {
                const question = `What is ${heading.toLowerCase()}?`;
                const answer = content.paragraphs[index] || content.content.substring(0, 500);
                entries.push({
                    question,
                    answer,
                    category: this.mapCategoryToKnowledgeCategory(content.category),
                });
            }
        });
        if (content.content.length > 100) {
            entries.push({
                question: `Tell me about ${content.title}`,
                answer: content.content.substring(0, 1000),
                category: this.mapCategoryToKnowledgeCategory(content.category),
            });
        }
        if (content.category === 'services') {
            entries.push({
                question: 'What services do you offer?',
                answer: content.content,
                category: 'Services',
            });
        }
        else if (content.category === 'about') {
            entries.push({
                question: 'Tell me about your studio',
                answer: content.content,
                category: 'About',
            });
        }
        return entries;
    }
    mapCategoryToKnowledgeCategory(pageCategory) {
        const mapping = {
            'homepage': 'General',
            'about': 'About',
            'services': 'Services',
            'gallery': 'Portfolio',
            'portfolio': 'Portfolio',
            'contact': 'Contact',
        };
        return mapping[pageCategory] || 'General';
    }
};
exports.ContentScraperService = ContentScraperService;
exports.ContentScraperService = ContentScraperService = ContentScraperService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ContentScraperService);
//# sourceMappingURL=content-scraper.service.js.map