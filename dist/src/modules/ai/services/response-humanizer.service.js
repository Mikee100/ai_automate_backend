"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ResponseHumanizerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseHumanizerService = void 0;
const common_1 = require("@nestjs/common");
const tones_1 = require("../config/tones");
const emoji_1 = require("../config/emoji");
const phrases_1 = require("../config/phrases");
const pipelines_1 = require("../config/pipelines");
const naturalness_1 = require("../config/naturalness");
const MEMORY_WINDOW = 3;
let ResponseHumanizerService = ResponseHumanizerService_1 = class ResponseHumanizerService {
    constructor() {
        this.logger = new common_1.Logger(ResponseHumanizerService_1.name);
    }
    humanizeResponse(rawText, context) {
        if (!rawText?.trim())
            return rawText;
        const pipeline = context.pipeline ?? pipelines_1.DEFAULT_PIPELINE;
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
                    text = this.mirrorEmotion(text, context.emotionalTone ?? context.intent?.emotionalTone, context.intent?.primaryIntent);
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
    applyNaturalness(text, context) {
        let result = this.replaceTheatrical(text);
        result = this.replaceTemplateStructured(result);
        result = this.stripBlockedPhrases(result);
        const isGreeting = context.isFirstMessage === true ||
            (context.intent?.primaryIntent ?? '').toLowerCase() === 'greeting';
        if (isGreeting) {
            result = this.simplifyGreeting(result);
        }
        return result.trim().replace(/\n{3,}/g, '\n\n');
    }
    stripBlockedPhrases(text) {
        let result = text;
        const lower = result.toLowerCase();
        for (const phrase of naturalness_1.BLOCKED_PHRASES) {
            const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            result = result.replace(re, '').replace(/\s{2,}/g, ' ');
        }
        return result.trim();
    }
    replaceTheatrical(text) {
        let result = text;
        for (const { pattern, replacement } of naturalness_1.THEATRICAL_REPLACEMENTS) {
            result = result.replace(pattern, replacement);
        }
        return result.replace(/\s{2,}/g, ' ').trim();
    }
    replaceTemplateStructured(text) {
        let result = text;
        for (const { pattern, replacement } of naturalness_1.TEMPLATE_STRUCTURED_REPLACEMENTS) {
            result = result.replace(pattern, replacement);
        }
        return result.replace(/\s{2,}/g, ' ').trim();
    }
    simplifyGreeting(text) {
        const lower = text.toLowerCase();
        const useSimpleTemplate = naturalness_1.GREETING_OVERRIDE_IF_CONTAINS.some((s) => lower.includes(s));
        if (useSimpleTemplate && text.length > 80) {
            return naturalness_1.GREETING_SIMPLE_TEMPLATE;
        }
        const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
        let content = lines.slice(0, naturalness_1.GREETING_MAX_LINES).join('\n');
        for (const { pattern, replacement } of naturalness_1.PROMOTIONAL_PATTERNS) {
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
    softenTone(text) {
        let result = text;
        for (const { pattern, replacement } of phrases_1.TONE_SOFTENING_RULES) {
            result = result.replace(pattern, replacement);
        }
        return result;
    }
    chunkForReadability(text) {
        const sentences = text
            .replace(/\n+/g, ' ')
            .split(/(?<=[.!?])\s+/)
            .map((s) => s.trim())
            .filter(Boolean);
        if (sentences.length <= 2)
            return text;
        const chunks = [];
        for (let i = 0; i < sentences.length; i += 2) {
            chunks.push(sentences.slice(i, i + 2).join(' '));
        }
        return chunks.join('\n\n');
    }
    mirrorEmotion(text, emotionalTone, intent) {
        if (naturalness_1.MAX_EMOTION_LEVEL === 'soft' && intent && naturalness_1.INTENTS_SOFT_EMOTION_ONLY.includes(intent.toLowerCase())) {
            return text;
        }
        const tone = (emotionalTone ?? '').toLowerCase();
        const prependPhrases = {
            anxious: "No worries at all 🤍 I'll walk you through it step by step.\n\n",
            excited: "This is going to be beautiful! ✨ Let's get you booked 💛\n\n",
            frustrated: "I'm really sorry about that 😔 Let me fix this for you.\n\n",
            confused: "Let me break that down simply:\n\n",
        };
        const prependPhrase = prependPhrases[tone];
        if (prependPhrase)
            return prependPhrase + text;
        return text;
    }
    injectEmoji(text, context) {
        const profileName = (context.brandTone ?? tones_1.DEFAULT_BRAND_TONE);
        const profile = tones_1.TONE_PROFILES[profileName] ?? tones_1.TONE_PROFILES[tones_1.ToneProfile.WARM_PROFESSIONAL];
        if (profile.emojiFrequency === 'none')
            return text;
        const tolerance = context.customerProfile?.emojiTolerance ?? 'medium';
        if (tolerance === 'low')
            return text;
        const emojiContext = this.detectEmojiContext(text, context);
        const allowed = emoji_1.EMOJI_CONTEXT_MAP[emojiContext];
        const filtered = allowed.filter((e) => profile.emojiTypes.includes(e) || profile.emojiTypes.length === 0);
        const pool = filtered.length ? filtered : profile.emojiTypes.slice(0, 5);
        if (pool.length === 0)
            return text;
        const maxByProfile = profile.emojiFrequency === 'low' ? 1 : 2;
        const maxByTolerance = tolerance === 'high' ? 2 : 1;
        const count = Math.min(emoji_1.MAX_EMOJIS_PER_MESSAGE, maxByProfile, maxByTolerance);
        if (count <= 0)
            return text;
        const toAdd = this.pickRandom(pool, count);
        if (toAdd.length === 0)
            return text;
        return text.trimEnd() + ' ' + toAdd.join('');
    }
    detectEmojiContext(text, context) {
        const lower = text.toLowerCase();
        const intent = context.intent?.primaryIntent ?? '';
        if (context.isEscalation || intent === 'complaint')
            return 'ESCALATION';
        if (context.isBookingFlow && (lower.includes('confirm') || lower.includes('booked') || lower.includes('created')))
            return 'BOOKING_SUCCESS';
        if (lower.includes('payment') || lower.includes('m-pesa') || lower.includes('link') && lower.includes('sent'))
            return 'PAYMENT';
        if (lower.includes('confirm') || lower.includes('secured'))
            return 'CONFIRMATION';
        if (lower.includes('wait') || lower.includes('processing'))
            return 'WAITING';
        if (lower.includes('hi ') || lower.includes('hello') || context.isFirstMessage)
            return 'GREETING';
        if (lower.includes('family') || lower.includes('partner') || lower.includes('maternity') || lower.includes('baby'))
            return 'MATERNITY_FAMILY';
        return 'GENERAL_WARMTH';
    }
    applyVariation(text, context) {
        const intent = context.intent?.primaryIntent ?? '';
        const requiresHandoff = context.intent?.requiresHumanHandoff === true;
        const skip = context.isEscalation === true ||
            requiresHandoff ||
            phrases_1.SKIP_OPENERS_CLOSERS_INTENTS.includes(intent.toLowerCase());
        if (skip)
            return text;
        const formality = context.customerProfile?.formalityLevel ?? 'medium';
        const openerPool = formality === 'high' ? phrases_1.NEUTRAL_OPENERS : formality === 'low' ? [...phrases_1.CASUAL_OPENERS, ...phrases_1.WARM_OPENERS] : phrases_1.WARM_OPENERS;
        const closerPool = formality === 'high' ? phrases_1.SOFT_CLOSERS : [...phrases_1.WARM_CLOSERS, ...phrases_1.SOFT_CLOSERS];
        const allPhrases = [...openerPool, ...closerPool, ...phrases_1.WARM_OPENERS, ...phrases_1.WARM_CLOSERS];
        const lastAi = (context.lastAiResponses ?? []).slice(-MEMORY_WINDOW);
        const usedPhrases = new Set();
        for (const msg of lastAi) {
            for (const p of allPhrases) {
                if (msg.includes(p))
                    usedPhrases.add(p);
            }
        }
        const availableOpeners = openerPool.filter((o) => !usedPhrases.has(o));
        const availableClosers = closerPool.filter((c) => !usedPhrases.has(c));
        const isShortMessage = text.length < 60;
        if (availableOpeners.length > 0 && this.shouldAddOpener(text, context)) {
            const opener = this.pickRandom(availableOpeners, 1)[0];
            result = opener + ' ' + result;
        }
        if (isShortMessage && result.length > text.length) {
            return result;
        }
        if (availableClosers.length > 0 && this.shouldAddCloser(text, context)) {
            const closer = this.pickRandom(availableClosers, 1)[0];
            result = result + '\n\n' + closer;
        }
        return result;
    }
    shouldAddOpener(text, context) {
        const intent = (context.intent?.primaryIntent ?? '').toLowerCase();
        const allow = ['package_inquiry', 'booking', 'faq', 'greeting', 'confirm', 'availability', 'price_inquiry'].some((i) => intent.includes(i) || intent === i);
        if (!allow)
            return false;
        if (text.length > 400)
            return false;
        return true;
    }
    shouldAddCloser(text, context) {
        const intent = (context.intent?.primaryIntent ?? '').toLowerCase();
        const allow = ['package_inquiry', 'booking', 'faq', 'availability', 'price_inquiry'].some((i) => intent.includes(i) || intent === i);
        if (!allow)
            return false;
        if (text.length > 500)
            return false;
        return true;
    }
    pickRandom(arr, count) {
        if (arr.length === 0 || count <= 0)
            return [];
        const shuffled = [...arr].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }
};
exports.ResponseHumanizerService = ResponseHumanizerService;
exports.ResponseHumanizerService = ResponseHumanizerService = ResponseHumanizerService_1 = __decorate([
    (0, common_1.Injectable)()
], ResponseHumanizerService);
//# sourceMappingURL=response-humanizer.service.js.map