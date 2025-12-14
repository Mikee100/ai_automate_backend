#!/usr/bin/env ts-node
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
declare function createBackup(config: BackupConfig): Promise<BackupResult>;
declare function cleanupOldBackups(config: BackupConfig): void;
declare function verifyBackup(config: BackupConfig): Promise<boolean>;
export { createBackup, verifyBackup, cleanupOldBackups };
