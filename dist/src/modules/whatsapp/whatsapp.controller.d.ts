import { WhatsappService } from './whatsapp.service';
export declare class WhatsappController {
    private readonly whatsappService;
    constructor(whatsappService: WhatsappService);
    getMessages(customerId?: string): Promise<{
        messages: {
            id: string;
            from: string;
            to: string;
            content: string;
            timestamp: string;
            direction: string;
            customerId: string;
            customerName: string;
        }[];
        total: number;
    }>;
    getConversations(): Promise<{
        conversations: unknown[];
        total: number;
    }>;
    getSettings(): Promise<{
        phoneNumberId: string;
        accessToken: string;
        verifyToken: string;
        webhookUrl: any;
        apiVersion: string;
        baseUrl: string;
    }>;
    updateSettings(settings: any): Promise<{
        success: boolean;
    }>;
    testConnection(): Promise<{
        success: boolean;
        message: string;
        phoneNumber: any;
        verifiedName: any;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        phoneNumber?: undefined;
        verifiedName?: undefined;
    }>;
    sendMessage(data: {
        to: string;
        message: string;
    }): Promise<any>;
    getStats(): Promise<{
        totalMessages: number;
        inboundMessages: number;
        outboundMessages: number;
        totalConversations: number;
        activeConversations: number;
    }>;
}
