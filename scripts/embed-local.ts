
import * as fs from 'fs';
import * as path from 'path';

// Use the 'sentence-transformers' npm package for local embeddings (MiniLM or similar)
// Install: npm install @xenova/transformers
import { pipeline as hfPipeline } from '@xenova/transformers';

const CHUNKS_PATH = path.resolve(__dirname, '../../docs/website_content_chunks.json');
const OUT_PATH = path.resolve(__dirname, '../../docs/website_content_embeddings.json');

async function main() {
  // Load chunked data
  const chunks = JSON.parse(fs.readFileSync(CHUNKS_PATH, 'utf-8'));

  // Load local embedding model (MiniLM)
  const embed = await hfPipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

  // Generate embeddings for each chunk
  const results = [];
  for (const chunk of chunks) {
    const embedding = await embed(chunk.chunk, { pooling: 'mean', normalize: true });
    results.push({
      ...chunk,
      embedding: Array.from(embedding.data)
    });
    if (results.length % 20 === 0) console.log(`Embedded ${results.length} / ${chunks.length}`);
  }

  // Save to file
  fs.writeFileSync(OUT_PATH, JSON.stringify(results, null, 2));
  console.log(`Saved embeddings to ${OUT_PATH}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
