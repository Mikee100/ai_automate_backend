"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEMPLATE_STRUCTURED_REPLACEMENTS = exports.INTENTS_SOFT_EMOTION_ONLY = exports.MAX_EMOTION_LEVEL = exports.GREETING_OVERRIDE_IF_CONTAINS = exports.GREETING_SIMPLE_TEMPLATE = exports.GREETING_MAX_LINES = exports.PROMOTIONAL_PATTERNS = exports.THEATRICAL_REPLACEMENTS = exports.BLOCKED_PHRASES = void 0;
exports.BLOCKED_PHRASES = [
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
exports.THEATRICAL_REPLACEMENTS = [
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
    { pattern: /\bI'?ve\s+noted\s+the\s+time\s+for\s+/gi, replacement: "I've got " },
    { pattern: /\bI\s+have\s+noted\s+the\s+time\s+for\s+/gi, replacement: "I've got " },
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
exports.PROMOTIONAL_PATTERNS = [
    { pattern: /\bKenya'?s\s+leading\s+(?:luxury\s+)?(?:photo\s+)?studio\b/gi, replacement: 'our studio' },
    { pattern: /\bleading\s+luxury\s+photo\s+studio\b/gi, replacement: 'photo studio' },
    { pattern: /\bThank\s+you\s+for\s+contacting\s+[^.!?]+\.?\s*/gi, replacement: '' },
    { pattern: /\bluxury\s+photo\s+studio\b/gi, replacement: 'photo studio' },
    { pattern: /\bWe\s+specialize\s+in\s+professional\s+maternity\s+photography[^.!?]*\.?\s*/gi, replacement: '' },
];
exports.GREETING_MAX_LINES = 3;
exports.GREETING_SIMPLE_TEMPLATE = "Hi there! 😊 Welcome to Fiesta House Maternity 🤍\nHow can I help you today? ✨";
exports.GREETING_OVERRIDE_IF_CONTAINS = [
    "thank you for contacting",
    "kenya's leading",
    "leading luxury",
    "luxury photo studio",
];
exports.MAX_EMOTION_LEVEL = 'soft';
exports.INTENTS_SOFT_EMOTION_ONLY = [
    'package_inquiry',
    'price_inquiry',
    'faq',
    'availability',
];
exports.TEMPLATE_STRUCTURED_REPLACEMENTS = [
    { pattern: /Thank\s+you\s+for\s+your\s+message!?\s*I\s+want\s+to\s+clarify\s+the\s+date\s+you\s+mentioned\s+for\s+rescheduling\.?\s*/gi, replacement: 'Got it. ' },
    { pattern: /Thank\s+you\s+for\s+your\s+message!?\s*I\s+want\s+to\s+clarify[^.!?]*\.?\s*/gi, replacement: 'Quick clarification: ' },
    { pattern: /Thank\s+you\s+for\s+your\s+message!?\s*/gi, replacement: '' },
    { pattern: /Thank\s+you\s+for\s+your\s+request!?\s*/gi, replacement: 'Perfect. ' },
    { pattern: /Thank\s+you\s+for\s+your\s+request\.\s*/gi, replacement: 'Got it. ' },
    { pattern: /I\s+have\s+noted\s+your\s+booking\s+for\s+/gi, replacement: "I've locked in " },
    { pattern: /I\s+have\s+confirmed\s+your\s+booking\s+for\s+/gi, replacement: "Booked for " },
    { pattern: /Your\s+booking\s+(?:has\s+been\s+)?confirmed\s+for\s+/gi, replacement: '' },
    { pattern: /Your\s+booking\s+is\s+confirmed\s+for\s+/gi, replacement: '' },
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
    { pattern: /\bYes,?\s+you\s+can\s+absolutely\s+/gi, replacement: 'Yes — you can ' },
    { pattern: /\bAbsolutely!?\s+You\s+can\s+/gi, replacement: 'Yes — you can ' },
    { pattern: /\bOf\s+course!?\s+You\s+can\s+/gi, replacement: 'Yes — you can ' },
    { pattern: /\s+with\s+the\s+(Standard|Economy|Executive|Gold|Platinum|VIP|VVIP)\s+Package\.?/gi, replacement: ' — $1 Package.' },
    { pattern: /\s+with\s+the\s+(\w+)\s+package\.?/gi, replacement: ' — $1 package.' },
    { pattern: /\b(?:We\s+have\s+recorded\s+your\s+booking|Your\s+booking\s+has\s+been\s+recorded)\.?/gi, replacement: "We're all set on our side." },
];
//# sourceMappingURL=naturalness.js.map