"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chrono = require("chrono-node");
const luxon_1 = require("luxon");
const referenceDate = new Date('2025-12-01T21:00:00+03:00');
const input = "the 5th at 9am";
console.log('Reference Date:', referenceDate.toISOString());
console.log('Input:', input);
const parsed = chrono.parseDate(input, referenceDate);
console.log('Parsed Date:', parsed ? parsed.toISOString() : 'null');
if (parsed) {
    const dt = luxon_1.DateTime.fromJSDate(parsed).setZone('Africa/Nairobi');
    console.log('Formatted (Nairobi):', dt.toFormat('yyyy-MM-dd HH:mm'));
}
//# sourceMappingURL=test-date-parsing-2.js.map