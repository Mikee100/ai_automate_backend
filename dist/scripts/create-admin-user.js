"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function createAdminUser() {
    const args = process.argv.slice(2);
    if (args.length < 3) {
        console.error('❌ Usage: ts-node scripts/create-admin-user.ts <email> <password> <name>');
        console.error('Example: ts-node scripts/create-admin-user.ts admin@example.com SecurePassword123 "Admin User"');
        process.exit(1);
    }
    const [email, password, name] = args;
    try {
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (existingUser) {
            console.error(`❌ User with email ${email} already exists!`);
            process.exit(1);
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                password: hashedPassword,
                name: name,
                role: 'admin',
                isActive: true,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });
        console.log('✅ Admin user created successfully!');
        console.log(JSON.stringify(user, null, 2));
    }
    catch (error) {
        console.error('❌ Error creating admin user:', error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
createAdminUser();
//# sourceMappingURL=create-admin-user.js.map