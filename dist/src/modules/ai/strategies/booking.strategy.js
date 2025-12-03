"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingStrategy = void 0;
class BookingStrategy {
    canHandle(intent, context) {
        const { hasDraft } = context;
        return hasDraft || intent === 'booking';
    }
    async generateResponse(message, context) {
        const { aiService, logger, history, historyLimit, customerId, bookingsService, hasDraft } = context;
        logger.log(`[STRATEGY] Executing BookingStrategy for: "${message}"`);
        let draft = context.draft;
        if (!hasDraft) {
            draft = await aiService.getOrCreateDraft(customerId);
        }
        const extraction = await aiService.extractBookingDetails(message, history);
        logger.debug(`[STRATEGY] Extraction result:`, extraction);
        draft = await aiService.mergeIntoDraft(customerId, extraction);
        const completion = await aiService.checkAndCompleteIfConfirmed(draft, extraction, customerId, bookingsService);
        if (completion.action === 'conflict') {
            const response = `I'm sorry, but it looks like you already have a booking around that time. ${completion.message} Would you like to try a different time?`;
            return { response, draft, updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: response }] };
        }
        if (completion.action === 'unavailable') {
            const suggestions = completion.suggestions.map((s) => `- ${s}`).join('\n');
            const response = `I'm so sorry, but that slot is already taken. 😔\nHere are some other times I have available:\n${suggestions}\n\nDo any of these work for you?`;
            return { response, draft, updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: response }] };
        }
        if (completion.action === 'payment_initiated') {
            const response = `Perfect! I've initiated a payment request for KSH ${completion.amount} to your phone (${completion.phone}). Please check your phone to complete the deposit. Once that's done, your booking will be confirmed! 💖`;
            return { response, draft, updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: response }] };
        }
        if (completion.action === 'failed') {
            const response = completion.error || "I'm having trouble processing that. Could you please double check the details? 🥺";
            return { response, draft, updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: response }] };
        }
        const response = await aiService.generateBookingReply(message, draft, extraction, history, bookingsService);
        return { response, draft, updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: response }] };
    }
}
exports.BookingStrategy = BookingStrategy;
//# sourceMappingURL=booking.strategy.js.map