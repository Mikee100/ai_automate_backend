import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
export declare class CustomDiskHealthIndicator extends HealthIndicator {
    checkStorage(key: string, options: {
        path: string;
        thresholdPercent: number;
    }): Promise<HealthIndicatorResult>;
}
