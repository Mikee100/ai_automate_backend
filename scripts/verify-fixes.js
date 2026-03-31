
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const results = {};
    
    // Check package deposit
    results.package = await prisma.package.findUnique({
        where: { name: 'Standard Package' }
    });

    fs.writeFileSync('scripts/verification_results.json', JSON.stringify(results, null, 2));
    console.log('Success - wrote to scripts/verification_results.json');
}

main().catch(console.error).finally(() => prisma.$disconnect());
