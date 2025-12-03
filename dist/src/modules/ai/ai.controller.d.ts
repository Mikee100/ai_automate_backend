import { AiService } from './ai.service';
import { BookingsService } from '../bookings/bookings.service';
export declare class AiController {
    private readonly aiService;
    private readonly bookingsService;
    constructor(aiService: AiService, bookingsService: BookingsService);
    answerFaq(body: {
        question: string;
    }): Promise<{
        text: string;
        mediaUrls: string[];
    }>;
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
    }): Promise<any>;
}
