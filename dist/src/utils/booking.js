"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeExtractedDateTime = normalizeExtractedDateTime;
const luxon_1 = require("luxon");
const STUDIO_TZ = 'Africa/Nairobi';
function normalizeExtractedDateTime(extracted) {
    const { date, time } = extracted;
    if (!date && !time)
        return null;
    let combined = [date, time].filter(Boolean).join(' ');
    try {
        const chrono = require('chrono-node');
        let parsed = chrono.parseDate(combined, new Date());
        if (!parsed && date && /^\d{1,2}(st|nd|rd|th)?\s+[A-Za-z]+$/.test(date.trim())) {
            const currentYear = new Date().getFullYear();
            combined = date.trim() + ' ' + currentYear + (time ? ' ' + time : '');
            parsed = chrono.parseDate(combined, new Date());
        }
        if (!parsed) {
            parsed = chrono.parseDate(date ?? time ?? '', new Date());
        }
        if (!parsed) {
            console.warn('Failed to parse date/time:', { date, time, combined });
            return null;
        }
        if (parsed.getFullYear() < 2000) {
            console.warn('Parsed date is likely invalid (before year 2000):', parsed);
            return null;
        }
        const dt = luxon_1.DateTime.fromJSDate(parsed).setZone(STUDIO_TZ);
        return {
            dateObj: dt.toJSDate(),
            isoDate: dt.toUTC().toISO(),
            dateOnly: dt.toFormat('yyyy-MM-dd'),
            timeOnly: dt.toFormat('HH:mm'),
        };
    }
    catch (error) {
        console.warn('Failed to normalize date/time:', error);
        return null;
    }
}
//# sourceMappingURL=booking.js.map