---
title: Batch Processing Opportunities
impact: LOW
impactDescription: Unnecessary API calls, higher latency, increased costs
tags: optimization, batch, performance, efficiency
category: optimization
---

## Batch Processing Opportunities

**Impact: LOW (Unnecessary API calls, higher latency, increased costs)**

When processing multiple items, batching reduces API overhead and often
provides better throughput. Sequential processing of many items wastes
time and may hit rate limits.

### What to Check

- Multiple similar operations are batched
- Embeddings are generated in batches, not one-by-one
- Parallel processing used for independent operations
- Rate limits are respected with proper batching
- Batch sizes are optimized for the API

### Incorrect Configuration

```typescript
// Sequential: Slow and wasteful
async function processDocuments(documents: string[]) {
  const results = [];
  for (const doc of documents) {
    // One API call per document - slow!
    const embedding = await embedder.embed(doc);
    results.push(embedding);
  }
  return results;
}

// Sequential agent calls
async function analyzeItems(items: Item[]) {
  const analyses = [];
  for (const item of items) {
    // Sequential - doesn't utilize parallel capacity
    const analysis = await agent.generate(`Analyze: ${item.description}`);
    analyses.push(analysis);
  }
  return analyses;
}

// One-by-one vector storage
async function storeEmbeddings(chunks: Chunk[], vectorStore: VectorStore) {
  for (const chunk of chunks) {
    // Individual upserts - very slow
    await vectorStore.upsert([{
      id: chunk.id,
      vector: chunk.embedding,
      metadata: chunk.metadata,
    }]);
  }
}
```

### Correct Configuration

```typescript
import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";

// Batch embeddings - much faster
async function processDocuments(documents: string[]) {
  // Single API call for multiple documents
  const { embeddings } = await embedMany({
    model: openai.embedding("text-embedding-3-small"),
    values: documents,
  });
  return embeddings;
}

// Parallel processing with concurrency control
async function analyzeItems(items: Item[], concurrency = 5) {
  const results: Analysis[] = [];
  const chunks = chunkArray(items, concurrency);

  for (const chunk of chunks) {
    // Process chunk in parallel
    const chunkResults = await Promise.all(
      chunk.map(item =>
        agent.generate(`Analyze: ${item.description}`)
      )
    );
    results.push(...chunkResults);
  }

  return results;
}

// Helper to chunk arrays
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Batch vector upserts
async function storeEmbeddings(chunks: Chunk[], vectorStore: VectorStore) {
  const BATCH_SIZE = 100;  // Most vector DBs handle 100+ well

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    await vectorStore.upsert(
      batch.map(chunk => ({
        id: chunk.id,
        vector: chunk.embedding,
        metadata: chunk.metadata,
      }))
    );
  }
}
```

### RAG Pipeline Batching

```typescript
import { MDocument, chunk, embedMany } from "@mastra/rag";

// Efficient RAG ingestion pipeline
async function ingestDocuments(documents: MDocument[]) {
  // 1. Chunk all documents
  const allChunks: Chunk[] = [];
  for (const doc of documents) {
    const chunks = await chunk(doc, {
      strategy: "recursive",
      size: 512,
      overlap: 50,
    });
    allChunks.push(...chunks);
  }

  // 2. Batch embed all chunks
  const EMBED_BATCH_SIZE = 100;  // OpenAI limit
  const embeddings: number[][] = [];

  for (let i = 0; i < allChunks.length; i += EMBED_BATCH_SIZE) {
    const batch = allChunks.slice(i, i + EMBED_BATCH_SIZE);
    const { embeddings: batchEmbeddings } = await embedMany({
      model: openai.embedding("text-embedding-3-small"),
      values: batch.map(c => c.text),
    });
    embeddings.push(...batchEmbeddings);
  }

  // 3. Batch upsert to vector store
  const UPSERT_BATCH_SIZE = 100;
  const records = allChunks.map((chunk, i) => ({
    id: chunk.id,
    vector: embeddings[i],
    metadata: { text: chunk.text, source: chunk.source },
  }));

  for (let i = 0; i < records.length; i += UPSERT_BATCH_SIZE) {
    await vectorStore.upsert(records.slice(i, i + UPSERT_BATCH_SIZE));
  }

  console.log(`Ingested ${documents.length} docs, ${allChunks.length} chunks`);
}
```

### Workflow Parallel Steps

```typescript
// Parallel workflow steps for independent operations
const parallelWorkflow = new Workflow({
  id: "parallel-analysis",
})
  .step("fetch-data", {
    execute: async () => fetchData(),
  })
  .parallel([
    // These steps run concurrently
    step("analyze-sentiment", {
      execute: async ({ data }) => analyzeSentiment(data),
    }),
    step("extract-entities", {
      execute: async ({ data }) => extractEntities(data),
    }),
    step("summarize", {
      execute: async ({ data }) => summarize(data),
    }),
  ])
  .step("combine-results", {
    execute: async ({ sentiment, entities, summary }) => ({
      sentiment,
      entities,
      summary,
    }),
  })
  .commit();
```

### Batch Size Guidelines

| Operation | Recommended Batch Size | Notes |
|-----------|----------------------|-------|
| OpenAI embeddings | 100-2000 | Max 2048 per request |
| Pinecone upsert | 100 | Optimal for throughput |
| PgVector upsert | 500-1000 | Database-dependent |
| Agent calls | 3-10 concurrent | Respect rate limits |
| File processing | 10-50 | Based on memory |

### How to Fix

1. Identify loops that make API calls
2. Replace sequential embedding with `embedMany`
3. Use `Promise.all` for independent operations
4. Add concurrency control to avoid rate limits
5. Batch database operations (upserts, queries)
6. Use workflow parallel steps for independent tasks
7. Monitor throughput and adjust batch sizes

### Reference

- [RAG Batching](https://mastra.ai/docs/v1/rag/overview)
- [Workflow Parallel Steps](https://mastra.ai/docs/v1/workflows/parallel-steps)
