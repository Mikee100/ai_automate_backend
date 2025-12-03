"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function findPackageByName(name) {
    console.log(`Searching for package: "${name}"`);
    let pkg = await prisma.package.findFirst({
        where: {
            name: { equals: name, mode: 'insensitive' }
        }
    });
    if (pkg) {
        console.log('Found via exact match:', pkg.name);
        return pkg;
    }
    const nameWithSuffix = `${name} Package`;
    console.log(`Trying suffix: "${nameWithSuffix}"`);
    pkg = await prisma.package.findFirst({
        where: {
            name: { equals: nameWithSuffix, mode: 'insensitive' }
        }
    });
    if (pkg) {
        console.log('Found via suffix match:', pkg.name);
        return pkg;
    }
    console.log(`Trying contains: "${name}"`);
    pkg = await prisma.package.findFirst({
        where: {
            name: { contains: name, mode: 'insensitive' }
        }
    });
    if (pkg) {
        console.log('Found via contains match:', pkg.name);
        return pkg;
    }
    console.log('Package not found');
    return null;
}
async function main() {
    await findPackageByName('standard');
    await findPackageByName('Standard Package');
    await findPackageByName('vip');
    await findPackageByName('nonexistent');
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=test-package-lookup.js.map