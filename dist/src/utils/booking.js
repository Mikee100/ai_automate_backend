"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeExtractedDateTime = normalizeExtractedDateTime;
const chrono = require("chrono-node");
function normalizeExtractedDateTime(extracted, referenceDate = new Date(), timezone = 'Africa/Nairobi') {
    const pieces = [];
    if (extracted.date)
        pieces.push(extracted.date);
    if (extracted.time)
        pieces.push(extracted.time);
    const text = pieces.join(' ').trim();
    if (!text)
        return { dateObj: null, isoDate: null, dateOnly: null, timeOnly: null };
    const parsed = chrono.parseDate(text, referenceDate);
    if (!parsed || isNaN(parsed.getTime())) {
        return { dateObj: null, isoDate: null, dateOnly: extracted.date || null, timeOnly: extracted.time || null };
    }
    const hours = parsed.getHours().toString().padStart(2, '0');
    const minutes = parsed.getMinutes().toString().padStart(2, '0');
    const isoDate = parsed.toISOString();
    const dateOnly = isoDate.split('T')[0];
    const timeOnly = `${hours}:${minutes}`;
    return { dateObj: parsed, isoDate, dateOnly, timeOnly };
}
//# sourceMappingURL=booking.js.map