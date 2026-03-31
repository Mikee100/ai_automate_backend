
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const updated = await prisma.package.update({
        where: { name: 'Standard Package' },
        data: { deposit: 2000 }
    });
    console.log('Updated Standard Package deposit to 2000:', updated);
}

main().catch(console.error).finally(() => prisma.$disconnect());
