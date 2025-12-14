import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
export declare class ExternalServicesHealthIndicator extends HealthIndicator {
    private httpService;
    private configService;
    constructor(httpService: HttpService, configService: ConfigService);
    checkWhatsApp(key: string): Promise<HealthIndicatorResult>;
    checkOpenAI(key: string): Promise<HealthIndicatorResult>;
    checkGoogleCalendar(key: string): Promise<HealthIndicatorResult>;
}
