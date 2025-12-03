import { ResponseStrategy } from './response-strategy.interface';
export declare class PackageInquiryStrategy implements ResponseStrategy {
    canHandle(intent: string, context: any): boolean;
    generateResponse(message: string, context: any): Promise<any>;
}
