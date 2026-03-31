
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const results = {};
    
    results.packages = await prisma.package.findMany({
        where: { name: { contains: 'Standard', mode: 'insensitive' } }
    });

    results.kbParking = await prisma.knowledgeBase.findMany({
        where: {
            OR: [
                { question: { contains: 'parking', mode: 'insensitive' } },
                { answer: { contains: 'parking', mode: 'insensitive' } }
            ]
        }
    });

    results.kbAvailable = await prisma.knowledgeBase.findMany({
        where: {
            question: { contains: 'available', mode: 'insensitive' }
        }
    });

    fs.writeFileSync('scripts/debug_final.json', JSON.stringify(results, null, 2));
    console.log('Success - wrote to scripts/debug_final.json');
}

main().catch(e => {
    fs.writeFileSync('scripts/debug_error.txt', e.stack);
    console.error(e);
}).finally(() => prisma.$disconnect());
