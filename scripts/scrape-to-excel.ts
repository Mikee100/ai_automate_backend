import axios from 'axios';
import * as cheerio from 'cheerio';
import * as XLSX from 'xlsx';
import { readFileSync, writeFileSync } from 'fs';

// Read URLs from markdown file
const urlFile = '../../docs/WEBSITE_URLS.md';
const urlLines = readFileSync(urlFile, 'utf-8').split('\n');
const urls = urlLines.filter(line => line.startsWith('http'));

interface PageData {
  url: string;
  title: string;
  headings: string;
  content: string;
}

async function scrapePage(url: string): Promise<PageData> {
  try {
    const res = await axios.get(url, { timeout: 15000 });
    const $ = cheerio.load(res.data);
    const title = $('title').text().trim();
    const headings = $('h1, h2, h3').map((_, el) => $(el).text().trim()).get().join(' | ');
    // Try to get main content (fallback to all text)
    let content = $('main').text().trim();
    if (!content) content = $('body').text().trim();
    content = content.replace(/\s+/g, ' ');
    // Truncate to 30,000 chars for Excel safety
    if (content.length > 30000) content = content.slice(0, 30000);
    return { url, title, headings, content };
  } catch (e) {
    return { url, title: '', headings: '', content: `ERROR: ${(e as Error).message}` };
  }
}

(async () => {
  const results: PageData[] = [];
  for (const url of urls) {
    console.log('Scraping:', url);
    const data = await scrapePage(url);
    results.push(data);
  }
  // Write to Excel
  const worksheet = XLSX.utils.json_to_sheet(results);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Website Content');
  XLSX.writeFile(workbook, '../../docs/website_content.xlsx');
  console.log('Saved to ../../docs/website_content.xlsx');
})();
