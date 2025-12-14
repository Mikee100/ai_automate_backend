#!/usr/bin/env ts-node
interface RestoreConfig {
    databaseUrl: string;
    backupDir: string;
    backupFile?: string;
    dryRun: boolean;
}
declare function restoreDatabase(config: RestoreConfig): Promise<void>;
export { restoreDatabase };
