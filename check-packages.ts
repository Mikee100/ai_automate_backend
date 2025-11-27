// Quick script to view packages in DB
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const packages = await prisma.package.findMany();
    console.log('=== PACKAGES IN DATABASE ===');
    console.log(JSON.stringify(packages, null, 2));
    console.log(`\nTotal packages: ${packages.length}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
