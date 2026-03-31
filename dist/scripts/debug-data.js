"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('--- PACKAGES ---');
    const packages = await prisma.package.findMany({
        where: { name: { contains: 'Standard', mode: 'insensitive' } }
    });
    console.log(JSON.stringify(packages, null, 2));
    console.log('\n--- KNOWLEDGE BASE (Parking) ---');
    const kbParking = await prisma.knowledgeBase.findMany({
        where: {
            OR: [
                { question: { contains: 'parking', mode: 'insensitive' } },
                { answer: { contains: 'parking', mode: 'insensitive' } }
            ]
        }
    });
    console.log(JSON.stringify(kbParking, null, 2));
    console.log('\n--- KNOWLEDGE BASE (Available) ---');
    const kbAvailable = await prisma.knowledgeBase.findMany({
        where: {
            question: { contains: 'available', mode: 'insensitive' }
        }
    });
    console.log(JSON.stringify(kbAvailable, null, 2));
}
main()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=debug-data.js.map