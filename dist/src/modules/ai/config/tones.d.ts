export declare enum ToneProfile {
    WARM_PROFESSIONAL = "WARM_PROFESSIONAL",
    FRIENDLY_CASUAL = "FRIENDLY_CASUAL",
    LUXURY_PREMIUM = "LUXURY_PREMIUM",
    CLINICAL_FORMAL = "CLINICAL_FORMAL"
}
export type EmojiFrequency = 'none' | 'low' | 'medium' | 'high';
export type SentenceLength = 'short' | 'medium' | 'long';
export type Formality = 'low' | 'medium' | 'high';
export type Energy = 'calm' | 'warm' | 'enthusiastic';
export type Style = 'conversational' | 'professional' | 'premium' | 'formal';
export interface ToneProfileConfig {
    emojiFrequency: EmojiFrequency;
    emojiTypes: string[];
    sentenceLength: SentenceLength;
    formality: Formality;
    energy: Energy;
    style: Style;
}
export declare const TONE_PROFILES: Record<ToneProfile, ToneProfileConfig>;
export declare const DEFAULT_BRAND_TONE = ToneProfile.WARM_PROFESSIONAL;
