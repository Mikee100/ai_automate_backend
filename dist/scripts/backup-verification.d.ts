#!/usr/bin/env ts-node
declare function parseDatabaseUrl(url: string): {
    host: string;
    port: string;
    database: string;
    user: string;
    password: string;
};
declare function verifyBackupFile(backupFile: string): Promise<{
    valid: boolean;
    size: number;
    compressed: boolean;
    error?: string;
}>;
declare function testRestore(backupFile: string, dbInfo: ReturnType<typeof parseDatabaseUrl>, testDatabaseName: string): Promise<boolean>;
export { verifyBackupFile, testRestore };
