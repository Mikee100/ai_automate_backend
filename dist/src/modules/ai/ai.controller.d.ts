import { AiService } from './ai.service';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    answerFaq(body: {
        question: string;
    }): Promise<string>;
    addKnowledge(body: {
        question: string;
        answer: string;
    }): Promise<void>;
}
