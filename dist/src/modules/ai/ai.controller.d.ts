import { AiService } from './ai.service';
import { BookingsService } from '../bookings/bookings.service';
export declare class AiController {
    private readonly aiService;
    private readonly bookingsService;
    constructor(aiService: AiService, bookingsService: BookingsService);
    answerFaq(body: {
        question: string;
    }): Promise<string>;
    addKnowledge(body: {
        question: string;
        answer: string;
    }): Promise<void>;
    handleConversation(body: {
        message: string;
        customerId: string;
        history?: {
            role: 'user' | 'assistant';
            content: string;
        }[];
    }): Promise<{
        response: string;
        draft: {
            id: string;
            name: string | null;
            createdAt: Date;
            updatedAt: Date;
            customerId: string;
            service: string | null;
            date: string | null;
            time: string | null;
            dateTimeIso: string | null;
            recipientName: string | null;
            recipientPhone: string | null;
            isForSomeoneElse: boolean | null;
            step: string;
            version: number;
        };
        updatedHistory: {
            role: string;
            content: any;
        }[];
    }>;
}
