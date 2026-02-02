/**
 * Context-aware emoji map for the Response Humanizer.
 * Max 1–2 emojis per message; emotionally aligned; brand-safe.
 */

export type EmojiContext =
  | 'BOOKING_SUCCESS'
  | 'PAYMENT'
  | 'CONFIRMATION'
  | 'WAITING'
  | 'GREETING'
  | 'MATERNITY_FAMILY'
  | 'ESCALATION'
  | 'GENERAL_WARMTH';

/** Context → allowed emojis (pick 1–2 per message) */
export const EMOJI_CONTEXT_MAP: Record<EmojiContext, string[]> = {
  BOOKING_SUCCESS: ['💛', '✨', '📸'],
  PAYMENT: ['💳', '📲'],
  CONFIRMATION: ['✅', '🤍'],
  WAITING: ['⏳', '😊'],
  GREETING: ['😊', '👋'],
  MATERNITY_FAMILY: ['🤍', '👶', '✨'],
  ESCALATION: ['🤝', '💬'],
  GENERAL_WARMTH: ['🤍', '😊', '✨'],
};

/** Max emojis per message */
export const MAX_EMOJIS_PER_MESSAGE = 2;
