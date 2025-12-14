"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const seeding_service_1 = require("../src/modules/seeding/seeding.service");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const logger = new common_1.Logger('SeedAll');
    try {
        logger.log('🚀 Starting comprehensive seeding...');
        logger.log('');
        const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
        const seedingService = app.get(seeding_service_1.SeedingService);
        logger.log('📦 Step 1: Seeding packages...');
        await seedingService.seedPackages();
        logger.log('✅ Packages seeded successfully!');
        logger.log('');
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
    }
    catch (error) {
        logger.error('❌ Failed during seeding', error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=seed-all.js.map