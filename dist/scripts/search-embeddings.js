"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const transformers_1 = require("@xenova/transformers");
const EMBEDDINGS_PATH = path.resolve(__dirname, '../../docs/website_content_embeddings_filtered.json');
async function main() {
    const data = JSON.parse(fs.readFileSync(EMBEDDINGS_PATH, 'utf-8'));
    const embed = await (0, transformers_1.pipeline)('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Enter your search query: ', async (query) => {
        const queryEmbedding = await embed(query, { pooling: 'mean', normalize: true });
        const qVec = Array.from(queryEmbedding.data);
        function cosine(a, b) {
            let dot = 0, normA = 0, normB = 0;
            for (let i = 0; i < a.length; i++) {
                dot += a[i] * b[i];
                normA += a[i] * a[i];
                normB += b[i] * b[i];
            }
            return dot / (Math.sqrt(normA) * Math.sqrt(normB));
        }
        function boostScore(row, score, query) {
            const url = (row.url || '').toLowerCase();
            const title = (row.title || '').toLowerCase();
            const businessInfoKeywords = ['business name', 'company name', 'who are you', 'about', 'what is the business', 'who owns', 'who runs', 'who founded', 'what do you do', 'what is your name'];
            const isBusinessInfo = businessInfoKeywords.some(k => query.toLowerCase().includes(k));
            if (isBusinessInfo) {
                if (url.endsWith('/') || url.includes('/about') || title.includes('about') || title.includes('home')) {
                    return score + 0.2;
                }
            }
            return score;
        }
        const scored = data.map((row) => {
            const baseScore = cosine(qVec, row.embedding);
            return {
                ...row,
                score: boostScore(row, baseScore, query)
            };
        });
        scored.sort((a, b) => b.score - a.score);
        console.log('\nTop 5 results:');
        scored.slice(0, 5).forEach((row, i) => {
            console.log(`\n#${i + 1} [${row.score.toFixed(3)}] ${row.url}`);
            console.log(`Title: ${row.title}`);
            console.log(`Chunk: ${row.chunk.substring(0, 300)}...`);
        });
        rl.close();
    });
}
main().catch(err => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=search-embeddings.js.map