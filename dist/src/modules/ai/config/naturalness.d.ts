export declare const BLOCKED_PHRASES: string[];
export declare const THEATRICAL_REPLACEMENTS: Array<{
    pattern: RegExp;
    replacement: string;
}>;
export declare const PROMOTIONAL_PATTERNS: Array<{
    pattern: RegExp;
    replacement: string;
}>;
export declare const GREETING_MAX_LINES = 2;
export declare const GREETING_SIMPLE_TEMPLATE = "Hi there! \uD83D\uDE0A Welcome to Fiesta House Maternity \uD83E\uDD0D\nHow can I help you today? \u2728";
export declare const GREETING_OVERRIDE_IF_CONTAINS: string[];
export declare const MAX_EMOTION_LEVEL: 'soft' | 'medium' | 'full';
export declare const INTENTS_SOFT_EMOTION_ONLY: string[];
export declare const TEMPLATE_STRUCTURED_REPLACEMENTS: Array<{
    pattern: RegExp;
    replacement: string;
}>;
