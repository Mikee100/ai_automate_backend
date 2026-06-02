"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const cheerio = require("cheerio");
const XLSX = require("xlsx");
const fs_1 = require("fs");
const urlFile = '../../docs/WEBSITE_URLS.md';
const urlLines = (0, fs_1.readFileSync)(urlFile, 'utf-8').split('\n');
const urls = urlLines.filter(line => line.startsWith('http'));
async function scrapePage(url) {
    try {
        const res = await axios_1.default.get(url, { timeout: 15000 });
        const $ = cheerio.load(res.data);
        const title = $('title').text().trim();
        const headings = $('h1, h2, h3').map((_, el) => $(el).text().trim()).get().join(' | ');
        let content = $('main').text().trim();
        if (!content)
            content = $('body').text().trim();
        content = content.replace(/\s+/g, ' ');
        if (content.length > 30000)
            content = content.slice(0, 30000);
        return { url, title, headings, content };
    }
    catch (e) {
        return { url, title: '', headings: '', content: `ERROR: ${e.message}` };
    }
}
(async () => {
    const results = [];
    for (const url of urls) {
        console.log('Scraping:', url);
        const data = await scrapePage(url);
        results.push(data);
    }
    const worksheet = XLSX.utils.json_to_sheet(results);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Website Content');
    XLSX.writeFile(workbook, '../../docs/website_content.xlsx');
    console.log('Saved to ../../docs/website_content.xlsx');
})();
//# sourceMappingURL=scrape-to-excel.js.map