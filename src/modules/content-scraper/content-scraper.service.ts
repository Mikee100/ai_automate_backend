// src/modules/content-scraper/content-scraper.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface ScrapedImage {
    url: string;
    alt?: string;
    title?: string;
    category?: string;
}

interface ScrapedContent {
    url: string;
    title: string;
    content: string;
    category: string;
    headings: string[];
    paragraphs: string[];
}

@Injectable()
export class ContentScraperService {
    private readonly logger = new Logger(ContentScraperService.name);
    private readonly baseUrl = 'https://fiestahouseattire.com';

    constructor(private prisma: PrismaService) { }

    /**
     * Main scraping function to extract all content
     */
    async scrapeAllContent(): Promise<{
        imagesScraped: number;
        faqsAdded: number;
        errors: string[];
    }> {
        const errors: string[] = [];
        let imagesScraped = 0;
        let faqsAdded = 0;

        try {
            // Scrape portfolio images
            const portfolioImages = await this.scrapePortfolioPage();
            imagesScraped += await this.saveMediaAssets(portfolioImages);

            // Add backdrop-specific FAQs with media
            faqsAdded += await this.addBackdropFAQs();

            this.logger.log(`Scraping complete: ${imagesScraped} images, ${faqsAdded} FAQs added`);
        } catch (error) {
            const errorMsg = `Scraping failed: ${error.message}`;
            this.logger.error(errorMsg);
            errors.push(errorMsg);
        }

        return { imagesScraped, faqsAdded, errors };
    }

