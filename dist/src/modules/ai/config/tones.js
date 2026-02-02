"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_BRAND_TONE = exports.TONE_PROFILES = exports.ToneProfile = void 0;
var ToneProfile;
(function (ToneProfile) {
    ToneProfile["WARM_PROFESSIONAL"] = "WARM_PROFESSIONAL";
    ToneProfile["FRIENDLY_CASUAL"] = "FRIENDLY_CASUAL";
    ToneProfile["LUXURY_PREMIUM"] = "LUXURY_PREMIUM";
    ToneProfile["CLINICAL_FORMAL"] = "CLINICAL_FORMAL";
})(ToneProfile || (exports.ToneProfile = ToneProfile = {}));
exports.TONE_PROFILES = {
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
exports.DEFAULT_BRAND_TONE = ToneProfile.WARM_PROFESSIONAL;
//# sourceMappingURL=tones.js.map