
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const packages = await prisma.package.findMany();
    console.log('PACKAGES:', JSON.stringify(packages, null, 2));

    const kb = await prisma.knowledgeBase.findMany({
        where: {
            OR: [
                { question: { contains: 'parking', mode: 'insensitive' } },
                { answer: { contains: 'parking', mode: 'insensitive' } },
                { answer: { contains: 'available', mode: 'insensitive' } }
            ]
        }
    });
    console.log('KB:', JSON.stringify(kb, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
