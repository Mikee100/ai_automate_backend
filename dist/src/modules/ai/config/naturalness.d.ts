export declare const BLOCKED_PHRASES: string[];
export declare const THEATRICAL_REPLACEMENTS: Array<{
    pattern: RegExp;
    replacement: string;
}>;
export declare const PROMOTIONAL_PATTERNS: Array<{
    pattern: RegExp;
    replacement: string;
}>;
export declare const GREETING_MAX_LINES = 3;
export declare const GREETING_SIMPLE_TEMPLATE = "Hi! Welcome to Fiesta House.\nHow can I help?";
export declare const GREETING_OVERRIDE_IF_CONTAINS: string[];
export declare const MAX_EMOTION_LEVEL: 'soft' | 'medium' | 'full';
export declare const INTENTS_SOFT_EMOTION_ONLY: string[];
export declare const TEMPLATE_STRUCTURED_REPLACEMENTS: Array<{
    pattern: RegExp;
    replacement: string;
}>;
