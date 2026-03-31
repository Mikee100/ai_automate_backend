/**
 * Naturalness layer: avoid theatrical, fake-human, and over-promotional tone.
 * Target: calm, warm, grounded — not robotic, not over-humanized.
 */

/** Phrases we strip or replace (case-insensitive). Prevents "AI trying to sound human". */
export const BLOCKED_PHRASES: string[] = [
  'oh, my dear',
  'oh my dear',
  'dearest',
  'my darling',
  'so delighted',
  'overjoyed',
  'thrilled beyond words',
  'ecstatic to share',
  'honored to present',
  'it fills my heart',
  'thoughtfully crafted to celebrate',
  'beautiful journey',
  'we are so excited to',
  'absolutely thrilled',
  'cannot wait to',
];

/** Theatrical → natural replacements (pattern, replacement). Applied in order. */
export const THEATRICAL_REPLACEMENTS: Array<{ pattern: RegExp; replacement: string }> = [
  // Package intro
  { pattern: /^Oh,?\s*my dear,?\s*/gim, replacement: '' },
  {
    pattern: /Oh,?\s*my dear,?\s*I'?m\s+so\s+delighted\s+to\s+share\s+our\s+studio\s+packages\s+with\s+you!?/gi,
    replacement: 'Here are our studio packages',
  },
  {
    pattern: /I'?m\s+so\s+delighted\s+to\s+share\s+our\s+(?:studio\s+)?packages\s+with\s+you!?/gi,
    replacement: 'Here are our packages',
  },
  { pattern: /\bso\s+delighted\s+to\b/gi, replacement: 'happy to' },
  { pattern: /\bso\s+delighted\b/gi, replacement: 'happy' },
  { pattern: /\boverjoyed\s+to\b/gi, replacement: 'happy to' },
  { pattern: /\bthrilled\s+beyond\s+words\b/gi, replacement: 'excited' },
  { pattern: /\becstatic\s+to\s+share\b/gi, replacement: 'happy to share' },
  { pattern: /\bhonored\s+to\s+present\b/gi, replacement: 'happy to share' },
  // "I've noted the time for X" → "I've got X"
  { pattern: /\bI'?ve\s+noted\s+the\s+time\s+for\s+/gi, replacement: "I've got " },
  { pattern: /\bI\s+have\s+noted\s+the\s+time\s+for\s+/gi, replacement: "I've got " },
  // Package description
  {
    pattern: /Each\s+one\s+is\s+thoughtfully\s+crafted\s+to\s+celebrate\s+your\s+beautiful\s+journey\.?/gi,
    replacement: 'Each one is designed to give you a beautiful, relaxed maternity shoot experience.',
  },
  {
    pattern: /thoughtfully\s+crafted\s+to\s+celebrate/gi,
    replacement: 'designed to give you',
  },
  {
    pattern: /your\s+beautiful\s+journey/gi,
    replacement: 'a beautiful, relaxed maternity shoot experience',
  },
];

/** For greetings: strip promotional/positioning language (case-insensitive substrings). */
export const PROMOTIONAL_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bKenya'?s\s+leading\s+(?:luxury\s+)?(?:photo\s+)?studio\b/gi, replacement: 'our studio' },
  { pattern: /\bleading\s+luxury\s+photo\s+studio\b/gi, replacement: 'photo studio' },
  { pattern: /\bThank\s+you\s+for\s+contacting\s+[^.!?]+\.?\s*/gi, replacement: '' },
  { pattern: /\bluxury\s+photo\s+studio\b/gi, replacement: 'photo studio' },
  { pattern: /\bWe\s+specialize\s+in\s+professional\s+maternity\s+photography[^.!?]*\.?\s*/gi, replacement: '' },
];

/** Greeting: max lines (simple + warm + light). */
export const GREETING_MAX_LINES = 3;

/** When greeting is long and promotional, use this instead (simple + warm + light). */
export const GREETING_SIMPLE_TEMPLATE =
  "Hi there! 😊 Welcome to Fiesta House Maternity 🤍\nHow can I help you today? ✨";

/** If greeting text matches these, prefer GREETING_SIMPLE_TEMPLATE (avoid long branded intro). */
export const GREETING_OVERRIDE_IF_CONTAINS = [
  "thank you for contacting",
  "kenya's leading",
  "leading luxury",
  "luxury photo studio",
];

