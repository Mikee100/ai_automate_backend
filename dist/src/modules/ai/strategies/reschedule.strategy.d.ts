import { ResponseStrategy } from './response-strategy.interface';
export declare class RescheduleStrategy implements ResponseStrategy {
    readonly priority = 20;
    private readonly STUDIO_TIMEZONE;
    canHandle(intent: string, context: any): boolean;
    generateResponse(message: string, context: any): Promise<any>;
}
