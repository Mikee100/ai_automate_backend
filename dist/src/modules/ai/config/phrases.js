"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TONE_SOFTENING_RULES = exports.SKIP_OPENERS_CLOSERS_INTENTS = exports.SOFT_CLOSERS = exports.NEUTRAL_OPENERS = exports.CASUAL_OPENERS = exports.WARM_CLOSERS = exports.WARM_OPENERS = void 0;
exports.WARM_OPENERS = [
    'Sure.',
    'Absolutely.',
    'Of course.',
    'Happy to help.',
    "I've got you.",
];
exports.WARM_CLOSERS = [
    'If you want, I can help with the next step.',
    'If you want more detail, just ask.',
    "Whenever you're ready, we can continue.",
    'I can help you with that too.',
];
exports.CASUAL_OPENERS = [
    'Got it.',
    'Sure thing.',
    'Yep.',
    'Perfect.',
    'All set.',
];
exports.NEUTRAL_OPENERS = [
    'Sure.',
    'Of course.',
    'Here you go.',
    'Got it.',
];
exports.SOFT_CLOSERS = [
    'Just message me if you need anything else.',
    'We can keep going from here.',
    'If you want, we can sort out the next part now.',
    "If anything changes, tell me and I'll adjust it.",
];
exports.SKIP_OPENERS_CLOSERS_INTENTS = [
    'error',
    'system',
    'escalation',
    'handoff',
    'payment_failed',
    'security',
    'rate_limit',
    'complaint',
];
exports.TONE_SOFTENING_RULES = [
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
//# sourceMappingURL=phrases.js.map