/** Emotion cap: "soft" = warm but not dramatic/theatrical. */
export const MAX_EMOTION_LEVEL: 'soft' | 'medium' | 'full' = 'soft';

/** Intents where we skip heavy emotion prepend (friendly_informative, not emotional_storytelling). */
export const INTENTS_SOFT_EMOTION_ONLY: string[] = [
  'package_inquiry',
  'price_inquiry',
  'faq',
  'availability',
];

/** Template-structured (corporate/LLM-default) → natural, chunked rhythm. Applied in NATURALNESS. */
export const TEMPLATE_STRUCTURED_REPLACEMENTS: Array<{ pattern: RegExp; replacement: string }> = [
  // Reschedule / clarification (often reintroduced by quality service)
  { pattern: /Thank\s+you\s+for\s+your\s+message!?\s*I\s+want\s+to\s+clarify\s+the\s+date\s+you\s+mentioned\s+for\s+rescheduling\.?\s*/gi, replacement: 'Got it. ' },
  { pattern: /Thank\s+you\s+for\s+your\s+message!?\s*I\s+want\s+to\s+clarify[^.!?]*\.?\s*/gi, replacement: 'Quick clarification: ' },
  { pattern: /Thank\s+you\s+for\s+your\s+message!?\s*/gi, replacement: '' },
  // Booking confirmation opener
  { pattern: /Thank\s+you\s+for\s+your\s+request!?\s*/gi, replacement: 'Perfect. ' },
  { pattern: /Thank\s+you\s+for\s+your\s+request\.\s*/gi, replacement: 'Got it. ' },
  { pattern: /I\s+have\s+noted\s+your\s+booking\s+for\s+/gi, replacement: "I've locked in " },
  { pattern: /I\s+have\s+confirmed\s+your\s+booking\s+for\s+/gi, replacement: "Booked for " },
  { pattern: /Your\s+booking\s+(?:has\s+been\s+)?confirmed\s+for\s+/gi, replacement: '' },
  { pattern: /Your\s+booking\s+is\s+confirmed\s+for\s+/gi, replacement: '' },
  // Polite filler → short
  { pattern: /I'?m\s+glad\s+to\s+hear\s+you'?re\s+doing\s+well!?\s*/gi, replacement: 'All good then. ' },
  { pattern: /I'?m\s+glad\s+to\s+hear\s+that!?\s*/gi, replacement: 'Good to hear. ' },
  {
    pattern: /If\s+you\s+ever\s+have\s+questions\s+in\s+the\s+future\s+or\s+need\s+assistance,?\s+feel\s+free\s+to\s+reach\s+out\.?/gi,
    replacement: 'If anything comes up later, just message me.',
  },
  {
    pattern: /If\s+you\s+have\s+any\s+questions\s+in\s+the\s+future,?\s+feel\s+free\s+to\s+reach\s+out\.?/gi,
    replacement: 'If anything comes up, just message me.',
  },
  {
    pattern: /(?:Please\s+)?feel\s+free\s+to\s+reach\s+out\s+if\s+you\s+need\s+anything\.?/gi,
    replacement: 'Just message me if you need anything.',
  },
  // Yes, you can absolutely → Yes — you can (remove filler)
  { pattern: /\bYes,?\s+you\s+can\s+absolutely\s+/gi, replacement: 'Yes — you can ' },
  { pattern: /\bAbsolutely!?\s+You\s+can\s+/gi, replacement: 'Yes — you can ' },
  { pattern: /\bOf\s+course!?\s+You\s+can\s+/gi, replacement: 'Yes — you can ' },
  // Booking rhythm: "with the X Package" → "— X Package"
  { pattern: /\s+with\s+the\s+(Standard|Economy|Executive|Gold|Platinum|VIP|VVIP)\s+Package\.?/gi, replacement: ' — $1 Package.' },
  { pattern: /\s+with\s+the\s+(\w+)\s+package\.?/gi, replacement: ' — $1 package.' },
  // We're all set on our side
  { pattern: /\b(?:We\s+have\s+recorded\s+your\s+booking|Your\s+booking\s+has\s+been\s+recorded)\.?/gi, replacement: "We're all set on our side." },
];
