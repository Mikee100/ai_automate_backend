// scripts/cleanup-outdoor-packages.ts
// This script removes outdoor packages from the database
// Run this BEFORE seeding studio packages if you want a clean slate

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Starting cleanup of outdoor packages...');

  try {
    // Delete outdoor packages
    const deletedPackages = await prisma.package.deleteMany({
      where: {
        type: 'outdoor',
      },
    });

    console.log(`✅ Deleted ${deletedPackages.count} outdoor package(s)`);

    // Optionally: Delete outdoor package knowledge entries
    // Note: This is optional because seeding will overwrite them anyway
    // Uncomment if you want to clean them up manually
    
    /*
    const outdoorKnowledge = await prisma.knowledgeBase.deleteMany({
      where: {
        OR: [
          { question: { contains: 'outdoor', mode: 'insensitive' } },
          { answer: { contains: 'outdoor', mode: 'insensitive' } },
        ],
      },
    });
    console.log(`✅ Deleted ${outdoorKnowledge.count} outdoor knowledge entry/entries`);
    */

    console.log('✨ Cleanup completed successfully!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Run: npx ts-node scripts/seed-studio-packages.ts');
    console.log('   2. Run: npx ts-node scripts/seed-knowledge.ts');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
