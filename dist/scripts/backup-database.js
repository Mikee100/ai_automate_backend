#!/usr/bin/env ts-node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBackup = createBackup;
exports.verifyBackup = verifyBackup;
exports.cleanupOldBackups = cleanupOldBackups;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
const util_1 = require("util");
const child_process_2 = require("child_process");
const execAsync = (0, util_1.promisify)(child_process_2.exec);
function parseDatabaseUrl(url) {
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
function getConfig() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error('DATABASE_URL environment variable is required');
    }
    const args = process.argv.slice(2);
    const hourly = args.includes('--hourly');
    const full = args.includes('--full');
    const verify = args.includes('--verify');
    const backupDir = process.env.BACKUP_DIR || (0, path_1.join)(process.cwd(), 'backups');
    const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10);
    if (!(0, fs_1.existsSync)(backupDir)) {
        (0, fs_1.mkdirSync)(backupDir, { recursive: true });
    }
    const dailyDir = (0, path_1.join)(backupDir, 'daily');
    const hourlyDir = (0, path_1.join)(backupDir, 'hourly');
    if (!(0, fs_1.existsSync)(dailyDir))
        (0, fs_1.mkdirSync)(dailyDir, { recursive: true });
    if (!(0, fs_1.existsSync)(hourlyDir))
        (0, fs_1.mkdirSync)(hourlyDir, { recursive: true });
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
async function createBackup(config) {
    const dbInfo = parseDatabaseUrl(config.databaseUrl);
    const timestamp = new Date();
    const dateStr = timestamp.toISOString().replace(/[:.]/g, '-').split('T')[0];
    const timeStr = timestamp.toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0];
    const backupType = config.hourly ? 'hourly' : 'daily';
    const backupSubDir = (0, path_1.join)(config.backupDir, backupType);
    const filename = `backup-${dateStr}-${timeStr}.sql${config.compression ? '.gz' : ''}`;
    const backupPath = (0, path_1.join)(backupSubDir, filename);
    console.log(`📦 Creating ${backupType} backup: ${filename}`);
    try {
        const env = {
            ...process.env,
            PGPASSWORD: dbInfo.password,
        };
        let dumpCommand = `pg_dump -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d ${dbInfo.database}`;
        if (config.compression) {
            dumpCommand += ' | gzip';
        }
        dumpCommand += ` > "${backupPath}"`;
        await execAsync(dumpCommand, {
            env,
            shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh'
        });
        const stats = (0, fs_1.statSync)(backupPath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`✅ Backup created successfully: ${sizeMB} MB`);
        return {
            success: true,
            backupPath,
            size: stats.size,
            timestamp,
        };
    }
    catch (error) {
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
async function uploadToS3(backupPath, bucket) {
    try {
        console.log(`☁️  Uploading to S3: ${bucket}`);
        try {
            (0, child_process_1.execSync)('aws --version', { stdio: 'ignore' });
        }
        catch {
            console.warn('⚠️  AWS CLI not found. Install it to enable S3 uploads.');
            return false;
        }
        const key = `backups/${backupPath.split(/[/\\]/).pop()}`;
        const command = `aws s3 cp "${backupPath}" s3://${bucket}/${key}`;
        await execAsync(command);
        console.log(`✅ Uploaded to S3: s3://${bucket}/${key}`);
        return true;
    }
    catch (error) {
        console.error(`❌ S3 upload failed: ${error.message}`);
        return false;
    }
}
async function uploadToGCS(backupPath, bucket) {
    try {
        console.log(`☁️  Uploading to GCS: ${bucket}`);
        try {
            (0, child_process_1.execSync)('gsutil version', { stdio: 'ignore' });
        }
        catch {
            console.warn('⚠️  gsutil not found. Install Google Cloud SDK to enable GCS uploads.');
            return false;
        }
        const key = `backups/${backupPath.split(/[/\\]/).pop()}`;
        const command = `gsutil cp "${backupPath}" gs://${bucket}/${key}`;
        await execAsync(command);
        console.log(`✅ Uploaded to GCS: gs://${bucket}/${key}`);
        return true;
    }
    catch (error) {
        console.error(`❌ GCS upload failed: ${error.message}`);
        return false;
    }
}
function cleanupOldBackups(config) {
    console.log(`🧹 Cleaning up backups older than ${config.retentionDays} days...`);
    const backupSubDir = (0, path_1.join)(config.backupDir, config.hourly ? 'hourly' : 'daily');
    if (!(0, fs_1.existsSync)(backupSubDir))
        return;
    const files = (0, fs_1.readdirSync)(backupSubDir);
    const now = Date.now();
    const retentionMs = config.retentionDays * 24 * 60 * 60 * 1000;
    let deletedCount = 0;
    for (const file of files) {
        const filePath = (0, path_1.join)(backupSubDir, file);
        const stats = (0, fs_1.statSync)(filePath);
        const age = now - stats.mtimeMs;
        if (age > retentionMs) {
            try {
                (0, fs_1.unlinkSync)(filePath);
                deletedCount++;
                console.log(`  🗑️  Deleted: ${file}`);
            }
            catch (error) {
                console.error(`  ⚠️  Failed to delete ${file}: ${error.message}`);
            }
        }
    }
    if (deletedCount > 0) {
        console.log(`✅ Cleaned up ${deletedCount} old backup(s)`);
    }
    else {
        console.log(`✅ No old backups to clean up`);
    }
}
async function verifyBackup(config) {
    console.log('🔍 Verifying latest backup...');
    const backupSubDir = (0, path_1.join)(config.backupDir, config.hourly ? 'hourly' : 'daily');
    if (!(0, fs_1.existsSync)(backupSubDir)) {
        console.error('❌ No backup directory found');
        return false;
    }
    const files = (0, fs_1.readdirSync)(backupSubDir)
        .filter(f => f.startsWith('backup-') && (f.endsWith('.sql') || f.endsWith('.sql.gz')))
        .map(f => ({
        name: f,
        path: (0, path_1.join)(backupSubDir, f),
        mtime: (0, fs_1.statSync)((0, path_1.join)(backupSubDir, f)).mtime,
    }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
    if (files.length === 0) {
        console.error('❌ No backups found');
        return false;
    }
    const latest = files[0];
    console.log(`📦 Testing backup: ${latest.name}`);
    try {
        const stats = (0, fs_1.statSync)(latest.path);
        if (stats.size === 0) {
            console.error('❌ Backup file is empty');
            return false;
        }
        console.log(`✅ Backup file is valid (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
        console.log(`⚠️  Full restore test should be done manually in a test environment`);
        return true;
    }
    catch (error) {
        console.error(`❌ Backup verification failed: ${error.message}`);
        return false;
    }
}
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
        const result = await createBackup(config);
        if (!result.success) {
            console.error(`\n❌ Backup failed: ${result.error}`);
            process.exit(1);
        }
        if (config.uploadToS3 && config.s3Bucket) {
            await uploadToS3(result.backupPath, config.s3Bucket);
        }
        if (config.uploadToGCS && config.gcsBucket) {
            await uploadToGCS(result.backupPath, config.gcsBucket);
        }
        cleanupOldBackups(config);
        console.log('\n✅ Backup completed successfully!');
        console.log(`📁 Location: ${result.backupPath}`);
        console.log(`📊 Size: ${(result.size / (1024 * 1024)).toFixed(2)} MB`);
        console.log(`🕐 Timestamp: ${result.timestamp.toISOString()}`);
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
//# sourceMappingURL=backup-database.js.map