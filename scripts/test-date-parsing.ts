
import * as chrono from 'chrono-node';
import { DateTime } from 'luxon';

const referenceDate = new Date('2025-12-01T21:00:00+03:00'); // The time from the user report
const input = "5th at 9am";

console.log('Reference Date:', referenceDate.toISOString());
console.log('Input:', input);

const parsed = chrono.parseDate(input, referenceDate);
console.log('Parsed Date:', parsed ? parsed.toISOString() : 'null');

if (parsed) {
    const dt = DateTime.fromJSDate(parsed).setZone('Africa/Nairobi');
    console.log('Formatted (Nairobi):', dt.toFormat('yyyy-MM-dd HH:mm'));
}

// Test just "5th"
const input2 = "5th";
const parsed2 = chrono.parseDate(input2, referenceDate);
console.log('\nInput:', input2);
console.log('Parsed Date:', parsed2 ? parsed2.toISOString() : 'null');
