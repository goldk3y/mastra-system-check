---
title: Memory Processor Execution Order
impact: MEDIUM
impactDescription: Processors run in wrong order, unexpected transformations
tags: memory, processors, order, pipeline
category: memory
---

## Memory Processor Execution Order

**Impact: MEDIUM (Processors run in wrong order, unexpected transformations)**

Memory processors transform messages before storage or retrieval. The order
in which processors are defined matters - they execute sequentially, and
incorrect ordering can cause unexpected behavior or data loss.

### What to Check

- Processors are ordered intentionally, not randomly
- Security/filtering processors run first
- Transformation processors run in logical sequence
- Storage processors run last
- Order is documented for maintainability

### Incorrect Configuration

```typescript
// Wrong order - summarization before security
const wrongOrderMemory = new Memory({
  processors: [
    summarizationProcessor,  // Summarizes first, may include PII!
    piiRedactionProcessor,   // Too late, PII already in summary
  ],
});

// Wrong order - embedding before transformation
const wrongEmbedOrder = new Memory({
  processors: [
    embeddingProcessor,      // Embeds raw message
    formatProcessor,         // Format changes after embedding (misaligned!)
  ],
});
```

### Correct Configuration

```typescript
import { Memory } from "@mastra/memory";

const properlyOrderedMemory = new Memory({
  storage: new LibSQLStore({ id: "storage", url: "file:./memory.db" }),
  processors: [
    // 1. SECURITY FIRST - Filter/redact sensitive data
    piiRedactionProcessor,
    harmfulContentFilter,

    // 2. TRANSFORMATION - Modify message content
    formatNormalizationProcessor,
    spellingCorrectionProcessor,

    // 3. ENRICHMENT - Add metadata
    sentimentAnalysisProcessor,
    entityExtractionProcessor,

    // 4. STORAGE OPTIMIZATION - Prepare for storage
    tokenLimitProcessor,
    summarizationProcessor,  // Safe now, PII already removed

    // 5. EMBEDDING - Vector embedding (if using semantic recall)
    embeddingProcessor,
  ],
  options: { lastMessages: 20 },
});
```

### Processor Categories and Order

```
Processing Pipeline Order:
┌─────────────────────────────────────────┐
│ 1. SECURITY/FILTERING                   │
│    - PII redaction                      │
│    - Harmful content filtering          │
│    - Injection detection                │
└───────────────┬─────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 2. VALIDATION                           │
│    - Schema validation                  │
│    - Format verification                │
└───────────────┬─────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 3. TRANSFORMATION                       │
│    - Normalization                      │
│    - Spelling/grammar correction        │
│    - Language translation               │
└───────────────┬─────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 4. ENRICHMENT                           │
│    - Sentiment analysis                 │
│    - Entity extraction                  │
│    - Classification                     │
└───────────────┬─────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 5. OPTIMIZATION                         │
│    - Token limiting                     │
│    - Summarization                      │
│    - Compression                        │
└───────────────┬─────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ 6. INDEXING                             │
│    - Embedding generation               │
│    - Vector storage                     │
└─────────────────────────────────────────┘
```

### Example Processors

```typescript
import { MemoryProcessor } from "@mastra/memory";

// Security processor - runs first
const piiRedactionProcessor: MemoryProcessor = {
  id: "pii-redaction",
  processMessages: async (messages) => {
    return messages.map(msg => ({
      ...msg,
      content: redactPII(msg.content),  // Remove SSN, emails, etc.
    }));
  },
};

// Transformation processor - runs middle
const formatProcessor: MemoryProcessor = {
  id: "format-normalization",
  processMessages: async (messages) => {
    return messages.map(msg => ({
      ...msg,
      content: normalizeWhitespace(msg.content),
      metadata: { ...msg.metadata, normalized: true },
    }));
  },
};

// Optimization processor - runs late
const tokenLimitProcessor: MemoryProcessor = {
  id: "token-limit",
  processMessages: async (messages) => {
    return messages.map(msg => ({
      ...msg,
      content: truncateToTokenLimit(msg.content, 1000),
    }));
  },
};
```

### Conditional Processors

```typescript
// Processor that conditionally runs based on content
const conditionalProcessor: MemoryProcessor = {
  id: "conditional-summary",
  processMessages: async (messages, context) => {
    return messages.map(msg => {
      // Only summarize long messages
      if (msg.content.length > 2000) {
        return {
          ...msg,
          content: summarize(msg.content),
          metadata: { ...msg.metadata, summarized: true },
        };
      }
      return msg;
    });
  },
};
```

### Testing Processor Order

```typescript
// Debug processor to verify order
const debugProcessor: MemoryProcessor = {
  id: "debug-logger",
  processMessages: async (messages) => {
    console.log(`[Debug] Processing ${messages.length} messages`);
    console.log(`[Debug] First message preview: ${messages[0]?.content.slice(0, 50)}`);
    return messages;  // Pass through unchanged
  },
};

// Insert at different positions to verify order
const debugMemory = new Memory({
  processors: [
    { ...debugProcessor, id: "debug-1" },  // Should log first
    piiRedactionProcessor,
    { ...debugProcessor, id: "debug-2" },  // Should show redacted content
    summarizationProcessor,
    { ...debugProcessor, id: "debug-3" },  // Should show summarized content
  ],
});
```

### Common Ordering Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Summarize before redact | PII in summaries | Redact first |
| Embed before transform | Misaligned vectors | Transform first |
| Limit before enrich | Lost metadata | Enrich first, then limit |
| Filter after storage | Sensitive data stored | Filter before storage |

### How to Fix

1. List all processors you're using
2. Categorize each (security, transform, enrich, optimize, index)
3. Reorder following the pipeline pattern
4. Add debug processors to verify order during development
5. Document the intended order and reasoning
6. Test with sensitive data to verify security processors work

### Reference

- [Memory Processors](https://mastra.ai/docs/v1/memory/processors)
- [Processor Reference](https://mastra.ai/reference/v1/memory/processors)
