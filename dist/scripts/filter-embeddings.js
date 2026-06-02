"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const EMBEDDINGS_PATH = path.resolve(__dirname, '../../docs/website_content_embeddings.json');
const OUT_PATH = path.resolve(__dirname, '../../docs/website_content_embeddings_filtered.json');
const NOISY_KEYWORDS = [
    'facebook', 'whatsapp', 'share', 'login', 'recover', 'initiate', 'utm_', 'rss', 'app', 'twitter', 'pinterest', 'linkedin', 'mailto', 'privacy', 'policy', 'terms', 'cookie', 'brand', 'careers', 'help', 'faq', 'contact', 'support', 'central', 'manifest', 'diagnostics', 'zero', 'freemium', 'redirect', 'paym', 'cmon', 'minidt', 'external_reshare'
];
const DOMAIN = 'fiestahouseattire.com';
function isNoisy(row) {
    const url = (row.url || '').toLowerCase();
    const title = (row.title || '').toLowerCase();
    if (!url.includes(DOMAIN))
        return true;
    return NOISY_KEYWORDS.some(k => url.includes(k) || title.includes(k));
}
function isMeaningful(row) {
    if (!row.chunk || row.chunk.length < 50)
        return false;
    if (/\{.*\}|\[.*\]|\".*\"/.test(row.chunk))
        return false;
    return true;
}
function main() {
    const data = JSON.parse(fs.readFileSync(EMBEDDINGS_PATH, 'utf-8'));
    const filtered = data.filter(row => !isNoisy(row) && isMeaningful(row));
    fs.writeFileSync(OUT_PATH, JSON.stringify(filtered, null, 2));
    console.log(`Filtered from ${data.length} to ${filtered.length} chunks. Saved to ${OUT_PATH}`);
}
main();
//# sourceMappingURL=filter-embeddings.js.map