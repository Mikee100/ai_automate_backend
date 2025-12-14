"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🧹 Starting cleanup of outdoor packages...');
    try {
        const deletedPackages = await prisma.package.deleteMany({
            where: {
                type: 'outdoor',
            },
        });
        console.log(`✅ Deleted ${deletedPackages.count} outdoor package(s)`);
        console.log('✨ Cleanup completed successfully!');
        console.log('');
        console.log('📝 Next steps:');
        console.log('   1. Run: npx ts-node scripts/seed-studio-packages.ts');
        console.log('   2. Run: npx ts-node scripts/seed-knowledge.ts');
    }
    catch (error) {
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
//# sourceMappingURL=cleanup-outdoor-packages.js.map