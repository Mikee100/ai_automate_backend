/**
 * SECURITY: Script to create initial admin user
 * 
 * Usage:
 *   ts-node -r tsconfig-paths/register scripts/create-admin-user.ts <email> <password> <name>
 * 
 * Example:
 *   ts-node -r tsconfig-paths/register scripts/create-admin-user.ts admin@example.com SecurePassword123 Admin User
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdminUser() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('❌ Usage: ts-node scripts/create-admin-user.ts <email> <password> <name>');
    console.error('Example: ts-node scripts/create-admin-user.ts admin@example.com SecurePassword123 "Admin User"');
    process.exit(1);
  }

  const [email, password, name] = args;

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      console.error(`❌ User with email ${email} already exists!`);
      process.exit(1);
    }

    // SECURITY: Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
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
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
