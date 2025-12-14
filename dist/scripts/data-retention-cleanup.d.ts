#!/usr/bin/env ts-node
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
declare function getConfig(): RetentionConfig;
declare function runCleanup(config: RetentionConfig): Promise<CleanupStats>;
export { runCleanup, getConfig };
