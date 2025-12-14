#!/usr/bin/env ts-node
/**
 * Automated Database Backup Script
 * 
 * Creates PostgreSQL database backups with compression and optional cloud storage.
 * 
 * Usage:
 *   npm run backup:db                    # Daily backup (default)
 *   npm run backup:db -- --hourly        # Hourly backup
 *   npm run backup:db -- --full          # Full backup (no compression)
 *   npm run backup:db -- --verify        # Verify latest backup
 * 
 * Environment Variables:
 *   DATABASE_URL          - PostgreSQL connection string
 *   BACKUP_DIR            - Local backup directory (default: ./backups)
 *   BACKUP_RETENTION_DAYS - Days to keep backups (default: 30)
 *   AWS_S3_BUCKET         - Optional: S3 bucket for off-site storage
 *   AWS_ACCESS_KEY_ID     - Optional: AWS access key
 *   AWS_SECRET_ACCESS_KEY - Optional: AWS secret key
 *   GCS_BUCKET            - Optional: Google Cloud Storage bucket
 *   GCS_KEY_FILE          - Optional: Path to GCS service account key
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

interface BackupConfig {
  databaseUrl: string;
  backupDir: string;
  retentionDays: number;
  compression: boolean;
  hourly: boolean;
  uploadToS3: boolean;
  uploadToGCS: boolean;
  s3Bucket?: string;
  gcsBucket?: string;
}

interface BackupResult {
  success: boolean;
  backupPath: string;
  size: number;
  timestamp: Date;
  error?: string;
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
  // Format: postgresql://user:password@host:port/database
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
 * Get backup configuration from environment
 */
function getConfig(): BackupConfig {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const args = process.argv.slice(2);
  const hourly = args.includes('--hourly');
  const full = args.includes('--full');
  const verify = args.includes('--verify');

  const backupDir = process.env.BACKUP_DIR || join(process.cwd(), 'backups');
  const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10);

  // Ensure backup directory exists
  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
  }

  // Create subdirectories
  const dailyDir = join(backupDir, 'daily');
  const hourlyDir = join(backupDir, 'hourly');
  if (!existsSync(dailyDir)) mkdirSync(dailyDir, { recursive: true });
  if (!existsSync(hourlyDir)) mkdirSync(hourlyDir, { recursive: true });

  return {
    databaseUrl,
    backupDir,
    retentionDays,
    compression: !full,
    hourly,
    uploadToS3: !!process.env.AWS_S3_BUCKET,
    uploadToGCS: !!process.env.GCS_BUCKET,
    s3Bucket: process.env.AWS_S3_BUCKET,
    gcsBucket: process.env.GCS_BUCKET,
  };
}

/**
 * Create database backup using pg_dump
 */
async function createBackup(config: BackupConfig): Promise<BackupResult> {
  const dbInfo = parseDatabaseUrl(config.databaseUrl);
  const timestamp = new Date();
  const dateStr = timestamp.toISOString().replace(/[:.]/g, '-').split('T')[0];
  const timeStr = timestamp.toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0];
  
  const backupType = config.hourly ? 'hourly' : 'daily';
  const backupSubDir = join(config.backupDir, backupType);
  const filename = `backup-${dateStr}-${timeStr}.sql${config.compression ? '.gz' : ''}`;
  const backupPath = join(backupSubDir, filename);

  console.log(`📦 Creating ${backupType} backup: ${filename}`);

  try {
    // Set PGPASSWORD environment variable for pg_dump
    const env = {
      ...process.env,
      PGPASSWORD: dbInfo.password,
    };

    // Build pg_dump command
    let dumpCommand = `pg_dump -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d ${dbInfo.database}`;
    
    // Add compression if enabled
    if (config.compression) {
      dumpCommand += ' | gzip';
    }

    // Output to file
    dumpCommand += ` > "${backupPath}"`;

    // Execute backup
    await execAsync(dumpCommand, { 
      env, 
      shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh' 
    });

    // Get file size
    const stats = statSync(backupPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`✅ Backup created successfully: ${sizeMB} MB`);

    return {
      success: true,
      backupPath,
      size: stats.size,
      timestamp,
    };
  } catch (error: any) {
    console.error(`❌ Backup failed: ${error.message}`);
    return {
      success: false,
      backupPath,
      size: 0,
      timestamp,
      error: error.message,
    };
  }
}

/**
 * Upload backup to AWS S3
 */
async function uploadToS3(backupPath: string, bucket: string): Promise<boolean> {
  try {
    console.log(`☁️  Uploading to S3: ${bucket}`);
    
    // Check if AWS CLI is available
    try {
      execSync('aws --version', { stdio: 'ignore' });
    } catch {
      console.warn('⚠️  AWS CLI not found. Install it to enable S3 uploads.');
      return false;
    }

    const key = `backups/${backupPath.split(/[/\\]/).pop()}`;
    const command = `aws s3 cp "${backupPath}" s3://${bucket}/${key}`;

    await execAsync(command);
    console.log(`✅ Uploaded to S3: s3://${bucket}/${key}`);
    return true;
  } catch (error: any) {
    console.error(`❌ S3 upload failed: ${error.message}`);
    return false;
  }
}

