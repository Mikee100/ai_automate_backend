import { DateTime } from 'luxon';

// Studio timezone
const STUDIO_TZ = 'Africa/Nairobi';

/**
 * Normalize extracted date and time strings into a structured object.
 * Handles various formats and ensures consistency.
 */
export function normalizeExtractedDateTime(extracted: { date?: string; time?: string }): {
  dateObj: Date;
  isoDate: string;
  dateOnly: string;
  timeOnly: string;
} | null {
  const { date, time } = extracted;

  if (!date && !time) return null;

  // Combine date and time for parsing
  let combined = [date, time].filter(Boolean).join(' ');

  try {
    const chrono = require('chrono-node');
    let parsed = chrono.parseDate(combined, new Date());

    // If parsing failed, try to add current year if missing (e.g., '5th Dec')
    if (!parsed && date && /^\d{1,2}(st|nd|rd|th)?\s+[A-Za-z]+$/.test(date.trim())) {
      const currentYear = new Date().getFullYear();
      combined = date.trim() + ' ' + currentYear + (time ? ' ' + time : '');
      parsed = chrono.parseDate(combined, new Date());
    }

    // If still not parsed, try parsing date only or time only
    if (!parsed) {
      parsed = chrono.parseDate(date ?? time ?? '', new Date());
    }

    // If still not parsed, return null and log error
    if (!parsed) {
      console.warn('Failed to parse date/time:', { date, time, combined });
      return null;
    }

    // If parsed date is before 2000, treat as invalid (likely fallback to 1970)
    if (parsed.getFullYear() < 2000) {
      console.warn('Parsed date is likely invalid (before year 2000):', parsed);
      return null;
    }

    // Convert to studio timezone
    const dt = DateTime.fromJSDate(parsed).setZone(STUDIO_TZ);

    return {
      dateObj: dt.toJSDate(),
      isoDate: dt.toUTC().toISO(),
      dateOnly: dt.toFormat('yyyy-MM-dd'),
      timeOnly: dt.toFormat('HH:mm'),
    };
  } catch (error) {
    console.warn('Failed to normalize date/time:', error);
    return null;
  }
}
