export interface ResponseStrategy {
    canHandle(intent: string, context: any): boolean;
    generateResponse(message: string, context: any): Promise<any>;
}
