"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Verifying Media Assets...');
    const mediaCount = await prisma.mediaAsset.count();
    console.log(`Total Media Assets: ${mediaCount}`);
    const categories = await prisma.mediaAsset.groupBy({
        by: ['category'],
        _count: true,
    });
    console.log('Media by Category:', categories);
    const faqsWithMedia = await prisma.knowledgeBase.count({
        where: {
            mediaUrls: {
                isEmpty: false,
            },
        },
    });
    console.log(`FAQs with Media: ${faqsWithMedia}`);
    const backdropFaqs = await prisma.knowledgeBase.findMany({
        where: {
            question: { contains: 'backdrop', mode: 'insensitive' },
        },
        select: { question: true, mediaUrls: true },
    });
    console.log('Backdrop FAQs:', JSON.stringify(backdropFaqs, null, 2));
    await prisma.$disconnect();
}
main().catch(console.error);
//# sourceMappingURL=verify-media.js.map