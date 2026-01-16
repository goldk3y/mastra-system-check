---
title: Reasonable lastMessages Configuration
impact: MEDIUM
impactDescription: Missing context or wasted tokens, inconsistent memory
tags: memory, lastMessages, configuration, context
category: memory
---

## Reasonable lastMessages Configuration

**Impact: MEDIUM (Missing context or wasted tokens, inconsistent memory)**

The `lastMessages` option controls how many recent messages are included in
each agent call. Too few means lost context; too many wastes tokens and may
exceed context limits. The value should match your use case.

### What to Check

- lastMessages is set explicitly (not relying on defaults)
- Value is appropriate for use case (typically 10-50)
- Value doesn't exceed model's context window
- Value accounts for system prompt and tool outputs

### Incorrect Configuration

```typescript
// Too few messages - context lost quickly
const tooFewMemory = new Memory({
  options: {
    lastMessages: 2,  // Only remembers 1 exchange!
  },
});
// User: "My name is Alice"
// Agent: "Nice to meet you, Alice!"
// User: "What's my name?"  // This is message 3, Alice info already gone!

// Too many messages - wasted tokens, potential overflow
const tooManyMemory = new Memory({
  options: {
    lastMessages: 500,  // Way too many
  },
});
// - Wastes tokens (expensive)
// - May exceed context window
// - Old messages likely not relevant

// No lastMessages set - unpredictable
const noConfigMemory = new Memory({
  // No options.lastMessages - using default (which may vary)
});
```

### Correct Configuration

```typescript
import { Memory } from "@mastra/memory";

// General conversation - moderate history
const generalMemory = new Memory({
  options: {
    lastMessages: 20,  // ~10 exchanges, good balance
  },
});

// Quick Q&A - minimal history needed
const qaMemory = new Memory({
  options: {
    lastMessages: 6,  // 3 exchanges, focused
  },
});

// Complex multi-turn tasks - more history
const complexMemory = new Memory({
  options: {
    lastMessages: 40,  // 20 exchanges, more context
    semanticRecall: {
      topK: 5,  // Supplement with semantic search
      messageRange: { start: 40, end: 200 },
    },
  },
});

// Support agent - balance detail and efficiency
const supportMemory = new Memory({
  options: {
    lastMessages: 30,
  },
});
```

### Guidelines by Use Case

| Use Case | lastMessages | Reasoning |
|----------|--------------|-----------|
| Simple chatbot | 10-20 | Basic context sufficient |
| Customer support | 20-40 | Need issue history |
| Code assistant | 30-50 | Code context important |
| Quick Q&A | 4-10 | Minimal context needed |
| Therapy/coaching | 40-60 | Emotional continuity |
| Task completion | 20-30 | Track progress |

### Token Budget Calculation

```typescript
// Rough calculation for token budget
function calculateMemoryTokens(
  lastMessages: number,
  avgMessageLength: number = 100  // characters
): number {
  // Approximate: 4 characters per token
  const tokensPerMessage = avgMessageLength / 4;
  return lastMessages * tokensPerMessage;
}

// Example: 20 messages * 25 tokens = 500 tokens
// Leave room for: system prompt (~500), tools (~200), response (~1000)
// Safe for most models with 8k+ context

// For GPT-4-turbo (128k context): lastMessages: 100+ is fine
// For GPT-4 (8k context): lastMessages: 20-30 safer
// For Claude models (200k): Can go higher if needed
```

### Dynamic lastMessages

```typescript
// Adjust based on context
const dynamicMemory = new Memory({
  options: {
    lastMessages: ({ requestContext }) => {
      const model = requestContext?.get("model-context-size");

      // Smaller context models get fewer messages
      if (model === "small") return 10;
      if (model === "medium") return 20;
      return 40;  // large context models
    },
  },
});
```

### Combining with Semantic Recall

```typescript
// Best of both worlds: recent + relevant
const hybridMemory = new Memory({
  options: {
    // Recent messages for immediate context
    lastMessages: 15,

    // Semantic recall for older relevant context
    semanticRecall: {
      topK: 5,
      messageRange: {
        start: 15,   // Start after lastMessages
        end: 200,    // Search older history
      },
    },
  },
});
// Total context: 15 recent + up to 5 semantically relevant
// Efficient token usage with good coverage
```

### Testing lastMessages Adequacy

```typescript
// Test that important context is retained
async function testMemoryRetention(agent: Agent, lastMessages: number) {
  const thread = `test-${Date.now()}`;
  const resource = "test-user";

  // Establish important context
  await agent.generate("Important: Remember the code word is 'PURPLE'", {
    memory: { thread, resource },
  });

  // Fill with other messages
  for (let i = 0; i < lastMessages - 1; i++) {
    await agent.generate(`Random message ${i}`, {
      memory: { thread, resource },
    });
  }

  // Test recall
  const response = await agent.generate("What was the code word?", {
    memory: { thread, resource },
  });

  const remembers = response.text.toLowerCase().includes("purple");
  console.log(`With lastMessages=${lastMessages}: ${remembers ? "PASS" : "FAIL"}`);
}
```

### How to Fix

1. Explicitly set `lastMessages` in memory options
2. Choose value based on use case guidelines
3. Consider model's context window size
4. Leave room for system prompt and response
5. Add semantic recall for longer conversations
6. Test that important context is retained

### Reference

- [Memory Options](https://mastra.ai/docs/v1/memory/overview)
- [Memory Configuration](https://mastra.ai/reference/v1/memory/memory-class)
