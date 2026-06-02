"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const cheerio = require("cheerio");
const fs_1 = require("fs");
const START_URLS = [
    'https://fiestahouseattire.com/',
    'https://fiestahouseattire.com/new',
];
const DOMAIN = 'fiestahouseattire.com';
const visited = new Set();
const discovered = [];
async function crawl(url) {
    if (visited.has(url))
        return;
    visited.add(url);
    try {
        const res = await axios_1.default.get(url, { timeout: 10000 });
        const $ = cheerio.load(res.data);
        discovered.push(url);
        const links = $('a[href]')
            .map((_, el) => $(el).attr('href'))
            .get()
            .filter(Boolean)
            .map((href) => {
            if (href.startsWith('/'))
                return `https://${DOMAIN}${href}`;
            if (href.startsWith('https://') && href.includes(DOMAIN))
                return href;
            return null;
        })
            .filter((href) => !!href);
        for (const link of links) {
            if (!visited.has(link))
                await crawl(link);
        }
    }
    catch (e) {
    }
}
(async () => {
    for (const url of START_URLS) {
        await crawl(url);
    }
    const unique = Array.from(new Set(discovered));
    (0, fs_1.writeFileSync)('docs/WEBSITE_URLS.md', '# Discovered Website URLs\n\n' + unique.join('\n') + '\n');
    console.log(`Discovered ${unique.length} URLs. Saved to docs/WEBSITE_URLS.md`);
})();
//# sourceMappingURL=crawl-website.js.map