"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PersonalizationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonalizationService = void 0;
const common_1 = require("@nestjs/common");
const customer_memory_service_1 = require("./customer-memory.service");
let PersonalizationService = PersonalizationService_1 = class PersonalizationService {
    constructor(customerMemory) {
        this.customerMemory = customerMemory;
        this.logger = new common_1.Logger(PersonalizationService_1.name);
    }
    adaptResponse(baseResponse, style) {
        if (style === 'brief') {
            const hasPackageList = /📦|package|KES|Standard|Economy|Executive|Gold|Platinum|VIP/i.test(baseResponse);
            const hasContactDetails = /contact details|📍|📞|📧|🌐|🕐|phone|email|location|address|hours/i.test(baseResponse);
            const hasSlotSuggestions = /(here are|available times?|other times?|suggestions?|slots? for|do any of these|which.*work|which.*prefer)/i.test(baseResponse) &&
                /(\d{1,2}:\d{2}|\d{1,2}[ap]m|morning|afternoon|evening|AM|PM)/i.test(baseResponse);
            const hasBookingSuggestions = /(slot.*taken|not available|unavailable).*(here are|available|other|suggestions)/i.test(baseResponse);
            if (hasPackageList || hasContactDetails || hasSlotSuggestions || hasBookingSuggestions) {
                return baseResponse
                    .replace(/💕|💖|🌸|✨|🎈|💐|🌟|😊|💁‍♀️|👑/g, '')
                    .replace(/(💡|📅|📦|📍|📞|📧|🌐|🕐|😔)/g, '$1');
            }
            return baseResponse
                .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
                .replace(/💕|💖|🌸|✨|🎈|💐|🌟|😊|💁‍♀️|👑/g, '')
                .split('\n\n')[0];
        }
        if (style === 'detailed') {
            return baseResponse;
        }
        return baseResponse;
    }
    async generateGreeting(customerId, customerName) {
        const context = await this.customerMemory.getPersonalizationContext(customerId);
        const name = customerName || 'lovely';
        if (context.isVIP) {
            const vipGreetings = [
                `Welcome back, ${name}! 👑 It's always a true joy to assist our VIP clients. How can I make your day extra special today? ✨`,
                `Hello again, ${name}! 🌟 It’s so wonderful to see you. Being a VIP, you know we’re always here to make your experience perfect. What can I help you with? 💖`,
                `So good to have you back, ${name}! 👑 We’ve been looking forward to your next visit. How can I assist you with your luxury maternity session today? ✨`
            ];
            return vipGreetings[Math.floor(Math.random() * vipGreetings.length)];
        }
        if (context.isReturning) {
            const returningGreetings = [
                `Hi ${name}! 🌸 It’s so wonderful to see you again! How have you been? How can I help you today? 💕`,
                `Welcome back, ${name}! ✨ We love seeing familiar faces. What can I help you with this time? 🌸`,
                `Hello again, ${name}! 💖 It’s a pleasure to have you back with us. How can I assist you today? 🌸`
            ];
            return returningGreetings[Math.floor(Math.random() * returningGreetings.length)];
        }
        if (context.relationshipStage === 'new') {
            return `Hi there! 🌸 Welcome to Fiesta House Maternity! We’re so honored you’re considering us to capture this beautiful chapter of your life. How can I help you plan your dream photoshoot today? ✨`;
        }
        if (context.relationshipStage === 'interested') {
            return `Welcome back! 😊 I remember you were looking at our beautiful packages earlier. Have you had a chance to think about which one might be the perfect fit for you? I’m here to help with any questions! 💖`;
        }
        return `Hi! 🌸 How can I help make your day special today? ✨`;
    }
    async generateProactiveSuggestions(customerId, currentIntent) {
        const context = await this.customerMemory.getPersonalizationContext(customerId);
        const suggestions = [];
        if (currentIntent === 'package_inquiry' && !context.isReturning) {
            suggestions.push("Once you've chosen a package, I can help you book your preferred date right away! 📅");
        }
        if (context.isReturning && currentIntent === 'booking') {
            suggestions.push("As a returning client, you might love our new seasonal backdrops! Want to see them? 🎨");
        }
        if (context.isVIP) {
            suggestions.push("We have exclusive time slots available for our VIP clients. Interested? ✨");
        }
        if (context.budgetRange && context.budgetRange.max < 15000) {
            suggestions.push("We offer flexible payment plans if that helps! Just let me know. 💕");
        }
        if (context.relationshipStage === 'booked' && currentIntent === 'faq') {
            suggestions.push("Don't forget - the best time for maternity shoots is 28-34 weeks! 🤰");
        }
        return suggestions;
    }
    personalizePackagePresentation(packages, context) {
        let intro = '';
        if (context.isReturning) {
            intro = `Welcome back! Based on your previous booking, I think you'll love these options:\n\n`;
        }
        else if (context.preferredPackages && context.preferredPackages.length > 0) {
            intro = `Based on what you've been looking at, here are my top recommendations:\n\n`;
        }
        else {
            intro = `Here are our beautiful packages, each designed to capture your special moments:\n\n`;
        }
        return intro;
    }
    matchEmotionalTone(response, customerTone) {
        switch (customerTone) {
            case 'excited':
                const excitedIntros = [
                    "Oh, how exciting! ✨ ",
                    "That sounds absolutely wonderful! 💖 ",
                    "I love that energy! 🌟 "
                ];
                const intro = excitedIntros[Math.floor(Math.random() * excitedIntros.length)];
                return `${intro}${response.replace(/\./g, '!')}`;
            case 'anxious':
                return `I completely understand how you feel, and I'm here to make this as smooth and easy as possible for you. 🌸 ${response}\n\nDon't worry, we'll take care of every little detail so you can just enjoy the moment! 💕`;
            case 'frustrated':
                return `I am so sorry for any frustration this has caused! 😔 I really want to make things right for you. ${response}`;
            case 'confused':
                return `I'm happy to clear that up for you! 🌸 Let's look at it this way:\n\n${response}\n\nDoes that help make things a bit clearer? I'm here if you have any more questions at all! 😊`;
            default:
                return response;
        }
    }
    generateFollowUpQuestions(intent, context) {
        const questions = [];
        if (intent === 'package_inquiry') {
            if (!context.preferredPackages || context.preferredPackages.length === 0) {
                questions.push("What's most important to you - makeup, multiple outfits, or specific backdrops?");
                questions.push("Do you have a budget range in mind?");
            }
        }
        if (intent === 'booking') {
            questions.push("Do you have a preferred date and time in mind?");
            if (!context.preferredPackages) {
                questions.push("Which package would you like to book?");
            }
        }
        return questions;
    }
    generateCTA(intent, context) {
        if (intent === 'package_inquiry') {
            if (context.isReturning) {
                return "Ready to book your next session with us? I can get you scheduled right away! 💖";
            }
            return "Would you like to book one of these packages? I can check availability for you! 📅";
        }
        if (intent === 'faq') {
            return "Any other questions? I'm here to help! Or ready to book? 🌸";
        }
        if (intent === 'booking') {
            return "Let's get you booked! What date works best for you? 📅";
        }
        return "What else can I help you with today? 💕";
    }
    extractPreferencesFromMessage(message) {
        const lower = message.toLowerCase();
        const preferences = {};
        const budgetMatch = message.match(/(\d+)\s*(?:ksh|shillings?|bob)/i);
        if (budgetMatch) {
            const amount = parseInt(budgetMatch[1]);
            preferences.budgetRange = { max: amount };
        }
        if (lower.includes('morning'))
            preferences.preferredTimes = ['morning'];
        if (lower.includes('afternoon'))
            preferences.preferredTimes = ['afternoon'];
        if (lower.includes('evening'))
            preferences.preferredTimes = ['evening'];
        if (lower.includes('makeup'))
            preferences.wantsMakeup = true;
        if (lower.includes('outdoor') || lower.includes('beach')) {
            preferences.wantsOutdoor = false;
        }
        return preferences;
    }
};
exports.PersonalizationService = PersonalizationService;
exports.PersonalizationService = PersonalizationService = PersonalizationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [customer_memory_service_1.CustomerMemoryService])
], PersonalizationService);
//# sourceMappingURL=personalization.service.js.map