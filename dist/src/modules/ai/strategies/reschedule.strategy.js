"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RescheduleStrategy = void 0;
const luxon_1 = require("luxon");
class RescheduleStrategy {
    constructor() {
        this.priority = 20;
        this.STUDIO_TIMEZONE = 'Africa/Nairobi';
    }
    canHandle(intent, context) {
        const { message, draft } = context;
        if (draft && (draft.step === 'reschedule' || draft.step === 'reschedule_confirm' || draft.step === 'reschedule_select' || draft.bookingId)) {
            return true;
        }
        const isRescheduleIntent = /\b(reschedul\w*)\b/i.test(message) ||
            /(i want to|i'd like to|i need to|can i|can we|help me).*reschedule/i.test(message) ||
            /(change|move|modify|adjust|shift|switch).*(booking|appointment|date|time|shoot|session|slot)/i.test(message) ||
            /\b(change|move|modify|adjust|shift|switch)\b.*\b(it|date|time|to)\s+\d/i.test(message);
        const history = context.history || [];
        const recentAssistantMsgs = history
            .filter((msg) => msg.role === 'assistant')
            .slice(-2)
            .map((msg) => typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content))
            .join(' ');
        const isRespondingToBookingSelection = /Which one would you like to reschedule/i.test(recentAssistantMsgs) ||
            /upcoming bookings/i.test(recentAssistantMsgs) ||
            /reply with the date or service/i.test(recentAssistantMsgs) ||
            /multiple active bookings/i.test(recentAssistantMsgs);
        return isRescheduleIntent || isRespondingToBookingSelection;
    }
    async generateResponse(message, context) {
        const { aiService, logger, history, historyLimit, customerId, prisma, bookingsService, enrichedContext, whatsappService } = context;
        const platform = enrichedContext?.platform || 'whatsapp';
        if (platform !== 'whatsapp') {
            logger.log(`[RESCHEDULE] Platform is ${platform}, redirecting to WhatsApp`);
            const redirectMsg = aiService.getWhatsAppOnlyRedirectMessage();
            return {
                response: redirectMsg,
                draft: null,
                updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: redirectMsg }]
            };
        }
        logger.log(`[RESCHEDULE] Handling reschedule request for customer ${customerId}`);
        let draft = await prisma.bookingDraft.findUnique({ where: { customerId } });
        const getOrdinalSuffix = (day) => {
            const j = day % 10, k = day % 100;
            if (j === 1 && k !== 11)
                return 'st';
            if (j === 2 && k !== 12)
                return 'nd';
            if (j === 3 && k !== 13)
                return 'rd';
            return 'th';
        };
        if (!draft || (draft.step !== 'reschedule' && draft.step !== 'reschedule_confirm' && draft.step !== 'reschedule_select' && !draft.bookingId)) {
            if (draft)
                await prisma.bookingDraft.delete({ where: { customerId } });
            const bookings = await bookingsService.getCustomerBookings(customerId);
            const futureBookings = bookings.filter((b) => b.status === 'confirmed' && new Date(b.dateTime) > new Date());
            if (futureBookings.length === 0) {
                const msg = "I'd love to help you reschedule, but I can't find an upcoming booking for you. Would you like to make a new one? 💖";
                return { response: msg, draft: null, updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
            }
            let targetBooking = futureBookings[0];
            let dateMatch = null;
            dateMatch = message.match(/(\d{1,2})(st|nd|rd|th)?\s*(dec|december|jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|september|oct|october|nov|november)/i);
            if (dateMatch && futureBookings.length > 1) {
                const day = parseInt(dateMatch[1]);
                const monthStr = dateMatch[3].toLowerCase();
                const monthMap = {
                    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
                    apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
                    aug: 7, august: 7, sep: 8, september: 8, oct: 9, october: 9,
                    nov: 10, november: 10, dec: 11, december: 11
                };
                const month = monthMap[monthStr];
                const matchedBooking = futureBookings.find((b) => {
                    const bookingDt = luxon_1.DateTime.fromJSDate(new Date(b.dateTime)).setZone(this.STUDIO_TIMEZONE);
                    return bookingDt.month === month + 1 && bookingDt.day === day;
                });
                if (matchedBooking) {
                    targetBooking = matchedBooking;
                    logger.log(`[RESCHEDULE] User specified booking on ${day} ${monthStr}, matched booking ID ${matchedBooking.id}`);
                }
            }
            else if (/\b(the one|that one|this one)\b/i.test(message) && futureBookings.length > 1) {
                const dayOnlyMatch = message.match(/(?:the one on |on )?(\d{1,2})(?:st|nd|rd|th)?/i);
                if (dayOnlyMatch) {
                    const day = parseInt(dayOnlyMatch[1]);
                    const matchedBookings = futureBookings.filter((b) => {
                        const bookingDt = luxon_1.DateTime.fromJSDate(new Date(b.dateTime)).setZone(this.STUDIO_TIMEZONE);
                        return bookingDt.day === day;
                    });
                    if (matchedBookings.length === 1) {
                        targetBooking = matchedBookings[0];
                        dateMatch = dayOnlyMatch;
                        logger.log(`[RESCHEDULE] User specified booking on day ${day}, matched booking ID ${targetBooking.id}`);
                    }
                }
            }
            if (futureBookings.length > 1 && !dateMatch) {
                if (whatsappService) {
                    const sections = [{
                            title: "Your Bookings",
                            rows: futureBookings.slice(0, 10).map((b) => {
                                const dt = luxon_1.DateTime.fromJSDate(new Date(b.dateTime)).setZone(this.STUDIO_TIMEZONE);
                                return {
                                    id: `reschedule_${b.id}`,
                                    title: dt.toFormat('MMM dd, h:mm a'),
                                    description: b.service
                                };
                            })
                        }];
                    await whatsappService.sendInteractiveList(customerId, "I found multiple upcoming bookings. Which one would you like to reschedule?", "Select Booking", sections);
                    await prisma.bookingDraft.create({
                        data: {
                            customerId,
                            step: 'reschedule_select',
                            data: {}
                        }
                    });
                    return {
                        response: "_Processing booking selection via list..._",
                        updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: "Please select a booking from the list above." }]
                    };
                }
                else {
                    const bookingsList = futureBookings.map((b, idx) => {
                        const dt = luxon_1.DateTime.fromJSDate(new Date(b.dateTime)).setZone(this.STUDIO_TIMEZONE);
                        return `${idx + 1}️⃣ ${b.service} on ${dt.toFormat('MMM dd, yyyy')} at ${dt.toFormat('h:mm a')}`;
                    }).join('\n');
                    const msg = `You have ${futureBookings.length} upcoming bookings:\n\n${bookingsList}\n\nWhich one would you like to reschedule? Just tell me the date (e.g., "the one on Dec 6th") 🗓️`;
                    return { response: msg, draft: null, updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
                }
            }
            const now = new Date();
            const bookingTime = new Date(targetBooking.dateTime);
            const hoursDiff = (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60);
            if (hoursDiff < 72 && hoursDiff > 0) {
                const bookingDt = luxon_1.DateTime.fromJSDate(targetBooking.dateTime).setZone(this.STUDIO_TIMEZONE);
                if (aiService.createEscalationAlert) {
                    await aiService.createEscalationAlert(customerId, 'reschedule_request', 'Reschedule Request - Within 72 Hours', `Customer requested to reschedule booking "${targetBooking.service}" scheduled for ${bookingDt.toFormat('MMMM dd, yyyy')} at ${bookingDt.toFormat('h:mm a')}. Only ${Math.round(hoursDiff)} hours until booking.`, {
                        bookingId: targetBooking.id,
                        hoursUntilBooking: Math.round(hoursDiff),
                        originalDateTime: targetBooking.dateTime,
                    });
                }
                const msg = `Rescheduling is only allowed at least 72 hours before your booking. Please contact support for urgent changes. 😓`;
                return { response: msg, draft: null, updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
            }
            await prisma.bookingDraft.create({
                data: {
                    customerId,
                    step: 'reschedule_date',
                    bookingId: targetBooking.id,
                    service: targetBooking.service,
                    data: {
                        originalDate: targetBooking.dateTime
                    }
                }
            });
            const msg = `Sure thing! You want to reschedule your *${targetBooking.service}* on ${luxon_1.DateTime.fromJSDate(new Date(targetBooking.dateTime)).setZone(this.STUDIO_TIMEZONE).toFormat('MMM dd')}. What new date and time works for you? 🗓️`;
            return { response: msg, draft: null, updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
        }
        if (draft.step === 'reschedule_select') {
            const bookings = await bookingsService.getCustomerBookings(customerId);
            let foundId = null;
            const matched = bookings.find((b) => {
                const dt = luxon_1.DateTime.fromJSDate(new Date(b.dateTime)).setZone(this.STUDIO_TIMEZONE);
                const title = dt.toFormat('MMM dd, h:mm a');
                return message.includes(title);
            });
            if (matched)
                foundId = matched.id;
            if (!foundId) {
                const dayOnlyMatch = message.match(/(\d{1,2})(st|nd|rd|th)?/i);
                if (dayOnlyMatch) {
                    const day = parseInt(dayOnlyMatch[1]);
                    const matchedBookings = bookings.filter((b) => {
                        const bookingDt = luxon_1.DateTime.fromJSDate(new Date(b.dateTime)).setZone(this.STUDIO_TIMEZONE);
                        return bookingDt.day === day;
                    });
                    if (matchedBookings.length === 1)
                        foundId = matchedBookings[0].id;
                }
            }
            if (foundId) {
                const booking = bookings.find((b) => b.id === foundId);
                const now = new Date();
                const bookingTime = new Date(booking.dateTime);
                const hoursDiff = (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60);
                if (hoursDiff < 72 && hoursDiff > 0) {
                    const msg = `Rescheduling is only allowed at least 72 hours before your booking. Please contact support.`;
                    await prisma.bookingDraft.delete({ where: { customerId } });
                    return { response: msg, draft: null, updatedHistory: history };
                }
                await prisma.bookingDraft.update({
                    where: { customerId },
                    data: {
                        step: 'reschedule_date',
                        bookingId: foundId,
                        service: booking.service
                    }
                });
                const msg = `Got it! Rescheduling *${booking.service}*. What new date and time would you like? 🗓️`;
                return { response: msg, draft, updatedHistory: [...history, { role: 'user', content: message }, { role: 'assistant', content: msg }] };
            }
            const msg = "I didn't quite catch which booking. Could you select from the list or type the date? 🌸";
            return { response: msg, draft, updatedHistory: [...history, { role: 'user', content: message }, { role: 'assistant', content: msg }] };
        }
        if (draft.step === 'reschedule_date' || draft.step === 'reschedule') {
            let extraction = await aiService.extractBookingDetails(message, luxon_1.DateTime.now().setZone(this.STUDIO_TIMEZONE).toFormat('yyyy-MM-dd'));
            if (!extraction.date || !extraction.time) {
                const msg = "Could you please specify both the date and time you'd prefer? (e.g., 'Next Friday at 2pm') 🌸";
                return { response: msg, draft, updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
            }
            const serviceName = draft.service || 'Standard';
            const slots = await bookingsService.getAvailableSlotsForDate(extraction.date, serviceName);
            const requestedTime = extraction.time.replace('.', ':');
            const requestedHour = parseInt(requestedTime.split(':')[0]);
            const isAvailable = slots.some((slot) => {
                const slotDt = luxon_1.DateTime.fromISO(slot).setZone(this.STUDIO_TIMEZONE);
                return slotDt.hour === requestedHour;
            });
            if (!isAvailable) {
                const availableTimes = slots.map((s) => luxon_1.DateTime.fromISO(s).setZone(this.STUDIO_TIMEZONE).toFormat('h:mm a')).join(', ');
                const msg = `Sorry, that time isn't available. Here are some open slots on ${extraction.date}: ${availableTimes}. Which one works for you?`;
                return { response: msg, draft, updatedHistory: [...history.slice(-historyLimit), { role: 'user', content: message }, { role: 'assistant', content: msg }] };
            }
            const prettyDate = `${extraction.date} at ${extraction.time}`;
            const confirmMsg = `Great! Confirming reschedule to *${prettyDate}*. Is this correct?`;
            if (whatsappService) {
                await whatsappService.sendInteractiveButtons(customerId, confirmMsg, [
                    { id: 'reschedule_yes', title: 'Yes, confirm' },
                    { id: 'reschedule_no', title: 'No, change' }
                ]);
                await prisma.bookingDraft.update({
                    where: { customerId },
                    data: {
                        step: 'reschedule_confirm',
                        dateTimeIso: `${extraction.date}T${extraction.time}:00`
                    }
                });
                return { response: "_Asking for confirmation_", draft, updatedHistory: history };
            }
            else {
                const msg = `${confirmMsg} (Reply 'Yes' to confirm)`;
                await prisma.bookingDraft.update({
                    where: { customerId },
                    data: {
                        step: 'reschedule_confirm',
                        dateTimeIso: `${extraction.date}T${extraction.time}:00`
                    }
                });
                return { response: msg, draft, updatedHistory: [...history, { role: 'user', content: message }, { role: 'assistant', content: msg }] };
            }
        }
        if (draft.step === 'reschedule_confirm') {
            if (/(yes|confirm|do it)/i.test(message)) {
                if (!draft.bookingId || !draft.dateTimeIso) {
                    const msg = "I lost track of the booking details. Let's start over. 😓";
                    await prisma.bookingDraft.delete({ where: { customerId } });
                    return { response: msg, draft: null, updatedHistory: history };
                }
                await bookingsService.updateBooking(draft.bookingId, { dateTime: new Date(draft.dateTimeIso) });
                await prisma.bookingDraft.delete({ where: { customerId } });
                const msg = "✅ Done! Your appointment has been updated. See you then! 💖";
                return { response: msg, draft: null, updatedHistory: [...history, { role: 'user', content: message }, { role: 'assistant', content: msg }] };
            }
            else if (/(no|change|cancel)/i.test(message)) {
                await prisma.bookingDraft.update({
                    where: { customerId },
                    data: { step: 'reschedule_date' }
                });
                const msg = "No problem! What date and time works better? 🗓️";
                return { response: msg, draft, updatedHistory: [...history, { role: 'user', content: message }, { role: 'assistant', content: msg }] };
            }
        }
        return null;
    }
}
exports.RescheduleStrategy = RescheduleStrategy;
//# sourceMappingURL=reschedule.strategy.js.map