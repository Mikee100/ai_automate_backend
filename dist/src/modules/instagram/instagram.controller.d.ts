import { InstagramService } from './instagram.service';
export declare class InstagramController {
    private readonly instagramService;
    constructor(instagramService: InstagramService);
    getSettings(): Promise<{
        businessAccountId: string;
        accessToken: string;
        verifyToken: any;
        webhookUrl: any;
    }>;
    updateSettings(settings: any): Promise<{
        success: boolean;
    }>;
    testConnection(): Promise<{
        success: boolean;
        message: string;
    }>;
    canSendMessage(instagramId: string): Promise<{
        allowed: boolean;
        reason?: string;
        lastMessageAt?: Date;
        hoursRemaining?: number;
    }>;
    sendMessage(body: {
        to: string;
        message: string;
    }): Promise<any>;
    getMessages(page?: string, limit?: string, direction?: string, customerId?: string): Promise<{
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
}