    /**
     * Scrape the portfolio page for images
     */
    private async scrapePortfolioPage(): Promise<ScrapedImage[]> {
        const url = `${this.baseUrl}/exclusive-maternity-photography-in-kenya-with-fiesta-house-attire/`;
        this.logger.log(`Scraping portfolio page: ${url}`);

        const images: ScrapedImage[] = [];

        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
                timeout: 10000,
            });

            const $ = cheerio.load(response.data);

            // Find all images - try multiple selectors
            $('img').each((_, element) => {
                const $img = $(element);
                const src = $img.attr('data-src') || $img.attr('data-lazy-src') || $img.attr('src');
                const alt = $img.attr('alt') || '';

                // Filter for actual portfolio images (skip logos, icons, etc.)
                if (src && (src.includes('/wp-content/uploads/') || src.includes('fiestahouseattire.com'))) {
                    // Skip tiny images or data URIs (unless it's the only source, but usually data URIs are placeholders)
                    if (src.startsWith('data:') || src.includes('emoji') || src.includes('logo') || src.includes('icon')) {
                        return;
                    }

                    // Determine category from alt text or context
                    let category = 'portfolio';
                    let subcategory = 'maternity';

                    const lowerAlt = alt.toLowerCase();
                    if (lowerAlt.includes('backdrop') || lowerAlt.includes('background') || lowerAlt.includes('studio')) {
                        category = 'backdrop';
                        subcategory = 'studio';
                    } else if (lowerAlt.includes('beach')) {
                        subcategory = 'beach';
                    } else if (lowerAlt.includes('family')) {
                        subcategory = 'family';
                    } else if (lowerAlt.includes('outdoor')) {
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
        } catch (error) {
            this.logger.error(`Failed to scrape portfolio page: ${error.message}`);
        }

        // Fallback: Add known images if scraping yielded few results
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

    /**
     * Save media assets to database
     */
    private async saveMediaAssets(images: ScrapedImage[]): Promise<number> {
        let saved = 0;

        for (const image of images) {
            try {
                // Check if already exists
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
            } catch (error) {
                this.logger.warn(`Failed to save image ${image.url}: ${error.message}`);
            }
        }

        return saved;
    }

    /**
     * Add backdrop-specific FAQs with media references
     */
    private async addBackdropFAQs(): Promise<number> {
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
                // Check if exists
                const existing = await this.prisma.knowledgeBase.findFirst({
                    where: { question: faq.question },
                });

                if (!existing) {
                    await this.prisma.knowledgeBase.create({
                        data: {
                            question: faq.question,
                            answer: faq.answer,
                            category: faq.category,
                            embedding: [], // Will be populated by AI service if needed
                            mediaUrls: [], // Will be populated with actual media
                        },
                    });
                    added++;
                    this.logger.log(`Added FAQ: ${faq.question}`);
                } else {
                    // Update if exists to add new answer
                    await this.prisma.knowledgeBase.update({
                        where: { id: existing.id },
                        data: { answer: faq.answer },
                    });
                    this.logger.log(`Updated FAQ: ${faq.question}`);
                }
            } catch (error) {
                this.logger.error(`Failed to add FAQ: ${faq.question} - ${error.message}`);
            }
        }

        return added;
    }

    /**
     * Get statistics about scraped content
     */
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

    /**
     * Get media by category
     */
    async getMediaByCategory(category: string, limit = 10) {
        return this.prisma.mediaAsset.findMany({
            where: { category },
            take: limit,
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Get all backdrop images
     */
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

    /**
     * Scrape text content from a page
     */
    private async scrapePageContent(path: string, category: string): Promise<ScrapedContent | null> {
        const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
        this.logger.log(`Scraping content from: ${url}`);

        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
                timeout: 15000,
            });

            const $ = cheerio.load(response.data);

            // Extract page title
            const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled Page';

            // Extract headings
            const headings: string[] = [];
            $('h1, h2, h3, h4, h5, h6').each((_, el) => {
                const text = $(el).text().trim();
                if (text && text.length > 3) headings.push(text);
            });

            // Extract paragraphs and other content
            const paragraphs: string[] = [];
            $('p, div.entry-content p, div.content p, section p').each((_, el) => {
                const text = $(el).text().trim();
                if (text && text.length > 10 && !text.includes('©') && !text.includes('All rights reserved')) {
                    paragraphs.push(text);
                }
            });

            // Extract lists
            $('ul li, ol li').each((_, el) => {
                const text = $(el).text().trim();
                if (text && text.length > 5) paragraphs.push(`• ${text}`);
            });

            // Combine content
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
        } catch (error) {
            this.logger.error(`Failed to scrape content from ${url}: ${error.message}`);
            return null;
        }
    }

    /**
     * Save scraped content to knowledge base
     */
    private async saveKnowledgeContent(scrapedContent: ScrapedContent): Promise<number> {
        let saved = 0;

        try {
            // Create knowledge entries from headings and content
            const entries = this.generateKnowledgeEntries(scrapedContent);

            for (const entry of entries) {
                try {
                    // Check if similar content already exists
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
                                embedding: [], // Will be populated by AI service
                                mediaUrls: [],
                            },
                        });
                        saved++;
                        this.logger.debug(`Saved knowledge: ${entry.question.substring(0, 50)}...`);
                    }
                } catch (error) {
                    this.logger.warn(`Failed to save knowledge entry: ${error.message}`);
                }
            }
        } catch (error) {
            this.logger.error(`Failed to save knowledge content: ${error.message}`);
        }

        return saved;
    }

    /**
     * Generate knowledge entries from scraped content
     */
    private generateKnowledgeEntries(content: ScrapedContent): Array<{ question: string; answer: string; category: string }> {
        const entries: Array<{ question: string; answer: string; category: string }> = [];

        // Create entries based on headings
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

        // Create general page summary entry
        if (content.content.length > 100) {
            entries.push({
                question: `Tell me about ${content.title}`,
                answer: content.content.substring(0, 1000),
                category: this.mapCategoryToKnowledgeCategory(content.category),
            });
        }

        // Create category-specific entries
        if (content.category === 'services') {
            entries.push({
                question: 'What services do you offer?',
                answer: content.content,
                category: 'Services',
            });
        } else if (content.category === 'about') {
            entries.push({
                question: 'Tell me about your studio',
                answer: content.content,
                category: 'About',
            });
        }

        return entries;
    }

    /**
     * Map page category to knowledge base category
     */
    private mapCategoryToKnowledgeCategory(pageCategory: string): string {
        const mapping: { [key: string]: string } = {
            'homepage': 'General',
            'about': 'About',
            'services': 'Services',
            'gallery': 'Portfolio',
            'portfolio': 'Portfolio',
            'contact': 'Contact',
        };
        return mapping[pageCategory] || 'General';
    }
}
