/**
 * Knowledge Search Service
 * 
 * Searches the Omnis knowledge base (Supabase + pgvector) using semantic similarity.
 * Uses the same embedding model as the scraper: Xenova/all-MiniLM-L6-v2 (384 dims).
 */

const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

let pipeline = null;
let embedder = null;
let supabase = null;

/**
 * Lazy-load the transformer pipeline (singleton)
 */
async function getEmbedder() {
  if (embedder) return embedder;

  if (!pipeline) {
    // Dynamic import for ESM module
    const { pipeline: pipelineFn } = await import('@xenova/transformers');
    pipeline = pipelineFn;
  }

  logger.info('Loading embedding model Xenova/all-MiniLM-L6-v2...');
  embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  logger.info('Embedding model loaded');
  return embedder;
}

/**
 * Get Supabase client (singleton)
 */
function getSupabase() {
  if (supabase) return supabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
  }

  supabase = createClient(url, key);
  return supabase;
}

/**
 * Generate embedding for a query string
 */
async function embed(text) {
  const model = await getEmbedder();
  const output = await model(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

/**
 * Search the knowledge base for relevant chunks
 * @param {string} query - Search query
 * @param {number} matchCount - Number of results (default 5)
 * @param {number} threshold - Similarity threshold (default 0.3)
 * @returns {Array<{title: string, url: string, excerpt: string, similarity: number}>}
 */
async function searchKnowledge(query, matchCount = 5, threshold = 0.3) {
  const queryEmbedding = await embed(query);
  const client = getSupabase();

  const { data, error } = await client.rpc('search_knowledge', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: matchCount,
  });

  if (error) {
    logger.error('Knowledge search RPC error:', error.message);
    throw error;
  }

  return (data || []).map(chunk => ({
    title: chunk.title || chunk.source_title || 'Unknown',
    url: chunk.url || chunk.source_url || '',
    excerpt: chunk.content || chunk.chunk_text || '',
    similarity: chunk.similarity,
  }));
}

/**
 * Run multiple searches in parallel, deduplicate results
 * @param {string[]} queries - Array of search queries
 * @param {number} perQuery - Results per query
 * @returns {Array<{title: string, url: string, excerpt: string, similarity: number}>}
 */
async function multiSearch(queries, perQuery = 3) {
  const results = await Promise.all(
    queries.map(q => searchKnowledge(q, perQuery).catch(err => {
      logger.warn(`Knowledge search failed for "${q}":`, err.message);
      return [];
    }))
  );

  // Flatten and deduplicate by excerpt
  const seen = new Set();
  const deduped = [];
  for (const batch of results) {
    for (const item of batch) {
      const key = item.excerpt.substring(0, 100);
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(item);
      }
    }
  }

  // Sort by similarity descending
  deduped.sort((a, b) => b.similarity - a.similarity);
  return deduped;
}

/**
 * Pre-warm the embedding model (call at startup if desired)
 */
async function warmup() {
  try {
    await getEmbedder();
  } catch (err) {
    logger.warn('Knowledge search warmup failed:', err.message);
  }
}

module.exports = { searchKnowledge, multiSearch, warmup };
