---
title: Vector Store for Semantic Recall
impact: MEDIUM
impactDescription: Semantic search doesn't work, limited recall capability
tags: memory, vector, embeddings, semantic
category: memory
---

## Vector Store for Semantic Recall

**Impact: MEDIUM (Semantic search doesn't work, limited recall capability)**

When using semantic recall features (searching past conversations by meaning
rather than just recency), a vector store must be configured. Without a
vector store, semantic recall will fail or fall back to basic recency-based
retrieval.

### What to Check

- Vector store is configured if using semanticRecall
- Embedding model is configured
- Vector store matches deployment environment
- Dimensions match embedding model output

### Incorrect Configuration

```typescript
// Enabling semantic recall without vector store
const memory = new Memory({
  options: {
    lastMessages: 20,
    semanticRecall: true,  // Enabled!
    // But no vector store configured
  },
});
// Semantic recall will fail or not work
```

```typescript
// Mismatched embedding dimensions
const memory = new Memory({
  vector: new PineconeVector({
    index: "my-index",
    dimension: 1536,  // OpenAI ada-002 dimensions
  }),
  embedder: new GoogleEmbedder(),  // Google uses 768 dimensions!
  // Dimension mismatch will cause errors
});
```

### Correct Configuration

```typescript
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";
import { PgVector } from "@mastra/pg";
import { embed } from "ai";

// Option 1: Memory with built-in vector support (LibSQL + vectors)
const memoryWithVectors = new Memory({
  storage: new LibSQLStore({
    id: "memory-storage",
    url: process.env.DATABASE_URL || "file:./memory.db",
  }),
  options: {
    lastMessages: 20,
    semanticRecall: {
      topK: 5,                    // Return top 5 semantic matches
      messageRange: {
        start: 20,                // Skip first 20 messages
        end: 100,                 // Search within next 100
      },
    },
  },
});

// Option 2: Explicit vector store configuration
const memoryWithPgVector = new Memory({
  storage: new LibSQLStore({
    id: "memory-storage",
    url: process.env.DATABASE_URL,
  }),
  vector: new PgVector({
    connectionString: process.env.PG_VECTOR_URL,
  }),
  embedder: {
    model: "openai/text-embedding-3-small",
    dimensions: 1536,
  },
  options: {
    lastMessages: 20,
    semanticRecall: {
      topK: 5,
    },
  },
});
```

### Semantic Recall Configuration

```typescript
const semanticMemory = new Memory({
  storage: new LibSQLStore({ /* ... */ }),
  options: {
    // Basic message history
    lastMessages: 10,

    // Semantic recall configuration
    semanticRecall: {
      // How many semantically similar messages to retrieve
      topK: 5,

      // Range of messages to search for semantic matches
      messageRange: {
        start: 10,   // Skip the 10 most recent (already in lastMessages)
        end: 200,    // Search next 200 messages
      },
    },
  },
});
```

### How Semantic Recall Works

```
Conversation flow:
1. User sends message
2. Memory retrieves last N messages (recency)
3. Memory embeds the current message
4. Memory searches vector store for similar past messages
5. Memory combines recent + semantic matches
6. Agent sees relevant context from entire history

Without vector store:
- Only step 2 works (recent messages only)
- Old relevant context is lost
```

### Vector Store Options

| Store | Best For | Dimensions |
|-------|----------|------------|
| LibSQL (sqlite-vec) | Local/small projects | Any |
| PgVector | PostgreSQL deployments | Any |
| Pinecone | Managed, scalable | Any (set on index) |
| Qdrant | Self-hosted, performant | Any |
| Chroma | Local development | Any |

### Embedding Model Dimensions

| Model | Dimensions | Provider |
|-------|------------|----------|
| text-embedding-3-small | 1536 | OpenAI |
| text-embedding-3-large | 3072 | OpenAI |
| text-embedding-ada-002 | 1536 | OpenAI |
| voyage-large-2 | 1536 | Voyage |
| all-MiniLM-L6-v2 | 384 | Open source |

### When to Use Semantic Recall

| Scenario | Use Semantic Recall? |
|----------|---------------------|
| Simple chatbot | No, lastMessages enough |
| Long conversations | Yes, recall old context |
| Knowledge-heavy domains | Yes, find relevant info |
| Support agents | Yes, recall similar issues |
| Quick Q&A | No, usually unnecessary |

### Verifying Semantic Recall Works

```typescript
// Test semantic recall
const agent = new Agent({
  model: "openai/gpt-4o",
  memory: semanticMemory,
});

// Establish context early
await agent.generate("I love playing tennis every Saturday morning", {
  memory: { thread: "test", resource: "user" },
});

// Many messages later...
for (let i = 0; i < 50; i++) {
  await agent.generate(`Message ${i} about random topics`, {
    memory: { thread: "test", resource: "user" },
  });
}

// Semantic recall should find the tennis message
const response = await agent.generate("What sports do I enjoy?", {
  memory: { thread: "test", resource: "user" },
});
// Should mention tennis even though it was 50 messages ago
```

### How to Fix

1. Configure vector store if using semanticRecall
2. Match embedding model dimensions to vector store
3. Set appropriate topK and messageRange values
4. For production, use managed vector DB (Pinecone, etc.)
5. For development, use LibSQL with sqlite-vec or in-memory
6. Test that old relevant context is recalled

### Reference

- [Semantic Memory](https://mastra.ai/docs/v1/memory/semantic-recall)
- [Vector Stores](https://mastra.ai/docs/v1/rag/vector-stores)
