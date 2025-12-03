
import * as chrono from 'chrono-node';
import { DateTime } from 'luxon';

const referenceDate = new Date('2025-12-01T21:00:00+03:00');
const input = "2025-12-05 at 9am";

console.log('Reference Date:', referenceDate.toISOString());
console.log('Input:', input);

const parsed = chrono.parseDate(input, referenceDate);
console.log('Parsed Date:', parsed ? parsed.toISOString() : 'null');

if (parsed) {
    const dt = DateTime.fromJSDate(parsed).setZone('Africa/Nairobi');
    console.log('Formatted (Nairobi):', dt.toFormat('yyyy-MM-dd HH:mm'));
}
