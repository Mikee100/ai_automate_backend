import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
export declare class AiService {
    private configService;
    private prisma;
    private aiQueue;
    private openai;
    private pinecone;
    private index;
    constructor(configService: ConfigService, prisma: PrismaService, aiQueue: Queue);
    generateEmbedding(text: string): Promise<number[]>;
    retrieveRelevantDocs(query: string, topK?: number): Promise<any[]>;
    answerFaq(question: string, history?: {
        role: 'user' | 'assistant';
        content: string;
    }[]): Promise<string>;
    extractBookingDetails(message: string, history?: {
        role: 'user' | 'assistant';
        content: string;
    }[]): Promise<{
        service?: string;
        date?: string;
        time?: string;
        name?: string;
        subIntent: 'start' | 'provide' | 'confirm' | 'cancel' | 'unknown';
    }>;
    private generateBookingResponse;
    addKnowledge(question: string, answer: string): Promise<void>;
    processAiRequest(data: {
        question: string;
    }): Promise<string>;
    private getOrCreateDraft;
    private updateDraft;
    private completeBooking;
    private classifyIntent;
    handleConversation(message: string, customerId: string, history: {
        role: 'user' | 'assistant';
        content: string;
    }[], bookingsService: any): Promise<{
        response: string;
        updatedHistory: {
            role: 'user' | 'assistant';
            content: string;
        }[];
        draft?: any;
    }>;
    generateResponse(message: string, customerId: string, bookingsService: any, history?: any[], extractedBooking?: any, faqContext?: string): Promise<string>;
    extractStepBasedBookingDetails(message: string, currentStep: string, history?: any[]): Promise<any>;
    generateStepBasedBookingResponse(message: string, customerId: string, bookingsService: any, history: any[], draft: any, bookingResult: any): Promise<string>;
    generateGeneralResponse(message: string, customerId: string, bookingsService: any, history?: any[]): Promise<string>;
}
