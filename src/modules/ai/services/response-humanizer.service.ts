// backend/src/modules/ai/services/response-humanizer.service.ts
import { Injectable, Logger } from '@nestjs/common';
import {
  ToneProfile,
  TONE_PROFILES,
  DEFAULT_BRAND_TONE,
} from '../config/tones';
import {
  EmojiContext,
  EMOJI_CONTEXT_MAP,
  MAX_EMOJIS_PER_MESSAGE,
} from '../config/emoji';
import {
  WARM_OPENERS,
  WARM_CLOSERS,
  CASUAL_OPENERS,
  NEUTRAL_OPENERS,
  SOFT_CLOSERS,
  SKIP_OPENERS_CLOSERS_INTENTS,
  TONE_SOFTENING_RULES,
} from '../config/phrases';
import { DEFAULT_PIPELINE, PipelineStep } from '../config/pipelines';
import {
  BLOCKED_PHRASES,
  THEATRICAL_REPLACEMENTS,
  TEMPLATE_STRUCTURED_REPLACEMENTS,
  PROMOTIONAL_PATTERNS,
  GREETING_MAX_LINES,
  GREETING_SIMPLE_TEMPLATE,
  GREETING_OVERRIDE_IF_CONTAINS,
  MAX_EMOTION_LEVEL,
  INTENTS_SOFT_EMOTION_ONLY,
} from '../config/naturalness';

const MEMORY_WINDOW = 3;

/** Minimal intent shape from AdvancedIntentService (no direct dependency) */
export interface HumanizerIntent {
  primaryIntent?: string;
  emotionalTone?: string;
  requiresHumanHandoff?: boolean;
}

/** Customer profile for style shaping (from CustomerMemory / personalization). */
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
  /** Per-brand pipeline override; default is DEFAULT_PIPELINE */
  pipeline?: PipelineStep[];
  /** From CustomerMemory / personalization — shapes opener pool, emoji count, rhythm */
  customerProfile?: HumanizerCustomerProfile;
  /** new | returning | booking | payment — affects opener/closer choice */
  userState?: 'new' | 'returning' | 'booking' | 'payment' | 'general';
}

@Injectable()
export class ResponseHumanizerService {
  private readonly logger = new Logger(ResponseHumanizerService.name);

  /**
   * Main entry: run humanization pipeline (SOFTEN → CHUNK → EMOTION → EMOJI → VARIATION).
   * Stateless; all context passed in.
   */
  humanizeResponse(rawText: string, context: HumanizerContext): string {
    if (!rawText?.trim()) return rawText;

    const pipeline = context.pipeline ?? DEFAULT_PIPELINE;
    let text = rawText.trim();

    for (const step of pipeline) {
      switch (step) {
        case 'NATURALNESS':
          text = this.applyNaturalness(text, context);
          break;
        case 'SOFTEN':
          text = this.softenTone(text);
          break;
        case 'CHUNK':
          text = this.chunkForReadability(text);
          break;
        case 'EMOTION':
          text = this.mirrorEmotion(
            text,
            context.emotionalTone ?? context.intent?.emotionalTone,
            context.intent?.primaryIntent,
          );
          break;
        case 'EMOJI':
          text = this.injectEmoji(text, context);
          break;
        case 'VARIATION':
          text = this.applyVariation(text, context);
          break;
        default:
          this.logger.warn(`Unknown pipeline step: ${step}`);
      }
    }

    return text.trim();
  }

  /** Naturalness pass: replace theatrical + template-structured wording, strip blocked phrases, simplify greetings. */
  applyNaturalness(text: string, context: HumanizerContext): string {
    let result = this.replaceTheatrical(text);
    result = this.replaceTemplateStructured(result);
    result = this.stripBlockedPhrases(result);
    const isGreeting =
      context.isFirstMessage === true ||
      (context.intent?.primaryIntent ?? '').toLowerCase() === 'greeting';
    if (isGreeting) {
      result = this.simplifyGreeting(result);
    }
    return result.trim().replace(/\n{3,}/g, '\n\n');
  }

  /** Remove or shorten blocked phrases (theatrical, fake-human). */
  private stripBlockedPhrases(text: string): string {
    let result = text;
    const lower = result.toLowerCase();
    for (const phrase of BLOCKED_PHRASES) {
      const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      result = result.replace(re, '').replace(/\s{2,}/g, ' ');
    }
    return result.trim();
  }

