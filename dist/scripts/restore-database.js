#!/usr/bin/env ts-node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreDatabase = restoreDatabase;
const fs_1 = require("fs");
const path_1 = require("path");
const util_1 = require("util");
const child_process_1 = require("child_process");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
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
    const dryRun = args.includes('--dry-run');
    const latest = args.includes('--latest');
    const dateArg = args.find(arg => arg.startsWith('--date='));
    const date = dateArg ? dateArg.split('=')[1] : null;
    const backupDir = process.env.BACKUP_DIR || (0, path_1.join)(process.cwd(), 'backups');
    let backupFile;
    if (latest) {
        const dailyDir = (0, path_1.join)(backupDir, 'daily');
        const hourlyDir = (0, path_1.join)(backupDir, 'hourly');
        const allBackups = [];
        [dailyDir, hourlyDir].forEach(dir => {
            if ((0, fs_1.existsSync)(dir)) {
                (0, fs_1.readdirSync)(dir)
                    .filter(f => f.startsWith('backup-') && (f.endsWith('.sql') || f.endsWith('.sql.gz')))
                    .forEach(f => {
                    const filePath = (0, path_1.join)(dir, f);
                    allBackups.push({
                        path: filePath,
                        mtime: (0, fs_1.statSync)(filePath).mtime,
                    });
                });
            }
        });
        if (allBackups.length === 0) {
            throw new Error('No backups found');
        }
        allBackups.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
        backupFile = allBackups[0].path;
    }
    else if (date) {
        const dailyDir = (0, path_1.join)(backupDir, 'daily');
        const hourlyDir = (0, path_1.join)(backupDir, 'hourly');
        const dateStr = date.replace(/-/g, '-');
        let foundBackup = null;
        [dailyDir, hourlyDir].forEach(dir => {
            if ((0, fs_1.existsSync)(dir)) {
                const files = (0, fs_1.readdirSync)(dir).filter(f => f.startsWith(`backup-${dateStr}`) && (f.endsWith('.sql') || f.endsWith('.sql.gz')));
                if (files.length > 0) {
                    const backups = files.map(f => ({
                        name: f,
                        path: (0, path_1.join)(dir, f),
                        mtime: (0, fs_1.statSync)((0, path_1.join)(dir, f)).mtime,
                    })).sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
                    foundBackup = backups[0].path;
                }
            }
        });
        if (!foundBackup) {
            throw new Error(`No backup found for date: ${date}`);
        }
        backupFile = foundBackup;
    }
    else {
        const fileArg = args.find(arg => !arg.startsWith('--'));
        if (!fileArg) {
            throw new Error('Please provide a backup file path, or use --latest or --date=YYYY-MM-DD');
        }
        backupFile = fileArg;
    }
    if (!backupFile || !(0, fs_1.existsSync)(backupFile)) {
        throw new Error(`Backup file not found: ${backupFile}`);
    }
    return {
        databaseUrl,
        backupDir,
        backupFile,
        dryRun,
    };
}
async function restoreDatabase(config) {
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
    console.log('\n⚠️  WARNING: This will DROP and recreate the database!');
    console.log('⚠️  All current data will be lost!\n');
    try {
        console.log('1️⃣  Terminating existing connections...');
        const terminateConnections = `
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = '${dbInfo.database}' AND pid <> pg_backend_pid();
    `;
        await execAsync(`psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d postgres -c "${terminateConnections}"`, { env });
        console.log('2️⃣  Dropping database...');
        await execAsync(`psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d postgres -c "DROP DATABASE IF EXISTS ${dbInfo.database};"`, { env });
        console.log('3️⃣  Creating database...');
        await execAsync(`psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d postgres -c "CREATE DATABASE ${dbInfo.database};"`, { env });
        console.log('4️⃣  Restoring from backup...');
        const isCompressed = config.backupFile.endsWith('.gz');
        let restoreCommand;
        if (isCompressed) {
            restoreCommand = `gunzip -c "${config.backupFile}" | psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d ${dbInfo.database}`;
        }
        else {
            restoreCommand = `psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d ${dbInfo.database} < "${config.backupFile}"`;
        }
        await execAsync(restoreCommand, {
            env,
            shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh'
        });
        console.log('\n✅ Database restored successfully!');
        console.log(`📊 Backup file: ${config.backupFile}`);
        console.log(`🗄️  Database: ${dbInfo.database}`);
    }
    catch (error) {
        console.error(`\n❌ Restore failed: ${error.message}`);
        throw error;
    }
}
async function main() {
    try {
        const config = getConfig();
        await restoreDatabase(config);
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
//# sourceMappingURL=restore-database.js.map