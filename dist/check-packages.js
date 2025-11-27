"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const packages = await prisma.package.findMany();
    console.log('=== PACKAGES IN DATABASE ===');
    console.log(JSON.stringify(packages, null, 2));
    console.log(`\nTotal packages: ${packages.length}`);
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=check-packages.js.map