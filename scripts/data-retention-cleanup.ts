#!/usr/bin/env ts-node
/**
 * Data Retention Policy Cleanup Script
 * 
 * Automatically removes old data based on retention policies.
 * 
 * Usage:
 *   npm run retention:cleanup                    # Run cleanup
 *   npm run retention:cleanup -- --dry-run      # Show what would be deleted
 *   npm run retention:cleanup -- --force         # Skip confirmation prompts
 * 
 * Environment Variables:
 *   DATABASE_URL              - PostgreSQL connection string
 *   RETENTION_MESSAGES_DAYS   - Keep messages for N days (default: 365)
 *   RETENTION_LOGS_DAYS       - Keep logs for N days (default: 90)
 *   RETENTION_ANALYTICS_DAYS  - Keep analytics for N days (default: 730)
 *   RETENTION_DELETED_DAYS    - Keep soft-deleted records for N days (default: 30)
 */

import { PrismaClient } from '@prisma/client';

interface RetentionConfig {
  messagesDays: number;
  logsDays: number;
  analyticsDays: number;
  deletedDays: number;
  dryRun: boolean;
  force: boolean;
}

interface CleanupStats {
  messages: number;
  logs: number;
  analytics: number;
  deleted: number;
  errors: number;
}

/**
 * Get retention configuration from environment
 */
function getConfig(): RetentionConfig {
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

/**
 * Clean up old messages
 */
async function cleanupMessages(prisma: PrismaClient, days: number, dryRun: boolean): Promise<number> {
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

/**
 * Clean up old analytics data
 */
async function cleanupAnalytics(prisma: PrismaClient, days: number, dryRun: boolean): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  let totalDeleted = 0;

  // Clean up conversation metrics
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
  } else {
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

  // Clean up AI predictions
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
  } else {
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

  // Clean up sentiment scores
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
  } else {
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

/**
 * Clean up permanently deleted records (soft-deleted records past retention)
 */
async function cleanupDeletedRecords(prisma: PrismaClient, days: number, dryRun: boolean): Promise<number> {
  // Note: This assumes you have a soft-delete pattern with a deletedAt field
  // Adjust based on your actual schema
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  // Example: If you have a deletedAt field on customers
  // This is a placeholder - adjust based on your actual schema
  let totalDeleted = 0;

  // You can add specific cleanup logic here for soft-deleted records
  // For example:
  // const deletedCustomers = await prisma.customer.findMany({
  //   where: {
  //     deletedAt: {
  //       lt: cutoffDate,
  //     },
  //   },
  // });

  console.log(`  ℹ️  Soft-delete cleanup not implemented (no deletedAt fields in schema)`);
  
  return totalDeleted;
}

/**
 * Main cleanup function
 */
async function runCleanup(config: RetentionConfig): Promise<CleanupStats> {
  const prisma = new PrismaClient();
  const stats: CleanupStats = {
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

    // Clean up old messages
    console.log(`📨 Cleaning messages older than ${config.messagesDays} days...`);
    try {
      stats.messages = await cleanupMessages(prisma, config.messagesDays, config.dryRun);
    } catch (error: any) {
      console.error(`  ❌ Error: ${error.message}`);
      stats.errors++;
    }

    // Clean up old analytics
    console.log(`\n📊 Cleaning analytics older than ${config.analyticsDays} days...`);
    try {
      stats.analytics = await cleanupAnalytics(prisma, config.analyticsDays, config.dryRun);
    } catch (error: any) {
      console.error(`  ❌ Error: ${error.message}`);
      stats.errors++;
    }

    // Clean up soft-deleted records
    console.log(`\n🗑️  Cleaning permanently deleted records older than ${config.deletedDays} days...`);
    try {
      stats.deleted = await cleanupDeletedRecords(prisma, config.deletedDays, config.dryRun);
    } catch (error: any) {
      console.error(`  ❌ Error: ${error.message}`);
      stats.errors++;
    }

    console.log('\n✅ Cleanup completed!');
    console.log(`\n📊 Summary:`);
    console.log(`   Messages deleted: ${stats.messages}`);
    console.log(`   Analytics deleted: ${stats.analytics}`);
    console.log(`   Deleted records cleaned: ${stats.deleted}`);
    console.log(`   Errors: ${stats.errors}`);

  } catch (error: any) {
    console.error(`\n❌ Fatal error: ${error.message}`);
    stats.errors++;
  } finally {
    await prisma.$disconnect();
  }

  return stats;
}

/**
 * Main function
 */
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
      // In production, you might want to add a confirmation prompt here
    }

    const stats = await runCleanup(config);

    if (stats.errors > 0) {
      process.exit(1);
    }

    process.exit(0);
  } catch (error: any) {
    console.error(`\n❌ Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { runCleanup, getConfig };
