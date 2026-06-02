"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const transformers_1 = require("@xenova/transformers");
const CHUNKS_PATH = path.resolve(__dirname, '../../docs/website_content_chunks.json');
const OUT_PATH = path.resolve(__dirname, '../../docs/website_content_embeddings.json');
async function main() {
    const chunks = JSON.parse(fs.readFileSync(CHUNKS_PATH, 'utf-8'));
    const embed = await (0, transformers_1.pipeline)('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    const results = [];
    for (const chunk of chunks) {
        const embedding = await embed(chunk.chunk, { pooling: 'mean', normalize: true });
        results.push({
            ...chunk,
            embedding: Array.from(embedding.data)
        });
        if (results.length % 20 === 0)
            console.log(`Embedded ${results.length} / ${chunks.length}`);
    }
    fs.writeFileSync(OUT_PATH, JSON.stringify(results, null, 2));
    console.log(`Saved embeddings to ${OUT_PATH}`);
}
main().catch(err => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=embed-local.js.map