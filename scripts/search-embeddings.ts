import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { pipeline as hfPipeline } from '@xenova/transformers';

const EMBEDDINGS_PATH = path.resolve(__dirname, '../../docs/website_content_embeddings_filtered.json');

async function main() {
  // Load embeddings
  const data = JSON.parse(fs.readFileSync(EMBEDDINGS_PATH, 'utf-8'));

  // Load local embedding model
  const embed = await hfPipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

  // Prompt user for a query
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('Enter your search query: ', async (query) => {
    // Embed the query
    const queryEmbedding = await embed(query, { pooling: 'mean', normalize: true });
    const qVec = Array.from(queryEmbedding.data);

    // Compute cosine similarity
    function cosine(a: number[], b: number[]) {
      let dot = 0, normA = 0, normB = 0;
      for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
      }
      return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }


    // Boost homepage/about page for business info queries
    function boostScore(row: any, score: number, query: string) {
      const url = (row.url || '').toLowerCase();
      const title = (row.title || '').toLowerCase();
      // If query is about business name/info, boost homepage/about
      const businessInfoKeywords = ['business name', 'company name', 'who are you', 'about', 'what is the business', 'who owns', 'who runs', 'who founded', 'what do you do', 'what is your name'];
      const isBusinessInfo = businessInfoKeywords.some(k => query.toLowerCase().includes(k));
      if (isBusinessInfo) {
        if (url.endsWith('/') || url.includes('/about') || title.includes('about') || title.includes('home')) {
          return score + 0.2; // boost
        }
      }
      return score;
    }

    // Score all chunks with boost
    const scored = data.map((row: any) => {
      const baseScore = cosine(qVec, row.embedding);
      return {
        ...row,
        score: boostScore(row, baseScore, query)
      };
    });
    scored.sort((a, b) => b.score - a.score);

    // Show top 5 results
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
