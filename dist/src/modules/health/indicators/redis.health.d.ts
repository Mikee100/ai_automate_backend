import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
export declare class RedisHealthIndicator extends HealthIndicator {
    private configService;
    private redisUrl;
    constructor(configService: ConfigService);
    isHealthy(key: string): Promise<HealthIndicatorResult>;
}
