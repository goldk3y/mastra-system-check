---
title: Security Processors Run First
impact: MEDIUM
impactDescription: Sensitive data processed before filtering, PII exposure
tags: security, processors, order, filtering
category: security
---

## Security Processors Run First

**Impact: MEDIUM (Sensitive data processed before filtering, PII exposure)**

Security-related memory processors (PII redaction, content filtering) must
run before other processors. If they run later, sensitive data may be
summarized, embedded, or stored before being filtered.

### What to Check

- Security processors are first in the array
- PII redaction runs before summarization
- Content filtering runs before storage
- Order is documented and intentional

### Incorrect Configuration

```typescript
// Wrong order - summarization before PII redaction
const badOrderMemory = new Memory({
  processors: [
    summarizationProcessor,    // Summarizes PII into summary!
    embeddingProcessor,        // Embeds PII into vector!
    piiRedactionProcessor,     // Too late, PII already processed
  ],
});

// Wrong order - embedding before filtering
const badEmbedOrder = new Memory({
  processors: [
    embeddingProcessor,        // Embeds harmful content!
    harmfulContentFilter,      // Too late
  ],
});
```

### Correct Configuration

```typescript
import { Memory, MemoryProcessor } from "@mastra/memory";

// PII Redaction Processor
const piiRedactionProcessor: MemoryProcessor = {
  id: "pii-redaction",
  processMessages: async (messages) => {
    return messages.map(msg => ({
      ...msg,
      content: redactPII(msg.content),
      metadata: { ...msg.metadata, piiRedacted: true },
    }));
  },
};

// Harmful Content Filter
const harmfulContentFilter: MemoryProcessor = {
  id: "harmful-content-filter",
  processMessages: async (messages) => {
    return messages.map(msg => {
      const { safe, reason } = checkHarmfulContent(msg.content);
      if (!safe) {
        return {
          ...msg,
          content: "[Content filtered]",
          metadata: { ...msg.metadata, filtered: true, filterReason: reason },
        };
      }
      return msg;
    });
  },
};

// Summarization Processor
const summarizationProcessor: MemoryProcessor = {
  id: "summarization",
  processMessages: async (messages) => {
    return messages.map(msg => {
      if (msg.content.length > 1000) {
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

// Embedding Processor
const embeddingProcessor: MemoryProcessor = {
  id: "embedding",
  processMessages: async (messages) => {
    // Generate embeddings for vector search
    return Promise.all(messages.map(async msg => ({
      ...msg,
      embedding: await generateEmbedding(msg.content),
    })));
  },
};

// CORRECT ORDER: Security first!
const secureMemory = new Memory({
  storage: new LibSQLStore({ id: "storage", url: "file:./memory.db" }),
  processors: [
    // 1. SECURITY FIRST
    piiRedactionProcessor,      // Remove sensitive data
    harmfulContentFilter,       // Filter dangerous content

    // 2. TRANSFORMATION
    summarizationProcessor,     // Now safe - PII already removed

    // 3. INDEXING
    embeddingProcessor,         // Now safe - harmful content filtered
  ],
  options: { lastMessages: 20 },
});
```

### Processing Pipeline Visualization

```
Message Input
     │
     ▼
┌─────────────────────────────┐
│ 1. PII Redaction            │ ← FIRST: Remove SSN, emails, etc.
│    "My SSN is 123-45-6789"  │
│    → "My SSN is [REDACTED]" │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ 2. Harmful Content Filter   │ ← SECOND: Filter dangerous content
│    Check for threats, etc.  │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ 3. Summarization            │ ← SAFE: No PII to leak
│    Long text → Short text   │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│ 4. Embedding                │ ← SAFE: No harmful content
│    Text → Vector            │
└────────────┬────────────────┘
             │
             ▼
      Storage/Memory
```

### PII Detection and Redaction

```typescript
const piiPatterns = [
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: "[SSN]" },
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: "[EMAIL]" },
  { pattern: /\b\d{16}\b/g, replacement: "[CARD]" },
  { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, replacement: "[PHONE]" },
];

function redactPII(text: string): string {
  let redacted = text;
  for (const { pattern, replacement } of piiPatterns) {
    redacted = redacted.replace(pattern, replacement);
  }
  return redacted;
}
```

### Content Safety Check

```typescript
async function checkHarmfulContent(text: string): Promise<{ safe: boolean; reason?: string }> {
  // Check for harmful patterns
  const harmfulPatterns = [
    { pattern: /\b(kill|harm|attack)\s+(people|person|user)/i, reason: "violence" },
    { pattern: /password\s*[:=]\s*\S+/i, reason: "credential_leak" },
    { pattern: /<script|javascript:/i, reason: "xss_attempt" },
  ];

  for (const { pattern, reason } of harmfulPatterns) {
    if (pattern.test(text)) {
      return { safe: false, reason };
    }
  }

  return { safe: true };
}
```

### Processor Order Checklist

| Priority | Category | Examples |
|----------|----------|----------|
| 1 | Security/Filtering | PII redaction, content filter |
| 2 | Validation | Schema validation, format check |
| 3 | Transformation | Normalization, translation |
| 4 | Enrichment | Sentiment, entity extraction |
| 5 | Optimization | Summarization, compression |
| 6 | Indexing | Embedding generation |

### How to Fix

1. Audit current processor order
2. Move security processors to the beginning
3. Ensure PII redaction runs before summarization
4. Ensure content filtering runs before embedding
5. Document the intended order and reasoning
6. Test with sensitive data to verify filtering works

### Reference

- [Memory Processors](https://mastra.ai/docs/v1/memory/processors)
- [PII Handling Best Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)
