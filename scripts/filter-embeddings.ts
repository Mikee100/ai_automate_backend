import * as fs from 'fs';
import * as path from 'path';

const EMBEDDINGS_PATH = path.resolve(__dirname, '../../docs/website_content_embeddings.json');
const OUT_PATH = path.resolve(__dirname, '../../docs/website_content_embeddings_filtered.json');

// Keywords to filter out noisy/irrelevant chunks
const NOISY_KEYWORDS = [
  'facebook', 'whatsapp', 'share', 'login', 'recover', 'initiate', 'utm_', 'rss', 'app', 'twitter', 'pinterest', 'linkedin', 'mailto', 'privacy', 'policy', 'terms', 'cookie', 'brand', 'careers', 'help', 'faq', 'contact', 'support', 'central', 'manifest', 'diagnostics', 'zero', 'freemium', 'redirect', 'paym', 'cmon', 'minidt', 'external_reshare'
];

const DOMAIN = 'fiestahouseattire.com';

function isNoisy(row: any) {
  const url = (row.url || '').toLowerCase();
  const title = (row.title || '').toLowerCase();
  // Remove if any noisy keyword is present in url or title, or if not from main domain
  if (!url.includes(DOMAIN)) return true;
  return NOISY_KEYWORDS.some(k => url.includes(k) || title.includes(k));
}

function isMeaningful(row: any) {
  // Remove if chunk is too short or looks like code/json
  if (!row.chunk || row.chunk.length < 50) return false;
  if (/\{.*\}|\[.*\]|\".*\"/.test(row.chunk)) return false;
  return true;
}

function main() {
  const data = JSON.parse(fs.readFileSync(EMBEDDINGS_PATH, 'utf-8'));
  const filtered = data.filter(row => !isNoisy(row) && isMeaningful(row));
  fs.writeFileSync(OUT_PATH, JSON.stringify(filtered, null, 2));
  console.log(`Filtered from ${data.length} to ${filtered.length} chunks. Saved to ${OUT_PATH}`);
}

main();
