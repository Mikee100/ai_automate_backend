/**
 * Tone profiles for the Response Humanizer.
 * Phase 1: code-based config. Phase 2: DB + admin UI when scaling.
 */

export enum ToneProfile {
  WARM_PROFESSIONAL = 'WARM_PROFESSIONAL',
  FRIENDLY_CASUAL = 'FRIENDLY_CASUAL',
  LUXURY_PREMIUM = 'LUXURY_PREMIUM',
  CLINICAL_FORMAL = 'CLINICAL_FORMAL',
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

export const TONE_PROFILES: Record<ToneProfile, ToneProfileConfig> = {
  [ToneProfile.WARM_PROFESSIONAL]: {
    emojiFrequency: 'low',
    emojiTypes: ['💛', '✨', '📸', '😊', '🤍'],
    sentenceLength: 'short',
    formality: 'low',
    energy: 'warm',
    style: 'conversational',
  },
  [ToneProfile.FRIENDLY_CASUAL]: {
    emojiFrequency: 'medium',
    emojiTypes: ['😊', '💛', '✨', '👍', '🤗'],
    sentenceLength: 'short',
    formality: 'low',
    energy: 'enthusiastic',
    style: 'conversational',
  },
  [ToneProfile.LUXURY_PREMIUM]: {
    emojiFrequency: 'low',
    emojiTypes: ['✨', '🤍', '💎'],
    sentenceLength: 'medium',
    formality: 'medium',
    energy: 'calm',
    style: 'premium',
  },
  [ToneProfile.CLINICAL_FORMAL]: {
    emojiFrequency: 'none',
    emojiTypes: [],
    sentenceLength: 'medium',
    formality: 'high',
    energy: 'calm',
    style: 'formal',
  },
};

/** Default brand tone for Fiesta AI */
export const DEFAULT_BRAND_TONE = ToneProfile.WARM_PROFESSIONAL;