  /** Replace theatrical phrasing with natural, grounded alternatives. */
  private replaceTheatrical(text: string): string {
    let result = text;
    for (const { pattern, replacement } of THEATRICAL_REPLACEMENTS) {
      result = result.replace(pattern, replacement);
    }
    return result.replace(/\s{2,}/g, ' ').trim();
  }

  /** Replace template-structured (corporate/LLM-default) phrasing with natural rhythm. */
  private replaceTemplateStructured(text: string): string {
    let result = text;
    for (const { pattern, replacement } of TEMPLATE_STRUCTURED_REPLACEMENTS) {
      result = result.replace(pattern, replacement);
    }
    return result.replace(/\s{2,}/g, ' ').trim();
  }

  /** Greeting: max GREETING_MAX_LINES, strip promotional; or use simple template if long branded intro. */
  private simplifyGreeting(text: string): string {
    const lower = text.toLowerCase();
    const useSimpleTemplate = GREETING_OVERRIDE_IF_CONTAINS.some((s) => lower.includes(s));
    if (useSimpleTemplate && text.length > 80) {
      return GREETING_SIMPLE_TEMPLATE;
    }
    const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
    let content = lines.slice(0, GREETING_MAX_LINES).join('\n');
    for (const { pattern, replacement } of PROMOTIONAL_PATTERNS) {
      content = content.replace(pattern, replacement);
    }
    content = content.replace(/\s{2,}/g, ' ').trim();
    if (!content.match(/\?$/)) {
      content = content.replace(/\.\s*$/, '');
      if (content.length > 0 && !content.toLowerCase().includes('how can i help')) {
        content = content + '\nHow can I help you today?';
      }
    }
    return content || text;
  }

  /** Apply formal → conversational replacements (deterministic). */
  softenTone(text: string): string {
    let result = text;
    for (const { pattern, replacement } of TONE_SOFTENING_RULES) {
      result = result.replace(pattern, replacement);
    }
    return result;
  }

  /** Break dense text into short readable chunks (1–2 sentences per block). */
  chunkForReadability(text: string): string {
    const sentences = text
      .replace(/\n+/g, ' ')
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (sentences.length <= 2) return text;
    const chunks: string[] = [];
    for (let i = 0; i < sentences.length; i += 2) {
      chunks.push(sentences.slice(i, i + 2).join(' '));
    }
    return chunks.join('\n\n');
  }

  /** Prepend emotional mirroring phrase when tone is anxious/excited/frustrated/confused. Capped for package/FAQ (soft only). */
  mirrorEmotion(text: string, emotionalTone?: string, intent?: string): string {
    if (MAX_EMOTION_LEVEL === 'soft' && intent && INTENTS_SOFT_EMOTION_ONLY.includes(intent.toLowerCase())) {
      return text;
    }
    const tone = (emotionalTone ?? '').toLowerCase();
    const prependPhrases: Record<string, string> = {
      anxious: "No worries at all 🤍 I'll walk you through it step by step.\n\n",
      excited: "This is going to be beautiful! ✨ Let's get you booked 💛\n\n",
      frustrated: "I'm really sorry about that 😔 Let me fix this for you.\n\n",
      confused: "Let me break that down simply:\n\n",
    };
    const prependPhrase = prependPhrases[tone];
    if (prependPhrase) return prependPhrase + text;
    return text;
  }

  /** Detect emoji context from intent + keywords; add 1–2 emojis from allowed list. Respects customerProfile.emojiTolerance. */
  injectEmoji(text: string, context: HumanizerContext): string {
    const profileName = (context.brandTone ?? DEFAULT_BRAND_TONE) as ToneProfile;
    const profile = TONE_PROFILES[profileName] ?? TONE_PROFILES[ToneProfile.WARM_PROFESSIONAL];
    if (profile.emojiFrequency === 'none') return text;

    const tolerance = context.customerProfile?.emojiTolerance ?? 'medium';
    if (tolerance === 'low') return text;

    const emojiContext = this.detectEmojiContext(text, context);
    const allowed = EMOJI_CONTEXT_MAP[emojiContext];
    const filtered = allowed.filter((e) => profile.emojiTypes.includes(e) || profile.emojiTypes.length === 0);
    const pool = filtered.length ? filtered : profile.emojiTypes.slice(0, 5);
    if (pool.length === 0) return text;

    const maxByProfile = profile.emojiFrequency === 'low' ? 1 : 2;
    const maxByTolerance = tolerance === 'high' ? 2 : 1;
    const count = Math.min(MAX_EMOJIS_PER_MESSAGE, maxByProfile, maxByTolerance);
    if (count <= 0) return text;
    const toAdd = this.pickRandom(pool, count);
    if (toAdd.length === 0) return text;

    // Append at end (no mid-sentence spam)
    return text.trimEnd() + ' ' + toAdd.join('');
  }

