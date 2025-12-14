import { HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus';
import { DatabaseHealthIndicator } from './indicators/database.health';
import { RedisHealthIndicator } from './indicators/redis.health';
import { ExternalServicesHealthIndicator } from './indicators/external-services.health';
import { CustomDiskHealthIndicator } from './indicators/disk.health';
export declare class HealthController {
    private health;
    private memory;
    private customDisk;
    private database;
    private redis;
    private externalServices;
    constructor(health: HealthCheckService, memory: MemoryHealthIndicator, customDisk: CustomDiskHealthIndicator, database: DatabaseHealthIndicator, redis: RedisHealthIndicator, externalServices: ExternalServicesHealthIndicator);
    check(): Promise<import("@nestjs/terminus").HealthCheckResult>;
    detailed(): Promise<import("@nestjs/terminus").HealthCheckResult>;
    checkDatabase(): Promise<import("@nestjs/terminus").HealthCheckResult>;
    checkRedis(): Promise<import("@nestjs/terminus").HealthCheckResult>;
    checkExternal(): Promise<import("@nestjs/terminus").HealthCheckResult>;
    checkSystem(): Promise<import("@nestjs/terminus").HealthCheckResult>;
}
