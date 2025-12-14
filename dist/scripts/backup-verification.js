#!/usr/bin/env ts-node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyBackupFile = verifyBackupFile;
exports.testRestore = testRestore;
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
    const testRestore = args.includes('--test-restore');
    const fileArg = args.find(arg => arg.startsWith('--file='));
    const backupFile = fileArg ? fileArg.split('=')[1] : undefined;
    const backupDir = process.env.BACKUP_DIR || (0, path_1.join)(process.cwd(), 'backups');
    const testDatabaseName = process.env.TEST_DATABASE_NAME || 'backup_test_restore';
    return {
        databaseUrl,
        backupDir,
        backupFile,
        testRestore,
        testDatabaseName,
    };
}
function findLatestBackup(backupDir) {
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
        return null;
    }
    allBackups.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
    return allBackups[0].path;
}
async function verifyBackupFile(backupFile) {
    console.log(`🔍 Verifying backup file: ${backupFile}\n`);
    if (!(0, fs_1.existsSync)(backupFile)) {
        return {
            valid: false,
            size: 0,
            compressed: false,
            error: 'File not found',
        };
    }
    const stats = (0, fs_1.statSync)(backupFile);
    const isCompressed = backupFile.endsWith('.gz');
    if (stats.size === 0) {
        return {
            valid: false,
            size: 0,
            compressed: isCompressed,
            error: 'File is empty',
        };
    }
    if (isCompressed) {
        try {
            (0, child_process_1.execSync)(`gunzip -t "${backupFile}"`, { stdio: 'ignore' });
        }
        catch {
            return {
                valid: false,
                size: stats.size,
                compressed: true,
                error: 'Compressed file is corrupted',
            };
        }
    }
    if (!isCompressed) {
        try {
            const head = (0, child_process_1.execSync)(`head -n 20 "${backupFile}"`, { encoding: 'utf-8' });
            if (!head.includes('PostgreSQL database dump')) {
                return {
                    valid: false,
                    size: stats.size,
                    compressed: false,
                    error: 'File does not appear to be a valid PostgreSQL dump',
                };
            }
        }
        catch {
        }
    }
    return {
        valid: true,
        size: stats.size,
        compressed: isCompressed,
    };
}
async function testRestore(backupFile, dbInfo, testDatabaseName) {
    console.log(`\n🧪 Testing restore to temporary database: ${testDatabaseName}\n`);
    const env = {
        ...process.env,
        PGPASSWORD: dbInfo.password,
    };
    try {
        console.log('1️⃣  Creating test database...');
        await execAsync(`psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d postgres -c "DROP DATABASE IF EXISTS ${testDatabaseName};"`, { env });
        await execAsync(`psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d postgres -c "CREATE DATABASE ${testDatabaseName};"`, { env });
        console.log('2️⃣  Restoring backup...');
        const isCompressed = backupFile.endsWith('.gz');
        let restoreCommand;
        if (isCompressed) {
            restoreCommand = `gunzip -c "${backupFile}" | psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d ${testDatabaseName}`;
        }
        else {
            restoreCommand = `psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d ${testDatabaseName} < "${backupFile}"`;
        }
        await execAsync(restoreCommand, {
            env,
            shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh'
        });
        console.log('3️⃣  Verifying restore...');
        const tableCount = await execAsync(`psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d ${testDatabaseName} -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"`, { env, encoding: 'utf-8' });
        const count = parseInt(tableCount.stdout.trim(), 10);
        console.log(`   Found ${count} tables in restored database`);
        if (count === 0) {
            console.log('⚠️  Warning: No tables found in restored database');
        }
        console.log('4️⃣  Cleaning up test database...');
        await execAsync(`psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d postgres -c "DROP DATABASE ${testDatabaseName};"`, { env });
        console.log('\n✅ Restore test completed successfully!');
        return true;
    }
    catch (error) {
        console.error(`\n❌ Restore test failed: ${error.message}`);
        try {
            await execAsync(`psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.user} -d postgres -c "DROP DATABASE IF EXISTS ${testDatabaseName};"`, { env: { ...process.env, PGPASSWORD: dbInfo.password } });
        }
        catch {
        }
        return false;
    }
}
async function main() {
    try {
        const config = getConfig();
        const dbInfo = parseDatabaseUrl(config.databaseUrl);
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
        const verification = await verifyBackupFile(backupFile);
        if (!verification.valid) {
            console.error(`\n❌ Backup verification failed: ${verification.error}`);
            process.exit(1);
        }
        console.log(`✅ File integrity check passed`);
        console.log(`   Size: ${(verification.size / (1024 * 1024)).toFixed(2)} MB`);
        console.log(`   Compressed: ${verification.compressed ? 'Yes' : 'No'}`);
        if (config.testRestore) {
            const restoreSuccess = await testRestore(backupFile, dbInfo, config.testDatabaseName);
            if (!restoreSuccess) {
                process.exit(1);
            }
        }
        else {
            console.log('\n💡 Tip: Use --test-restore to test restoring to a temporary database');
        }
        console.log('\n✅ Backup verification completed successfully!');
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
//# sourceMappingURL=backup-verification.js.map