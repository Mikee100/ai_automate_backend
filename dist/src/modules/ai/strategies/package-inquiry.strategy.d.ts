import { ResponseStrategy } from './response-strategy.interface';
export declare class PackageInquiryStrategy implements ResponseStrategy {
    readonly priority = 60;
    private findRecentPackageFromHistory;
    canHandle(intent: string, context: any): boolean;
    generateResponse(message: string, context: any): Promise<any>;
}
