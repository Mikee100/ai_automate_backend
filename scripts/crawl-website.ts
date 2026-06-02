require('events').EventEmitter.defaultMaxListeners = 30;
import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';

const START_URLS = [
  'https://fiestahouseattire.com/',
  'https://fiestahouseattire.com/new',
];
const DOMAIN = 'fiestahouseattire.com';

const visited = new Set<string>();
const discovered: string[] = [];
const MAX_PAGES = 50;


async function crawl(url: string) {
  if (visited.has(url)) return;
  if (discovered.length >= MAX_PAGES) return;
  visited.add(url);
  console.log(`Visiting: ${url}`);
  try {
    const res = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(res.data);
    discovered.push(url);
    const links = $('a[href]')
      .map((_, el) => $(el).attr('href'))
      .get()
      .filter(Boolean)
      .map((href) => {
        if (href.startsWith('/')) return `https://${DOMAIN}${href}`;
        if (href.startsWith('https://') && href.includes(DOMAIN)) return href;
        return null;
      })
      .filter((href): href is string => !!href);
    for (const link of links) {
      if (!visited.has(link) && discovered.length < MAX_PAGES) await crawl(link);
    }
  } catch (e) {
    console.log(`Error visiting ${url}:`, (e as Error).message);
  }
}

(async () => {
  for (const url of START_URLS) {
    await crawl(url);
  }
  const unique = Array.from(new Set(discovered));
  writeFileSync(
    '../../docs/WEBSITE_URLS.md',
    '# Discovered Website URLs\n\n' + unique.join('\n') + '\n'
  );
  console.log(`Discovered ${unique.length} URLs. Saved to ../../docs/WEBSITE_URLS.md`);
})();
