/**
 * Phrase pools for openers/closers and tone softening.
 * Used by the Variation Engine; intent-based skip is in the service.
 */

export const WARM_OPENERS = [
  'Sure.',
  'Absolutely.',
  'Of course.',
  'Happy to help.',
  "I've got you.",
];

export const WARM_CLOSERS = [
  'If you want, I can help with the next step.',
  'If you want more detail, just ask.',
  "Whenever you're ready, we can continue.",
  'I can help you with that too.',
];

/** Casual openers (lower formality, chat-style) */
export const CASUAL_OPENERS = [
  'Got it.',
  'Sure thing.',
  'Yep.',
  'Perfect.',
  'All set.',
];

/** Neutral openers (minimal, direct) */
export const NEUTRAL_OPENERS = [
  'Sure.',
  'Of course.',
  'Here you go.',
  'Got it.',
];

/** Soft closers (no pressure, optional) */
export const SOFT_CLOSERS = [
  'Just message me if you need anything else.',
  'We can keep going from here.',
  'If you want, we can sort out the next part now.',
  "If anything changes, tell me and I'll adjust it.",
];

/** Intents where we skip adding openers/closers */
export const SKIP_OPENERS_CLOSERS_INTENTS = [
  'error',
  'system',
  'escalation',
  'handoff',
  'payment_failed',
  'security',
  'rate_limit',
  'complaint',
];

/** Tone softening: formal -> conversational (pattern, replacement) */
export const TONE_SOFTENING_RULES: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bHere are our available packages\./gi, replacement: "Here's what we currently offer" },
  { pattern: /\bHere are our packages\./gi, replacement: "Here's what we currently offer" },
  { pattern: /\bHere is what we offer\./gi, replacement: "Here's what we currently offer" },
  { pattern: /Please provide the date\.?/gi, replacement: 'What day works best for you?' },
  { pattern: /Please provide your preferred date\.?/gi, replacement: 'What day works best for you?' },
  { pattern: /Please reply confirm to proceed\.?/gi, replacement: "If everything looks good, just reply confirm and I'll take care of the rest" },
  { pattern: /Confirm to proceed\.?/gi, replacement: "If everything looks good, just reply confirm and I'll handle the rest" },
  { pattern: /Your booking has been created\.?/gi, replacement: "You're all set. Your booking is confirmed" },
  { pattern: /Your booking has been confirmed\.?/gi, replacement: "You're all set. Your booking is confirmed" },
  { pattern: /Your payment link has been sent\.?/gi, replacement: "I've just sent your payment link. Once that's done, your slot will be secured" },
  { pattern: /The payment link has been sent\.?/gi, replacement: "I've just sent your payment link. Once that's done, your slot will be secured" },
  { pattern: /Please proceed to payment using the provided link\.?/gi, replacement: "I'm sending your payment link now so we can lock in your spot" },
  { pattern: /\bWe are located at\b/gi, replacement: "We're located at" },
  { pattern: /\bWe operate from\b/gi, replacement: "We're open from" },
  { pattern: /\bWe offer\b/gi, replacement: 'We offer' },
];
