#!/usr/bin/env ts-node
/**
 * Database Restore Script
 * 
 * Restores PostgreSQL database from a backup file.
 * 
 * Usage:
 *   npm run restore:db -- <backup-file>              # Restore from file
 *   npm run restore:db -- --latest                     # Restore latest backup
 *   npm run restore:db -- --date 2025-01-27           # Restore from specific date
 *   npm run restore:db -- --dry-run                    # Show what would be restored
 * 
 * ⚠️  WARNING: This will DROP and recreate the database!
 * 
 * Environment Variables:
 *   DATABASE_URL          - PostgreSQL connection string
 *   BACKUP_DIR            - Local backup directory (default: ./backups)
 */

import { execSync } from 'child_process';
import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

interface RestoreConfig {
  databaseUrl: string;
  backupDir: string;
  backupFile?: string;
  dryRun: boolean;
}

/**
 * Parse DATABASE_URL to extract connection details
 */
function parseDatabaseUrl(url: string): {
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
} {
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    throw new Error('Invalid DATABASE_URL format');
  }

  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    database: match[5],
  };
}

/**
 * Get restore configuration
 */
function getConfig(): RestoreConfig {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const latest = args.includes('--latest');
  const dateArg = args.find(arg => arg.startsWith('--date='));
  const date = dateArg ? dateArg.split('=')[1] : null;

  const backupDir = process.env.BACKUP_DIR || join(process.cwd(), 'backups');

  let backupFile: string | undefined;

  if (latest) {
    // Find latest backup
    const dailyDir = join(backupDir, 'daily');
    const hourlyDir = join(backupDir, 'hourly');
    
    const allBackups: Array<{ path: string; mtime: Date }> = [];
    
    [dailyDir, hourlyDir].forEach(dir => {
      if (existsSync(dir)) {
        readdirSync(dir)
          .filter(f => f.startsWith('backup-') && (f.endsWith('.sql') || f.endsWith('.sql.gz')))
          .forEach(f => {
            const filePath = join(dir, f);
            allBackups.push({
              path: filePath,
              mtime: statSync(filePath).mtime,
            });
          });
      }
    });

    if (allBackups.length === 0) {
      throw new Error('No backups found');
    }

    allBackups.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
    backupFile = allBackups[0].path;
  } else if (date) {
    // Find backup from specific date
    const dailyDir = join(backupDir, 'daily');
    const hourlyDir = join(backupDir, 'hourly');
    
    const dateStr = date.replace(/-/g, '-');
    let foundBackup: string | null = null;

    [dailyDir, hourlyDir].forEach(dir => {
      if (existsSync(dir)) {
        const files = readdirSync(dir).filter(f => 
          f.startsWith(`backup-${dateStr}`) && (f.endsWith('.sql') || f.endsWith('.sql.gz'))
        );
        if (files.length > 0) {
          // Get the latest one for that date
          const backups = files.map(f => ({
            name: f,
            path: join(dir, f),
            mtime: statSync(join(dir, f)).mtime,
          })).sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
          foundBackup = backups[0].path;
        }
      }
    });

    if (!foundBackup) {
      throw new Error(`No backup found for date: ${date}`);
    }

    backupFile = foundBackup;
  } else {
    // Use provided file path
    const fileArg = args.find(arg => !arg.startsWith('--'));
    if (!fileArg) {
      throw new Error('Please provide a backup file path, or use --latest or --date=YYYY-MM-DD');
    }
    backupFile = fileArg;
  }

  if (!backupFile || !existsSync(backupFile)) {
    throw new Error(`Backup file not found: ${backupFile}`);
  }

  return {
    databaseUrl,
    backupDir,
    backupFile,
    dryRun,
  };
}

/**
 * Restore database from backup
 */
async function restoreDatabase(config: RestoreConfig): Promise<void> {
  const dbInfo = parseDatabaseUrl(config.databaseUrl);
  const env = {
    ...process.env,
    PGPASSWORD: dbInfo.password,
  };

  console.log('🔄 Restoring database...\n');
  console.log(`📁 Backup file: ${config.backupFile}`);
  console.log(`🗄️  Database: ${dbInfo.database}`);
  console.log(`🖥️  Host: ${dbInfo.host}:${dbInfo.port}`);

  if (config.dryRun) {
    console.log('\n⚠️  DRY RUN MODE - No changes will be made\n');
    console.log('Would execute:');
    console.log(`  1. Drop database: ${dbInfo.database}`);
    console.log(`  2. Create database: ${dbInfo.database}`);
    console.log(`  3. Restore from: ${config.backupFile}`);
    return;
  }

  // Confirm before proceeding
  console.log('\n⚠️  WARNING: This will DROP and recreate the database!');
  console.log('⚠️  All current data will be lost!\n');
  
  // In production, you might want to add a confirmation prompt here
  // For now, we'll proceed (you can add readline for interactive confirmation)

  try {
    // Step 1: Drop existing connections
    console.log('1️⃣  Terminating existing connections...');
    const terminateConnections = `
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = '${dbInfo.database}' AND pid <> pg_backend_pid();
    `;
    await execAsync(
      `psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d postgres -c "${terminateConnections}"`,
      { env }
    );

    // Step 2: Drop database
    console.log('2️⃣  Dropping database...');
    await execAsync(
      `psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d postgres -c "DROP DATABASE IF EXISTS ${dbInfo.database};"`,
      { env }
    );

    // Step 3: Create database
    console.log('3️⃣  Creating database...');
    await execAsync(
      `psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d postgres -c "CREATE DATABASE ${dbInfo.database};"`,
      { env }
    );

    // Step 4: Restore from backup
    console.log('4️⃣  Restoring from backup...');
    const isCompressed = config.backupFile!.endsWith('.gz');
    
    let restoreCommand: string;
    if (isCompressed) {
      restoreCommand = `gunzip -c "${config.backupFile}" | psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d ${dbInfo.database}`;
    } else {
      restoreCommand = `psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d ${dbInfo.database} < "${config.backupFile}"`;
    }

    await execAsync(restoreCommand, { 
      env, 
      shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh' 
    });

    console.log('\n✅ Database restored successfully!');
    console.log(`📊 Backup file: ${config.backupFile}`);
    console.log(`🗄️  Database: ${dbInfo.database}`);

  } catch (error: any) {
    console.error(`\n❌ Restore failed: ${error.message}`);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    const config = getConfig();
    await restoreDatabase(config);
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

export { restoreDatabase };
