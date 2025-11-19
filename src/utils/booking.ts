import * as chrono from 'chrono-node';
import { DateTime } from 'luxon';

export function normalizeExtractedDateTime(extracted: { date?: string; time?: string }, referenceDate = new Date(), timezone = 'Africa/Nairobi') {
  // Combine date + time into a single text string for chrono to parse reliably
  const pieces: string[] = [];
  if (extracted.date) pieces.push(extracted.date);
  if (extracted.time) pieces.push(extracted.time);
  const text = pieces.join(' ').trim();

  if (!text) return { dateObj: null, isoDate: null, dateOnly: null, timeOnly: null };

  // chrono.parseDate uses local runtime timezone; if you need a specific timezone, adjust using moment-timezone or keep server in salon TZ.
  const parsed = chrono.parseDate(text, referenceDate);
  if (!parsed || isNaN(parsed.getTime())) {
    return { dateObj: null, isoDate: null, dateOnly: extracted.date || null, timeOnly: extracted.time || null };
  }

  // Normalize time string like "9am" -> "09:00"
  const hours = parsed.getHours().toString().padStart(2, '0');
  const minutes = parsed.getMinutes().toString().padStart(2, '0');
  const isoDate = parsed.toISOString(); // in UTC
  const dateOnly = isoDate.split('T')[0];
  const timeOnly = `${hours}:${minutes}`;

  return { dateObj: parsed, isoDate, dateOnly, timeOnly };
}
