// scripts/seed-all.ts
// Comprehensive seeding script - handles packages and knowledge base
// Safe to run multiple times (uses upsert)

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SeedingService } from '../src/modules/seeding/seeding.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('SeedAll');
  
  try {
    logger.log('🚀 Starting comprehensive seeding...');
    logger.log('');
    
    const app = await NestFactory.createApplicationContext(AppModule);
    const seedingService = app.get(SeedingService);
    
    // Step 1: Seed packages
    logger.log('📦 Step 1: Seeding packages...');
    await seedingService.seedPackages();
    logger.log('✅ Packages seeded successfully!');
    logger.log('');
    
    // Step 2: Seed knowledge base
    logger.log('🧠 Step 2: Seeding knowledge base...');
    await seedingService.seedKnowledgeBase();
    logger.log('✅ Knowledge base seeded successfully!');
    logger.log('');
    
    logger.log('✨ All seeding completed successfully!');
    logger.log('');
    logger.log('📝 Next steps:');
    logger.log('   - Test by asking: "tell me about the standard package"');
    logger.log('   - Verify: "what packages do you offer"');
    logger.log('');
    
    await app.close();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Failed during seeding', error);
    process.exit(1);
  }
}

bootstrap();
