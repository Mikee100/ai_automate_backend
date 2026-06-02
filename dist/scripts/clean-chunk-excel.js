"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const XLSX = require("xlsx");
const fs_1 = require("fs");
const workbook = XLSX.readFile('../../docs/website_content.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet);
const DOMAIN = 'fiestahouseattire.com';
const filtered = rows.filter(row => typeof row.url === 'string' &&
    row.url.includes(DOMAIN) &&
    row.content &&
    row.content.length > 100);
const chunkSize = 1000;
const chunked = [];
filtered.forEach(row => {
    const content = row.content;
    for (let i = 0; i < content.length; i += chunkSize) {
        chunked.push({
            url: row.url,
            title: row.title,
            headings: row.headings,
            chunk: content.slice(i, i + chunkSize),
            chunk_index: Math.floor(i / chunkSize)
        });
    }
});
(0, fs_1.writeFileSync)('../../docs/website_content_chunks.json', JSON.stringify(chunked, null, 2));
console.log('Saved cleaned and chunked data to ../../docs/website_content_chunks.json');
//# sourceMappingURL=clean-chunk-excel.js.map