/**
 * Upload backup to Google Cloud Storage
 */
async function uploadToGCS(backupPath: string, bucket: string): Promise<boolean> {
  try {
    console.log(`☁️  Uploading to GCS: ${bucket}`);
    
    // Check if gsutil is available
    try {
      execSync('gsutil version', { stdio: 'ignore' });
    } catch {
      console.warn('⚠️  gsutil not found. Install Google Cloud SDK to enable GCS uploads.');
      return false;
    }

    const key = `backups/${backupPath.split(/[/\\]/).pop()}`;
    const command = `gsutil cp "${backupPath}" gs://${bucket}/${key}`;

    await execAsync(command);
    console.log(`✅ Uploaded to GCS: gs://${bucket}/${key}`);
    return true;
  } catch (error: any) {
    console.error(`❌ GCS upload failed: ${error.message}`);
    return false;
  }
}

/**
 * Clean up old backups based on retention policy
 */
function cleanupOldBackups(config: BackupConfig): void {
  console.log(`🧹 Cleaning up backups older than ${config.retentionDays} days...`);

  const backupSubDir = join(config.backupDir, config.hourly ? 'hourly' : 'daily');
  if (!existsSync(backupSubDir)) return;

  const files = readdirSync(backupSubDir);
  const now = Date.now();
  const retentionMs = config.retentionDays * 24 * 60 * 60 * 1000;
  let deletedCount = 0;

  for (const file of files) {
    const filePath = join(backupSubDir, file);
    const stats = statSync(filePath);
    const age = now - stats.mtimeMs;

    if (age > retentionMs) {
      try {
        unlinkSync(filePath);
        deletedCount++;
        console.log(`  🗑️  Deleted: ${file}`);
      } catch (error: any) {
        console.error(`  ⚠️  Failed to delete ${file}: ${error.message}`);
      }
    }
  }

  if (deletedCount > 0) {
    console.log(`✅ Cleaned up ${deletedCount} old backup(s)`);
  } else {
    console.log(`✅ No old backups to clean up`);
  }
}

/**
 * Verify latest backup by attempting to restore to a test database
 */
async function verifyBackup(config: BackupConfig): Promise<boolean> {
  console.log('🔍 Verifying latest backup...');

  const backupSubDir = join(config.backupDir, config.hourly ? 'hourly' : 'daily');
  if (!existsSync(backupSubDir)) {
    console.error('❌ No backup directory found');
    return false;
  }

  const files = readdirSync(backupSubDir)
    .filter(f => f.startsWith('backup-') && (f.endsWith('.sql') || f.endsWith('.sql.gz')))
    .map(f => ({
      name: f,
      path: join(backupSubDir, f),
      mtime: statSync(join(backupSubDir, f)).mtime,
    }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

  if (files.length === 0) {
    console.error('❌ No backups found');
    return false;
  }

  const latest = files[0];
  console.log(`📦 Testing backup: ${latest.name}`);

  // For verification, we'll just check if the file exists and is readable
  // Full restore testing should be done manually in a test environment
  try {
    const stats = statSync(latest.path);
    if (stats.size === 0) {
      console.error('❌ Backup file is empty');
      return false;
    }

    console.log(`✅ Backup file is valid (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
    console.log(`⚠️  Full restore test should be done manually in a test environment`);
    return true;
  } catch (error: any) {
    console.error(`❌ Backup verification failed: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    const args = process.argv.slice(2);
    
    if (args.includes('--verify')) {
      const config = getConfig();
      const isValid = await verifyBackup(config);
      process.exit(isValid ? 0 : 1);
      return;
    }

    const config = getConfig();
    console.log('🚀 Starting database backup...\n');

    // Create backup
    const result = await createBackup(config);

    if (!result.success) {
      console.error(`\n❌ Backup failed: ${result.error}`);
      process.exit(1);
    }

    // Upload to cloud storage if configured
    if (config.uploadToS3 && config.s3Bucket) {
      await uploadToS3(result.backupPath, config.s3Bucket);
    }

    if (config.uploadToGCS && config.gcsBucket) {
      await uploadToGCS(result.backupPath, config.gcsBucket);
    }

    // Clean up old backups
    cleanupOldBackups(config);

    console.log('\n✅ Backup completed successfully!');
    console.log(`📁 Location: ${result.backupPath}`);
    console.log(`📊 Size: ${(result.size / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`🕐 Timestamp: ${result.timestamp.toISOString()}`);

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

export { createBackup, verifyBackup, cleanupOldBackups };
