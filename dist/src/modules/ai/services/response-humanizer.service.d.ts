import { ToneProfile } from '../config/tones';
import { PipelineStep } from '../config/pipelines';
export interface HumanizerIntent {
    primaryIntent?: string;
    emotionalTone?: string;
    requiresHumanHandoff?: boolean;
}
export interface HumanizerCustomerProfile {
    formalityLevel?: 'low' | 'medium' | 'high';
    emojiTolerance?: 'low' | 'medium' | 'high';
    verbosity?: 'brief' | 'normal' | 'detailed';
}
export interface HumanizerContext {
    intent?: HumanizerIntent;
    emotionalTone?: string;
    urgency?: string;
    platform?: 'whatsapp' | 'instagram' | 'messenger';
    brandTone?: ToneProfile | string;
    isFirstMessage?: boolean;
    isEscalation?: boolean;
    isBookingFlow?: boolean;
    lastAiResponses?: string[];
    pipeline?: PipelineStep[];
    customerProfile?: HumanizerCustomerProfile;
    userState?: 'new' | 'returning' | 'booking' | 'payment' | 'general';
}
export declare class ResponseHumanizerService {
    private readonly logger;
    humanizeResponse(rawText: string, context: HumanizerContext): string;
    applyNaturalness(text: string, context: HumanizerContext): string;
    private stripBlockedPhrases;
    private replaceTheatrical;
    private replaceTemplateStructured;
    private simplifyGreeting;
    softenTone(text: string): string;
    chunkForReadability(text: string): string;
    mirrorEmotion(text: string, emotionalTone?: string, intent?: string): string;
    injectEmoji(text: string, context: HumanizerContext): string;
    private detectEmojiContext;
    applyVariation(text: string, context: HumanizerContext): string;
    private shouldAddOpener;
    private shouldAddCloser;
    private pickRandom;
}
