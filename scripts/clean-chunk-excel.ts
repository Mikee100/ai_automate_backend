import * as XLSX from 'xlsx';
import { writeFileSync } from 'fs';

// Load the scraped Excel file
const workbook = XLSX.readFile('../../docs/website_content.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json<any>(sheet);

// Only keep rows with your domain and non-empty content
const DOMAIN = 'fiestahouseattire.com';
const filtered = rows.filter(row =>
  typeof row.url === 'string' &&
  row.url.includes(DOMAIN) &&
  row.content &&
  row.content.length > 100 // skip empty or trivial content
);

// Chunk content into ~1000 character pieces
const chunkSize = 1000;
const chunked: any[] = [];
filtered.forEach(row => {
  const content = row.content as string;
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

// Save as JSON for easy embedding
writeFileSync('../../docs/website_content_chunks.json', JSON.stringify(chunked, null, 2));
console.log('Saved cleaned and chunked data to ../../docs/website_content_chunks.json');