  private detectEmojiContext(text: string, context: HumanizerContext): EmojiContext {
    const lower = text.toLowerCase();
    const intent = context.intent?.primaryIntent ?? '';

    if (context.isEscalation || intent === 'complaint') return 'ESCALATION';
    if (context.isBookingFlow && (lower.includes('confirm') || lower.includes('booked') || lower.includes('created')))
      return 'BOOKING_SUCCESS';
    if (lower.includes('payment') || lower.includes('m-pesa') || lower.includes('link') && lower.includes('sent'))
      return 'PAYMENT';
    if (lower.includes('confirm') || lower.includes('secured')) return 'CONFIRMATION';
    if (lower.includes('wait') || lower.includes('processing')) return 'WAITING';
    if (lower.includes('hi ') || lower.includes('hello') || context.isFirstMessage) return 'GREETING';
    if (lower.includes('family') || lower.includes('partner') || lower.includes('maternity') || lower.includes('baby'))
      return 'MATERNITY_FAMILY';

    return 'GENERAL_WARMTH';
  }

  /** Add opener/closer when allowed; pool by customerProfile.formalityLevel; intent-based skip; avoid repeating last MEMORY_WINDOW. */
  applyVariation(text: string, context: HumanizerContext): string {
    const intent = context.intent?.primaryIntent ?? '';
    const requiresHandoff = context.intent?.requiresHumanHandoff === true;
    const skip =
      context.isEscalation === true ||
      requiresHandoff ||
      SKIP_OPENERS_CLOSERS_INTENTS.includes(intent.toLowerCase());

    if (skip) return text;

    const formality = context.customerProfile?.formalityLevel ?? 'medium';
    const openerPool =
      formality === 'high' ? NEUTRAL_OPENERS : formality === 'low' ? [...CASUAL_OPENERS, ...WARM_OPENERS] : WARM_OPENERS;
    const closerPool =
      formality === 'high' ? SOFT_CLOSERS : [...WARM_CLOSERS, ...SOFT_CLOSERS];

    const allPhrases = [...openerPool, ...closerPool, ...WARM_OPENERS, ...WARM_CLOSERS];
    const lastAi = (context.lastAiResponses ?? []).slice(-MEMORY_WINDOW);
    const usedPhrases = new Set<string>();
    for (const msg of lastAi) {
      for (const p of allPhrases) {
        if (msg.includes(p)) usedPhrases.add(p);
      }
    }

    const availableOpeners = openerPool.filter((o) => !usedPhrases.has(o));
    const availableClosers = closerPool.filter((c) => !usedPhrases.has(c));

    const isShortMessage = text.length < 60;

    if (availableOpeners.length > 0 && this.shouldAddOpener(text, context)) {
      const opener = this.pickRandom(availableOpeners, 1)[0];
      result = opener + ' ' + result;
    }

    // If it's a very short message and we already added an opener, skip the closer to avoid overcrowding
    if (isShortMessage && result.length > text.length) {
      return result;
    }

    if (availableClosers.length > 0 && this.shouldAddCloser(text, context)) {
      const closer = this.pickRandom(availableClosers, 1)[0];
      result = result + '\n\n' + closer;
    }
    return result;
  }

  private shouldAddOpener(text: string, context: HumanizerContext): boolean {
    const intent = (context.intent?.primaryIntent ?? '').toLowerCase();
    const allow = ['package_inquiry', 'booking', 'faq', 'greeting', 'confirm', 'availability', 'price_inquiry'].some(
      (i) => intent.includes(i) || intent === i,
    );
    if (!allow) return false;
    if (text.length > 400) return false;
    return true;
  }

  private shouldAddCloser(text: string, context: HumanizerContext): boolean {
    const intent = (context.intent?.primaryIntent ?? '').toLowerCase();
    const allow = ['package_inquiry', 'booking', 'faq', 'availability', 'price_inquiry'].some(
      (i) => intent.includes(i) || intent === i,
    );
    if (!allow) return false;
    if (text.length > 500) return false;
    return true;
  }

  private pickRandom<T>(arr: T[], count: number): T[] {
    if (arr.length === 0 || count <= 0) return [];
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
}
