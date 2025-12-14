#!/usr/bin/env ts-node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCleanup = runCleanup;
exports.getConfig = getConfig;
const client_1 = require("@prisma/client");
function getConfig() {
    const args = process.argv.slice(2);
    return {
        messagesDays: parseInt(process.env.RETENTION_MESSAGES_DAYS || '365', 10),
        logsDays: parseInt(process.env.RETENTION_LOGS_DAYS || '90', 10),
        analyticsDays: parseInt(process.env.RETENTION_ANALYTICS_DAYS || '730', 10),
        deletedDays: parseInt(process.env.RETENTION_DELETED_DAYS || '30', 10),
        dryRun: args.includes('--dry-run'),
        force: args.includes('--force'),
    };
}
async function cleanupMessages(prisma, days, dryRun) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    if (dryRun) {
        const count = await prisma.message.count({
            where: {
                createdAt: {
                    lt: cutoffDate,
                },
            },
        });
        console.log(`  📨 Would delete ${count} messages older than ${days} days`);
        return count;
    }
    const result = await prisma.message.deleteMany({
        where: {
            createdAt: {
                lt: cutoffDate,
            },
        },
    });
    console.log(`  ✅ Deleted ${result.count} messages older than ${days} days`);
    return result.count;
}
async function cleanupAnalytics(prisma, days, dryRun) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    let totalDeleted = 0;
    if (dryRun) {
        const count = await prisma.conversationMetrics.count({
            where: {
                timestamp: {
                    lt: cutoffDate,
                },
            },
        });
        console.log(`  📊 Would delete ${count} conversation metrics older than ${days} days`);
        totalDeleted += count;
    }
    else {
        const result = await prisma.conversationMetrics.deleteMany({
            where: {
                timestamp: {
                    lt: cutoffDate,
                },
            },
        });
        console.log(`  ✅ Deleted ${result.count} conversation metrics older than ${days} days`);
        totalDeleted += result.count;
    }
    if (dryRun) {
        const count = await prisma.aiPrediction.count({
            where: {
                timestamp: {
                    lt: cutoffDate,
                },
            },
        });
        console.log(`  🤖 Would delete ${count} AI predictions older than ${days} days`);
        totalDeleted += count;
    }
    else {
        const result = await prisma.aiPrediction.deleteMany({
            where: {
                timestamp: {
                    lt: cutoffDate,
                },
            },
        });
        console.log(`  ✅ Deleted ${result.count} AI predictions older than ${days} days`);
        totalDeleted += result.count;
    }
    if (dryRun) {
        const count = await prisma.sentimentScore.count({
            where: {
                createdAt: {
                    lt: cutoffDate,
                },
            },
        });
        console.log(`  😊 Would delete ${count} sentiment scores older than ${days} days`);
        totalDeleted += count;
    }
    else {
        const result = await prisma.sentimentScore.deleteMany({
            where: {
                createdAt: {
                    lt: cutoffDate,
                },
            },
        });
        console.log(`  ✅ Deleted ${result.count} sentiment scores older than ${days} days`);
        totalDeleted += result.count;
    }
    return totalDeleted;
}
async function cleanupDeletedRecords(prisma, days, dryRun) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    let totalDeleted = 0;
    console.log(`  ℹ️  Soft-delete cleanup not implemented (no deletedAt fields in schema)`);
    return totalDeleted;
}
async function runCleanup(config) {
    const prisma = new client_1.PrismaClient();
    const stats = {
        messages: 0,
        logs: 0,
        analytics: 0,
        deleted: 0,
        errors: 0,
    };
    try {
        console.log('🧹 Starting data retention cleanup...\n');
        if (config.dryRun) {
            console.log('⚠️  DRY RUN MODE - No data will be deleted\n');
        }
        console.log(`📨 Cleaning messages older than ${config.messagesDays} days...`);
        try {
            stats.messages = await cleanupMessages(prisma, config.messagesDays, config.dryRun);
        }
        catch (error) {
            console.error(`  ❌ Error: ${error.message}`);
            stats.errors++;
        }
        console.log(`\n📊 Cleaning analytics older than ${config.analyticsDays} days...`);
        try {
            stats.analytics = await cleanupAnalytics(prisma, config.analyticsDays, config.dryRun);
        }
        catch (error) {
            console.error(`  ❌ Error: ${error.message}`);
            stats.errors++;
        }
        console.log(`\n🗑️  Cleaning permanently deleted records older than ${config.deletedDays} days...`);
        try {
            stats.deleted = await cleanupDeletedRecords(prisma, config.deletedDays, config.dryRun);
        }
        catch (error) {
            console.error(`  ❌ Error: ${error.message}`);
            stats.errors++;
        }
        console.log('\n✅ Cleanup completed!');
        console.log(`\n📊 Summary:`);
        console.log(`   Messages deleted: ${stats.messages}`);
        console.log(`   Analytics deleted: ${stats.analytics}`);
        console.log(`   Deleted records cleaned: ${stats.deleted}`);
        console.log(`   Errors: ${stats.errors}`);
    }
    catch (error) {
        console.error(`\n❌ Fatal error: ${error.message}`);
        stats.errors++;
    }
    finally {
        await prisma.$disconnect();
    }
    return stats;
}
async function main() {
    try {
        const config = getConfig();
        console.log('📋 Data Retention Policy Cleanup\n');
        console.log('Configuration:');
        console.log(`   Messages retention: ${config.messagesDays} days`);
        console.log(`   Analytics retention: ${config.analyticsDays} days`);
        console.log(`   Deleted records retention: ${config.deletedDays} days`);
        console.log(`   Dry run: ${config.dryRun ? 'Yes' : 'No'}\n`);
        if (!config.dryRun && !config.force) {
            console.log('⚠️  This will permanently delete data!');
            console.log('⚠️  Use --dry-run to see what would be deleted first.');
            console.log('⚠️  Use --force to skip this warning.\n');
        }
        const stats = await runCleanup(config);
        if (stats.errors > 0) {
            process.exit(1);
        }
        process.exit(0);
    }
    catch (error) {
        console.error(`\n❌ Fatal error: ${error.message}`);
        process.exit(1);
    }
}
if (require.main === module) {
    main();
}
//# sourceMappingURL=data-retention-cleanup.js.map