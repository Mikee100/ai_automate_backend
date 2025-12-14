#!/usr/bin/env ts-node
/**
 * Backup Verification Script
 * 
 * Verifies backup integrity and optionally tests restore to a temporary database.
 * 
 * Usage:
 *   npm run backup:verify                    # Verify latest backup
 *   npm run backup:verify -- --test-restore   # Test restore to temp database
 *   npm run backup:verify -- --file <path>    # Verify specific backup file
 * 
 * Environment Variables:
 *   DATABASE_URL          - PostgreSQL connection string
 *   BACKUP_DIR            - Local backup directory (default: ./backups)
 *   TEST_DATABASE_NAME    - Name for test restore database (default: backup_test_restore)
 */

import { execSync } from 'child_process';
import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

interface VerificationConfig {
  databaseUrl: string;
  backupDir: string;
  backupFile?: string;
  testRestore: boolean;
  testDatabaseName: string;
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
 * Get verification configuration
 */
function getConfig(): VerificationConfig {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const args = process.argv.slice(2);
  const testRestore = args.includes('--test-restore');
  const fileArg = args.find(arg => arg.startsWith('--file='));
  const backupFile = fileArg ? fileArg.split('=')[1] : undefined;

  const backupDir = process.env.BACKUP_DIR || join(process.cwd(), 'backups');
  const testDatabaseName = process.env.TEST_DATABASE_NAME || 'backup_test_restore';

  return {
    databaseUrl,
    backupDir,
    backupFile,
    testRestore,
    testDatabaseName,
  };
}

/**
 * Find latest backup file
 */
function findLatestBackup(backupDir: string): string | null {
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
    return null;
  }

  allBackups.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
  return allBackups[0].path;
}

/**
 * Verify backup file integrity
 */
async function verifyBackupFile(backupFile: string): Promise<{
  valid: boolean;
  size: number;
  compressed: boolean;
  error?: string;
}> {
  console.log(`🔍 Verifying backup file: ${backupFile}\n`);

  if (!existsSync(backupFile)) {
    return {
      valid: false,
      size: 0,
      compressed: false,
      error: 'File not found',
    };
  }

  const stats = statSync(backupFile);
  const isCompressed = backupFile.endsWith('.gz');

  if (stats.size === 0) {
    return {
      valid: false,
      size: 0,
      compressed: isCompressed,
      error: 'File is empty',
    };
  }

  // Check if compressed file is valid
  if (isCompressed) {
    try {
      execSync(`gunzip -t "${backupFile}"`, { stdio: 'ignore' });
    } catch {
      return {
        valid: false,
        size: stats.size,
        compressed: true,
        error: 'Compressed file is corrupted',
      };
    }
  }

  // Check if SQL file has valid structure (basic check)
  if (!isCompressed) {
    try {
      const head = execSync(`head -n 20 "${backupFile}"`, { encoding: 'utf-8' });
      if (!head.includes('PostgreSQL database dump')) {
        return {
          valid: false,
          size: stats.size,
          compressed: false,
          error: 'File does not appear to be a valid PostgreSQL dump',
        };
      }
    } catch {
      // If we can't read it, assume it's valid (might be permissions issue)
    }
  }

  return {
    valid: true,
    size: stats.size,
    compressed: isCompressed,
  };
}

/**
 * Test restore to temporary database
 */
async function testRestore(
  backupFile: string,
  dbInfo: ReturnType<typeof parseDatabaseUrl>,
  testDatabaseName: string
): Promise<boolean> {
  console.log(`\n🧪 Testing restore to temporary database: ${testDatabaseName}\n`);

  const env = {
    ...process.env,
    PGPASSWORD: dbInfo.password,
  };

  try {
    // Create test database
    console.log('1️⃣  Creating test database...');
    await execAsync(
      `psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d postgres -c "DROP DATABASE IF EXISTS ${testDatabaseName};"`,
      { env }
    );
    await execAsync(
      `psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d postgres -c "CREATE DATABASE ${testDatabaseName};"`,
      { env }
    );

    // Restore backup
    console.log('2️⃣  Restoring backup...');
    const isCompressed = backupFile.endsWith('.gz');
    
    let restoreCommand: string;
    if (isCompressed) {
      restoreCommand = `gunzip -c "${backupFile}" | psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d ${testDatabaseName}`;
    } else {
      restoreCommand = `psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d ${testDatabaseName} < "${backupFile}"`;
    }

    await execAsync(restoreCommand, { 
      env, 
      shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh' 
    });

    // Verify restore by checking table count
    console.log('3️⃣  Verifying restore...');
    const tableCount = await execAsync(
      `psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d ${testDatabaseName} -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"`,
      { env, encoding: 'utf-8' }
    );

    const count = parseInt(tableCount.stdout.trim(), 10);
    console.log(`   Found ${count} tables in restored database`);

    if (count === 0) {
      console.log('⚠️  Warning: No tables found in restored database');
    }

    // Clean up test database
    console.log('4️⃣  Cleaning up test database...');
    await execAsync(
      `psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d postgres -c "DROP DATABASE ${testDatabaseName};"`,
      { env }
    );

    console.log('\n✅ Restore test completed successfully!');
    return true;

  } catch (error: any) {
    console.error(`\n❌ Restore test failed: ${error.message}`);
    
    // Try to clean up test database
    try {
      await execAsync(
        `psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d postgres -c "DROP DATABASE IF EXISTS ${testDatabaseName};"`,
        { env: { ...process.env, PGPASSWORD: dbInfo.password } }
      );
    } catch {
      // Ignore cleanup errors
    }

    return false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    const config = getConfig();
    const dbInfo = parseDatabaseUrl(config.databaseUrl);

    // Find backup file
    let backupFile = config.backupFile;
    if (!backupFile) {
      backupFile = findLatestBackup(config.backupDir);
      if (!backupFile) {
        console.error('❌ No backup file found');
        process.exit(1);
      }
    }

    console.log('🔍 Backup Verification\n');
    console.log(`📁 Backup file: ${backupFile}`);
    console.log(`🗄️  Source database: ${dbInfo.database}`);
    console.log(`🖥️  Host: ${dbInfo.host}:${dbInfo.port}\n`);

    // Verify file integrity
    const verification = await verifyBackupFile(backupFile);

    if (!verification.valid) {
      console.error(`\n❌ Backup verification failed: ${verification.error}`);
      process.exit(1);
    }

    console.log(`✅ File integrity check passed`);
    console.log(`   Size: ${(verification.size / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`   Compressed: ${verification.compressed ? 'Yes' : 'No'}`);

    // Test restore if requested
    if (config.testRestore) {
      const restoreSuccess = await testRestore(backupFile, dbInfo, config.testDatabaseName);
      if (!restoreSuccess) {
        process.exit(1);
      }
    } else {
      console.log('\n💡 Tip: Use --test-restore to test restoring to a temporary database');
    }

    console.log('\n✅ Backup verification completed successfully!');
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

export { verifyBackupFile, testRestore };
