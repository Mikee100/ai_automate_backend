"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingStrategy = void 0;
class BookingStrategy {
    constructor() {
        this.priority = 10;
        this.STUDIO_TIMEZONE = 'Africa/Nairobi';
        this.ACKNOWLEDGMENT_PATTERNS = [
            /^(ok|okay|sure|yes|yeah|yep|alright|sounds good|got it|understood|perfect|great|thanks|thank you|cool|awesome|ty)/i,
            /^(ok|okay|sure|yes|yeah|yep|alright|sounds good|got it|understood|perfect|great|thanks|thank you).*(then|i will|i'll)/i,
            /^(okay|ok|sure|yes|yeah|yep|alright).*then.*(i will|i'll)/i,
        ];
        this.RESEND_PAYMENT_PATTERNS = [
            /^(resend|retry|try.*again|send.*again)$/i,
            /(resend|retry|try.*again|try.*payment|retry.*payment|lets.*retry|let.*retry|want.*retry|need.*retry|can.*retry).*(payment|prompt|mpesa)/i,
            /(payment|prompt|mpesa).*(resend|retry|try.*again)/i,
            /(resend|send.*again|send.*another|retry|try.*again|try.*payment|retry.*payment|lets.*retry|let.*retry|want.*retry|need.*retry|can.*retry|send.*prompt|resend.*payment)/i
        ];
    }
    canHandle(intent, context) {
        const { hasDraft, message } = context;
        const wantsToRetryPayment = /^(resend|retry|try.*again|send.*again)$/i.test(message.trim()) ||
            /(resend|retry|try.*again|try.*payment|retry.*payment|lets.*retry|let.*retry|want.*retry|need.*retry|can.*retry).*(payment|prompt|mpesa)/i.test(message) ||
            /(payment|prompt|mpesa).*(resend|retry|try.*again)/i.test(message);
        if (wantsToRetryPayment) {
            return true;
        }
        const isRescheduleIntent = /\b(reschedul\w*)\b/i.test(message) ||
            /(i want to|i'd like to|i need to|can i|can we).*reschedule/i.test(message) ||
            /(change|move|modify).*(booking|appointment|date|time)/i.test(message);
        if (isRescheduleIntent) {
            return false;
        }
        const wantsToStartBooking = /(how.*(do|can).*(make|book|start|get|schedule).*(booking|appointment)|(i want|i'd like|i need|can i|please).*(to book|booking|appointment|make.*booking|schedule)|let.*book|start.*booking)/i.test(message);
        return hasDraft || intent === 'booking' || wantsToStartBooking;
    }
    async generateResponse(message, context) {
        const { aiService, logger, history, historyLimit, customerId, hasDraft, prisma, bookingsService, enrichedContext } = context;
        const { DateTime } = require('luxon');
        const redirectResponse = await this.handlePlatformRedirection(message, context);
        if (redirectResponse)
            return redirectResponse;
        let draft = await aiService.getOrCreateDraft(customerId);
        const requestsResend = this.RESEND_PAYMENT_PATTERNS.some(pattern => pattern.test(message));
        if (draft && !requestsResend) {
            const wasStale = await aiService.cleanupStaleDraft(customerId);
            if (wasStale) {
                logger.debug(`[STRATEGY] Stale draft detected and cleaned up for customer ${customerId}`);
                draft = null;
            }
        }
        if (draft) {
            const hasFailed = await aiService.hasFailedPayment(customerId);
            if (hasFailed) {
                const lower = message.toLowerCase();
                const isBookingRelated = /(how.*(do|can).*(make|book|start|get|schedule).*(booking|appointment)|(i want|i'd like|i need|can i|please).*(to book|booking|appointment|make.*booking|schedule)|let.*book|start.*booking)/i.test(message) ||
                    this.RESEND_PAYMENT_PATTERNS.some(pattern => pattern.test(message)) ||
                    /(payment|prompt|mpesa|deposit|confirm|booking|appointment|book|schedule|date|time|package)/i.test(lower);
                if (!isBookingRelated) {
                    logger.debug(`[STRATEGY] Draft has failed payment and message is not booking-related, skipping booking strategy`);
                    return null;
                }
            }
        }
        if (draft && (draft.step === 'reschedule' || draft.step === 'reschedule_confirm')) {
            logger.debug(`[STRATEGY] Draft is in reschedule mode (step: ${draft.step}), skipping booking strategy`);
            return null;
        }
        const paymentResponse = await this.handlePaymentLogic(message, context, draft);
        if (paymentResponse)
            return paymentResponse;
        const slotResponse = await this.handleSlotSuggestions(message, context, draft);
        if (slotResponse)
            return slotResponse;
        if (draft && draft.step === 'confirm' && /^(confirm|yes|ok|okay|sure|proceed|go ahead)$/i.test(message.trim())) {
            context.logger.error(`[DEBUG-TRACE] [STRATEGY] Detected confirmation for deposit payment. CustomerId: ${customerId}`);
            logger.debug(`[STRATEGY] Detected confirmation for deposit payment`);
            const existingPayment = await bookingsService.getLatestPaymentForDraft(customerId);
            if (existingPayment) {
                if (existingPayment.status === 'success') {
                    const confirmedBooking = bookingsService
                        ? await bookingsService.getLatestConfirmedBooking(customerId)
                        : await prisma.booking.findFirst({
                            where: { customerId, status: 'confirmed' },
                            orderBy: { createdAt: 'desc' }
                        });
                    const response = confirmedBooking
                        ? "✅ Great news! Your payment was already successful! Your booking is confirmed. You should have received a confirmation message with all the details. If you didn't, please let me know! 💖"
                        : "I see your payment was successful, but I'm having trouble finding your booking. Please contact us at 0720 111928 for assistance. 💖";
                    return {
                        response,
                        draft: confirmedBooking ? null : draft,
                        updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: response }]
                    };
                }
                else if (existingPayment.status === 'pending') {
                    const phone = existingPayment.phone || draft.recipientPhone;
                    const timeSinceSent = Math.floor((Date.now() - new Date(existingPayment.createdAt).getTime()) / 1000 / 60);
                    const response = `⏳ I've already sent the payment prompt to your phone (${phone}) ${timeSinceSent === 0 ? 'just now' : `${timeSinceSent} mins ago`}. Please check your phone! 📲\n\nIf you don't receive it, say "resend".`;
                    return {
                        response,
                        draft,
                        updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: response }]
                    };
                }
                else if (existingPayment.status === 'failed') {
                    const result = bookingsService
                        ? await bookingsService.resendPaymentPrompt(customerId)
                        : { message: "I'll resend the payment prompt. Please check your phone in a moment! 📲" };
                    return {
                        response: result.message,
                        draft,
                        updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: result.message }]
                    };
                }
            }
            if (draft.service && draft.date && draft.time && draft.name && draft.recipientPhone) {
                try {
                    const normalized = aiService.normalizeDateTime(draft.date, draft.time);
                    if (!normalized) {
                        return { response: "I'm having trouble with the date/time. Could you please provide it again?", draft, updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: "I'm having trouble with the date/time. Could you please provide it again?" }] };
                    }
                    const dateObj = new Date(normalized.isoUtc);
                    const avail = bookingsService
                        ? await bookingsService.checkAvailability(dateObj, draft.service)
                        : await aiService.getAvailableSlotsForDate(DateTime.fromJSDate(dateObj).toFormat('yyyy-MM-dd'), draft.service);
                    if (!avail.available) {
                        const completion = { action: 'unavailable', suggestions: avail.suggestions };
                        return this.handleBookingCompletion(completion, message, context, draft);
                    }
                    const pkg = bookingsService?.packagesService
                        ? await bookingsService.packagesService.findPackageByName(draft.service)
                        : await aiService.findPackageByName(draft.service);
                    const depositAmount = pkg?.deposit || 2000;
                    if (bookingsService) {
                        await bookingsService.completeBookingDraft(customerId, dateObj);
                    }
                    else {
                        logger.warn('[BOOKING] completeBookingDraft not available - would trigger event to business service');
                    }
                    const completion = { action: 'payment_initiated', packageName: draft.service, amount: depositAmount };
                    return this.handleBookingCompletion(completion, message, context, draft);
                }
                catch (error) {
                    logger.error('Error processing confirmation:', error);
                    const response = "I encountered an issue processing your confirmation. Please try again or contact us at 0720 111928 for assistance. 💖";
                    return { response, draft, updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: response }] };
                }
            }
            else {
                const missing = [];
                if (!draft.service)
                    missing.push('package');
                if (!draft.date)
                    missing.push('date');
                if (!draft.time)
                    missing.push('time');
                if (!draft.name)
                    missing.push('name');
                if (!draft.recipientPhone)
                    missing.push('phone number');
                const response = `I'm missing some information: ${missing.join(', ')}. Could you please provide ${missing.length === 1 ? 'it' : 'them'}?`;
                return { response, draft, updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: response }] };
            }
        }
        if (!hasDraft && this.isSimpleAcknowledgment(message)) {
            const recentAssistantMsgs = history.filter((msg) => msg.role === 'assistant').slice(-3).map((msg) => msg.content.toLowerCase()).join(' ');
            const recentWasFaq = /(welcome|fine|allowed|bring|include|can i|is it|are.*allowed|photographer|family|partner|guests|questions|feel free|anything else)/i.test(recentAssistantMsgs);
            if (recentWasFaq) {
                logger.debug(`[STRATEGY] Detected acknowledgment, skipping booking flow`);
                return null;
            }
        }
        const extraction = await aiService.extractBookingDetails(message, history, draft);
        logger.debug(`[STRATEGY] Extraction result:`, extraction);
        if (extraction.subIntent === 'cancel') {
            if (bookingsService)
                await bookingsService.deleteBookingDraft(customerId);
            else
                await prisma.bookingDraft.delete({ where: { customerId } }).catch(() => { });
            const response = "No problem at all! I've cancelled your booking request. If you change your mind or need anything else, just let me know! 😊";
            return { response, draft: null, updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: response }] };
        }
        const shouldStartFresh = extraction.subIntent === 'start' && !draft.dateTimeIso && !draft.service && draft.step === 'service';
        if (shouldStartFresh) {
            if (bookingsService)
                await bookingsService.deleteBookingDraft(customerId);
            else
                await prisma.bookingDraft.delete({ where: { customerId } }).catch(() => { });
            draft = await aiService.getOrCreateDraft(customerId);
        }
        draft = await aiService.mergeIntoDraft(customerId, extraction, draft);
        if (extraction.subIntent === 'confirm') {
            if (!draft.recipientPhone && draft.recipientName) {
                const confirmed = await aiService.confirmCustomerPhone(customerId);
                if (confirmed)
                    draft = await aiService.getOrCreateDraft(customerId);
            }
            else if (draft.service && !draft.dateTimeIso) {
                if (draft.step === 'service') {
                    draft = await prisma.bookingDraft.update({ where: { customerId }, data: { step: 'date' } });
                }
            }
        }
        const isSimpleYes = /^(yes|yeah|yep|sure|ok|okay|alright|sounds good|i do|i would|let's do it)$/i.test(message.trim());
        if (isSimpleYes && draft.service && !draft.dateTimeIso) {
            if (draft.step === 'service' || !draft.step) {
                draft = await prisma.bookingDraft.update({ where: { customerId }, data: { step: 'date' } });
            }
        }
        if (draft.service) {
            const packages = bookingsService?.packagesService
                ? await bookingsService.packagesService.findPackageByName(draft.service)
                : await aiService.findPackageByName(draft.service);
            if (!packages) {
                const allPackages = bookingsService?.packagesService
                    ? await bookingsService.packagesService.findAll()
                    : await prisma.package.findMany({ where: { isActive: true } });
                const packageNames = allPackages.map((p) => p.name).join(', ');
                const response = `I don't recognize "${draft.service}". Here are our available packages:\n${packageNames}\n\nWhich one would you like?`;
                return { response, draft, updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: response }] };
            }
        }
        if (draft.date && draft.time && draft.service) {
            const normalized = aiService.normalizeDateTime(draft.date, draft.time);
            if (normalized) {
                const dateObj = new Date(normalized.isoUtc);
                if (dateObj < new Date()) {
                    const response = "I notice that date is in the past. Could you please provide a future date for your booking? 😊";
                    return { response, draft, updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: response }] };
                }
                const avail = await bookingsService.checkAvailability(dateObj, draft.service);
                if (!avail.available) {
                    const completion = { action: 'unavailable', suggestions: avail.suggestions };
                    return this.handleBookingCompletion(completion, message, context, draft);
                }
            }
        }
        const completion = await aiService.checkAndCompleteIfConfirmed(draft, extraction, customerId);
        const completionResponse = await this.handleBookingCompletion(completion, message, context, draft);
        if (completionResponse)
            return completionResponse;
        const response = await aiService.generateBookingReply(message, draft, extraction, history);
        const claimsToSendPayment = /(send.*payment|payment.*prompt|sending.*payment|i.*send|i'll.*send|i will.*send|payment.*request|mpesa.*prompt|finalize.*booking.*deposit|send.*you.*payment|payment.*will.*be|i'm.*sending|sending.*you|let's.*finalize|let.*finalize)/i.test(response);
        const isDraftIncomplete = !draft.service || !draft.date || !draft.time || !draft.name || !draft.recipientPhone;
        if (claimsToSendPayment && isDraftIncomplete) {
            logger.warn(`[SECURITY] AI claimed to send payment but draft is incomplete for customer ${customerId}`);
            const missing = [];
            if (!draft.service)
                missing.push('package');
            if (!draft.date)
                missing.push('date');
            if (!draft.time)
                missing.push('time');
            if (!draft.name)
                missing.push('name');
            if (!draft.recipientPhone)
                missing.push('phone number');
            const response = `I need a few more details to complete your booking: ${missing.join(', ')}. Could you provide that? 💖`;
            return { response, draft, updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: response }] };
        }
        const isFalseConfirmation = /(confirmed booking|Everything is set|booking is confirmed|your booking.*confirmed)/i.test(response) &&
            !(await aiService.getLatestConfirmedBooking(customerId));
        if (isFalseConfirmation) {
            logger.warn(`[SECURITY] Prevented false booking confirmation for customer ${customerId}`);
            const latestPayment = await aiService.getLatestPaymentForDraft(customerId);
            let accurateResponse = "I'm processing your booking details. To complete your booking, please confirm the payment when prompted. 💖";
            if (latestPayment && latestPayment.status === 'pending')
                accurateResponse = `⏳ Your payment is still processing...`;
            else if (latestPayment && latestPayment.status === 'failed')
                accurateResponse = `The previous payment failed. I'll resend it...`;
            return { response: accurateResponse, draft, updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: accurateResponse }] };
        }
        return { response, draft, updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: response }] };
    }
    async handlePlatformRedirection(message, context) {
        const { enrichedContext, logger, history, historyLimit } = context;
        const platform = enrichedContext?.platform;
        if (platform !== 'instagram' && platform !== 'messenger') {
            return null;
        }
        const isBookingOrPaymentKeyword = /(book|appointment|schedule|reserve|available|slot|date|time|when|what time|make a booking|new booking|pay|payment|deposit|mpesa)/i.test(message);
        const isAcknowledgment = this.ACKNOWLEDGMENT_PATTERNS.some(pattern => pattern.test(message)) && !isBookingOrPaymentKeyword;
        if (isAcknowledgment) {
            logger.debug(`[STRATEGY] Detected acknowledgment on ${platform}, skipping booking strategy`);
            return null;
        }
        logger.log(`[STRATEGY] Redirecting ${platform} user to WhatsApp for booking/payment`);
        let waText = "I'm interested in booking a photoshoot";
        if (/(pay|payment|deposit|mpesa)/i.test(message)) {
            waText = "I want to make a payment";
        }
        else if (/(package|pricing|cost)/i.test(message)) {
            waText = "I'm interested in your packages";
        }
        const encodedText = encodeURIComponent(waText);
        const waLink = `https://wa.me/254720111928?text=${encodedText}`;
        const response = `I'd love to help you with that! 💖\n\nTo secure your booking and handle payments securely, please continue this chat on our official WhatsApp.\n\n[Click here to continue on WhatsApp](${waLink})`;
        return {
            response,
            draft: null,
            updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: response }]
        };
    }
    isSimpleAcknowledgment(message) {
        return this.ACKNOWLEDGMENT_PATTERNS.some(pattern => pattern.test(message)) &&
            !/(book|appointment|schedule|reserve|available|slot|date|time|when|what time|make a booking|new booking)/i.test(message);
    }
    async handlePaymentLogic(message, context, draft) {
        const { aiService, logger, history, historyLimit, customerId, bookingsService, prisma } = context;
        const lowerMessage = message.toLowerCase().trim();
        const isResendRequest = this.RESEND_PAYMENT_PATTERNS.some(pattern => pattern.test(message));
        if (isResendRequest) {
            logger.debug(`[PAYMENT] User requesting to resend payment prompt`);
            const latestPayment = bookingsService
                ? await bookingsService.getLatestPaymentForDraft(customerId)
                : await aiService.getLatestPaymentForDraft(customerId);
            if (latestPayment && (latestPayment.status === 'failed' || latestPayment.status === 'pending')) {
                logger.debug(`[PAYMENT] Found ${latestPayment.status} payment, resending prompt`);
                const result = bookingsService
                    ? await bookingsService.resendPaymentPrompt(customerId)
                    : { message: "I'll resend the payment prompt. Please check your phone in a moment! 📲" };
                return {
                    response: result.message,
                    draft: draft || null,
                    updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: result.message }]
                };
            }
            else if (!latestPayment) {
                if (!draft) {
                    return {
                        response: "I don't see any pending payment to retry. Would you like to start a new booking? Just let me know what package you're interested in! 💖",
                        draft: null,
                        updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: "I don't see any pending payment to retry. Would you like to start a new booking? Just let me know what package you're interested in! 💖" }]
                    };
                }
            }
        }
        const isPaymentQuery = /(payment|pay|mpesa|prompt|sent|received|money|paid|transaction|deposit|checkout|check.*payment|payment.*status|didn.*receive|not.*receive|haven.*receive|wrong.*number|change.*number|resend|send.*again|retry|try.*again|try.*payment|retry.*payment|cancel.*payment|payment.*cancel|stuck|frozen|not.*working|payment.*issue|problem.*payment|help.*payment|payment.*help)/i.test(message);
        if (!isPaymentQuery || !draft) {
            return null;
        }
        if (/(didn.*receive|not.*receive|haven.*receive|no.*prompt|didn.*get|not.*get|haven.*get|where.*prompt|when.*prompt|prompt.*not|still.*waiting)/i.test(message)) {
            const latestPayment = bookingsService
                ? await bookingsService.getLatestPaymentForDraft(customerId)
                : await aiService.getLatestPaymentForDraft(customerId);
            if (!latestPayment) {
                if (draft.step === 'confirm') {
                    return null;
                }
                else {
                    return {
                        response: "I haven't sent a payment prompt yet. Let's complete your booking details first, then I'll send the payment request! 📋",
                        draft,
                        updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: "I haven't sent a payment prompt yet. Let's complete your booking details first, then I'll send the payment request! 📋" }]
                    };
                }
            }
            else if (latestPayment.status === 'pending') {
                const phone = latestPayment.phone || draft.recipientPhone;
                const timeSinceSent = Math.floor((Date.now() - new Date(latestPayment.createdAt).getTime()) / 1000 / 60);
                if (timeSinceSent > 5) {
                    const result = bookingsService
                        ? await bookingsService.resendPaymentPrompt(customerId)
                        : { message: "I'll resend the payment prompt. Please check your phone in a moment! 📲" };
                    return {
                        response: `I see the payment prompt was sent ${timeSinceSent} minutes ago and you haven't received it. ${result.message}`,
                        draft,
                        updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: `I see the payment prompt was sent ${timeSinceSent} minutes ago and you haven't received it. ${result.message}` }]
                    };
                }
            }
        }
        if (/(cancel.*payment|payment.*cancel|cancelled.*prompt|prompt.*cancel|declined|rejected|didn.*accept|didn.*complete)/i.test(message)) {
            const latestPayment = bookingsService
                ? await bookingsService.getLatestPaymentForDraft(customerId)
                : await aiService.getLatestPaymentForDraft(customerId);
            if (latestPayment && latestPayment.status === 'pending') {
                await prisma.payment.update({
                    where: { id: latestPayment.id },
                    data: { status: 'failed' }
                });
                return {
                    response: "No problem! I've cancelled that payment request. Would you like me to send it again? Just reply 'yes' or 'resend'. Or say 'cancel booking' to stop. 💖",
                    draft,
                    updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: "No problem! I've cancelled that payment request. Would you like me to send it again? Just reply 'yes' or 'resend'. Or say 'cancel booking' to stop. 💖" }]
                };
            }
        }
        if (/(wrong.*number|incorrect.*number|wrong.*phone|change.*number|update.*number|different.*number|new.*number|correct.*number)/i.test(message)) {
            const phoneMatch = message.match(/(?:0|254)?[17]\d{8}/);
            if (phoneMatch) {
                const newPhone = phoneMatch[0];
                const result = await bookingsService.resendPaymentPrompt(customerId, newPhone);
                return {
                    response: `Got it! I've updated your phone number to ${newPhone}. ${result.message}`,
                    draft,
                    updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: `Got it! I've updated your phone number to ${newPhone}. ${result.message}` }]
                };
            }
            else {
                return {
                    response: "No problem! What's the correct phone number? Please share it and I'll update it and resend the payment prompt. 📱",
                    draft,
                    updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: "No problem! What's the correct phone number? Please share it and I'll update it and resend the payment prompt. 📱" }]
                };
            }
        }
        return null;
    }
    async handleSlotSuggestions(message, context, draft) {
        const { aiService, logger, history, historyLimit, bookingsService, prisma } = context;
        const { DateTime } = require('luxon');
        const isSlotQuery = /(another|other|what.*another|what.*other|so what|give me|show me).*(slot|time|hour)/i.test(message) &&
            !/(book|appointment|schedule|reserve|confirm)/i.test(message);
        if (!isSlotQuery || !draft?.service || !draft?.date) {
            return null;
        }
        const studioTz = this.STUDIO_TIMEZONE;
        const slots = bookingsService
            ? await bookingsService.getAvailableSlotsForDate(draft.date, draft.service)
            : await aiService.getAvailableSlotsForDate(draft.date, draft.service);
        if (slots.length > 0) {
            const prettySlots = slots.slice(0, 8).map((s) => {
                const dt = DateTime.fromISO(s).setZone(studioTz);
                return `- ${dt.toFormat('h:mm a')}`;
            }).join('\n');
            const dateDt = DateTime.fromISO(draft.date).setZone(studioTz);
            const formattedDate = dateDt.toFormat('EEE, MMM d');
            const response = `Here are the available times for ${draft.service} on ${formattedDate}:\n\n${prettySlots}\n\nWhich time would you like to book?`;
            return {
                response,
                draft,
                updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: response }]
            };
        }
        else {
            try {
                const dateObj = DateTime.fromISO(draft.date).setZone(studioTz).toJSDate();
                const alternativeDays = bookingsService
                    ? await bookingsService.findAvailableSlotsAcrossDays(dateObj, draft.service, 7)
                    : [];
                if (alternativeDays.length > 0) {
                    const dayOptions = [];
                    alternativeDays.forEach((dayData) => {
                        const dateDt = DateTime.fromISO(dayData.date).setZone(studioTz);
                        const dateStr = dateDt.toFormat('EEE, MMM d');
                        const slots = dayData.slots
                            .map((s) => {
                            const slotDt = DateTime.fromISO(s).setZone(studioTz);
                            return slotDt.toFormat('h:mm a');
                        })
                            .slice(0, 3)
                            .join(', ');
                        dayOptions.push(`${dateStr}: ${slots}`);
                    });
                    const response = `Unfortunately, ${draft.date} is fully booked. Here are some other available dates:\n\n${dayOptions.join('\n')}\n\nWhich date works best for you?`;
                    return {
                        response,
                        draft,
                        updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: response }]
                    };
                }
                else {
                    const response = `Sorry, ${draft.date} is fully booked, and I couldn't find available slots in the next week. Would you like to:\n\n1. Try a date further in the future\n2. Contact us at 0720 111928 for special arrangements`;
                    return {
                        response,
                        draft,
                        updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: response }]
                    };
                }
            }
            catch (error) {
                logger.error('Error finding alternative days for slot query:', error);
                const response = `Sorry, there are no available slots for ${draft.service} on ${draft.date}. Would you like to try a different date?`;
                return {
                    response,
                    draft,
                    updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: response }]
                };
            }
        }
    }
    async handleBookingCompletion(completion, message, context, draft) {
        const { history, historyLimit, bookingsService, logger, prisma, customerId } = context;
        if (completion.action === 'conflict') {
            const conflictMessage = typeof completion.message === 'string' ? completion.message : 'That time slot is not available.';
            let response = `I'm sorry, but it looks like you already have a booking around that time. ${conflictMessage}`;
            if (completion.suggestions && completion.suggestions.length > 0) {
                const { DateTime } = require('luxon');
                const suggestedTimes = completion.suggestions
                    .map((s, i) => `${i + 1}. ${DateTime.fromISO(s).toFormat('h:mm a, MMM d')}`)
                    .join('\n');
                response += `\n\nHere are some available time slots:\n${suggestedTimes}\n\nWhich one would you prefer? (1-${completion.suggestions.length})`;
            }
            else {
                response += ' Would you like to try a different time?';
            }
            return {
                response,
                draft,
                updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: response }]
            };
        }
        if (completion.action === 'unavailable') {
            const studioTz = this.STUDIO_TIMEZONE;
            const { DateTime } = require('luxon');
            let response = "I'm so sorry, but that slot is already taken. 😔\n\n";
            if (completion.suggestions && completion.suggestions.length > 0) {
                const sameDaySuggestions = completion.suggestions
                    .slice(0, 8)
                    .map((s) => {
                    const dt = typeof s === 'string' && s.includes('T')
                        ? DateTime.fromISO(s).setZone(studioTz)
                        : DateTime.fromJSDate(new Date(s)).setZone(studioTz);
                    return `- ${dt.toFormat('h:mm a')}`;
                })
                    .join('\n');
                response += `Here are some other times I have available on ${draft.date}:\n${sameDaySuggestions}\n\nDo any of these work for you?`;
            }
            else {
                try {
                    if (draft.date && draft.service) {
                        const dateObj = DateTime.fromISO(draft.date).setZone(studioTz).toJSDate();
                        const alternativeDays = bookingsService
                            ? await bookingsService.findAvailableSlotsAcrossDays(dateObj, draft.service, 7)
                            : [];
                        if (alternativeDays.length > 0) {
                            const dayOptions = [];
                            alternativeDays.forEach((dayData) => {
                                const dateDt = DateTime.fromISO(dayData.date).setZone(studioTz);
                                const dateStr = dateDt.toFormat('EEE, MMM d');
                                const slots = dayData.slots
                                    .map((s) => {
                                    const slotDt = DateTime.fromISO(s).setZone(studioTz);
                                    return slotDt.toFormat('h:mm a');
                                })
                                    .slice(0, 3)
                                    .join(', ');
                                dayOptions.push(`${dateStr}: ${slots}`);
                            });
                            response += `Unfortunately, ${draft.date} is fully booked. Here are some other available dates:\n\n${dayOptions.join('\n')}\n\nWhich date works best for you?`;
                        }
                        else {
                            response += `Unfortunately, ${draft.date} is fully booked, and I couldn't find available slots in the next week. Would you like to try a date further in the future, or contact us at 0720 111928?`;
                        }
                    }
                    else {
                        response += `Would you like to try a different date and time?`;
                    }
                }
                catch (error) {
                    logger.error('Error finding alternative days in completion handler:', error);
                    response += `Would you like to try a different date and time?`;
                }
            }
            return { response, draft, updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: response }] };
        }
        if (completion.action === 'ready_for_deposit') {
            if (draft) {
                const isStale = bookingsService
                    ? await bookingsService.isDraftStale(customerId)
                    : false;
                if (isStale) {
                    logger.debug(`[STRATEGY] Stale draft detected when showing booking details, cleaning up`);
                    if (bookingsService) {
                        await bookingsService.cleanupStaleDraft(customerId);
                    }
                    else {
                        await prisma.bookingDraft.delete({ where: { customerId } }).catch(() => { });
                    }
                    return {
                        response: "I notice your previous booking request has expired. Would you like to start a fresh booking? Just let me know what package you're interested in! 💖",
                        draft: null,
                        updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: "I notice your previous booking request has expired. Would you like to start a fresh booking? Just let me know what package you're interested in! 💖" }]
                    };
                }
            }
            if (completion.requiresResend) {
                logger.debug(`[STRATEGY] Resending payment after failed attempt`);
                const result = bookingsService
                    ? await bookingsService.resendPaymentPrompt(customerId)
                    : { message: "I'll resend the payment prompt. Please check your phone in a moment! 📲" };
                return { response: result.message, draft, updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: result.message }] };
            }
            const response = `Great! Here are your booking details:\n\n• Package: ${completion.packageName || 'selected'}\n• Date: ${draft.date}\n• Time: ${draft.time}\n• Name: ${draft.name}\n• Phone: ${draft.recipientPhone}\n\nTo confirm your booking, a deposit of KSH ${completion.amount} is required.\n\nReply with *CONFIRM* to accept and receive the payment prompt. If you need to make changes, just let me know!`;
            return { response, draft, updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: response }] };
        }
        if (completion.action === 'payment_initiated') {
            const response = `Awesome, we're almost done! 🎉\n\nTo lock in your booking for the ${completion.packageName || 'selected'} package, a deposit of KSH ${completion.amount} is required—this helps us secure your spot and prepare everything just for you.\n\nI am now sending the payment prompt to your phone.`;
            return { response, draft, updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: response }] };
        }
        if (completion.action === 'failed') {
            const response = completion.error || "I'm having trouble processing that. Could you please double check the details? 🥺";
            return { response, draft, updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: response }] };
        }
        return null;
    }
}
exports.BookingStrategy = BookingStrategy;
//# sourceMappingURL=booking.strategy.js.map