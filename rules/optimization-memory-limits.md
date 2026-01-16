---
title: Memory Limits Configuration
impact: LOW
impactDescription: Context overflow, wasted tokens, degraded performance
tags: optimization, memory, context, tokens
category: optimization
---

## Memory Limits Configuration

**Impact: LOW (Context overflow, wasted tokens, degraded performance)**

Memory configuration should balance between having enough context for
coherent conversations and not wasting tokens on irrelevant history.
Unreasonably high limits waste context window; too low limits cause
the agent to "forget" recent conversation.

### What to Check

- lastMessages is set to a reasonable value (typically 10-50)
- Memory limits align with conversation patterns
- Working memory doesn't store excessive data
- Semantic recall limits are appropriate
- Context window usage is monitored

### Incorrect Configuration

```typescript
// Too high: Wastes tokens on old, irrelevant messages
const wastefulMemory = new Memory({
  storage: store,
  options: {
    lastMessages: 500,  // Way too many - wastes context
  },
});

// Too low: Agent forgets recent context
const forgetfulMemory = new Memory({
  storage: store,
  options: {
    lastMessages: 2,  // Can't maintain conversation coherence
  },
});

// No limits: Unbounded memory usage
const unlimitedMemory = new Memory({
  storage: store,
  // No lastMessages limit - will eventually fail
});

// Working memory storing too much
const bloatedWorkingMemory = new Memory({
  storage: store,
  options: {
    lastMessages: 20,
    workingMemory: {
      enabled: true,
      template: `
        Store everything the user mentions:
        - All names, dates, numbers
        - Every topic discussed
        - Complete conversation history
        - User's entire profile
      `,  // Will grow unbounded!
    },
  },
});
```

### Correct Configuration

```typescript
import { Memory } from "@mastra/memory";

// Balanced: Enough context without waste
const balancedMemory = new Memory({
  storage: store,
  options: {
    // Reasonable message history (10-30 for most use cases)
    lastMessages: 20,

    // Working memory for key facts only
    workingMemory: {
      enabled: true,
      template: `
        Track only essential information:
        - User's name (if provided)
        - Current task/goal
        - Key preferences mentioned
        - Unresolved questions
      `,
    },
  },
});

// Use case specific configurations
const configs = {
  // Quick Q&A: Short context is fine
  qa: {
    lastMessages: 10,
  },

  // Customer support: Need more history
  support: {
    lastMessages: 30,
  },

  // Long-form collaboration: Use semantic recall
  collaboration: {
    lastMessages: 20,
    semanticRecall: {
      topK: 5,
      messageRange: { before: 2, after: 1 },
    },
  },

  // Code assistant: Recent context matters most
  coding: {
    lastMessages: 15,
    // Code context handled separately via tools
  },
};

// Dynamic limits based on context
const adaptiveMemory = new Memory({
  storage: store,
  options: {
    lastMessages: 20,  // Base limit
    semanticRecall: {
      topK: 3,  // Supplement with relevant past context
      messageRange: { before: 1, after: 1 },
    },
  },
});
```

### Memory Sizing Guidelines

| Use Case | lastMessages | semanticRecall | Notes |
|----------|--------------|----------------|-------|
| Simple Q&A | 5-10 | Not needed | Short conversations |
| Chat assistant | 15-25 | Optional | General purpose |
| Customer support | 25-40 | topK: 3-5 | Need full issue context |
| Code review | 10-20 | topK: 5 | Code in tools, not messages |
| Long collaboration | 20-30 | topK: 5-10 | Semantic recall essential |
| Sales/CRM | 30-50 | topK: 5 | Relationship context |

### Context Window Budget

```typescript
// Calculate approximate token usage
function estimateMemoryTokens(config: {
  lastMessages: number;
  avgMessageTokens?: number;
  workingMemoryTokens?: number;
  semanticRecallTokens?: number;
}): number {
  const {
    lastMessages,
    avgMessageTokens = 150,  // Average message length
    workingMemoryTokens = 200,
    semanticRecallTokens = 500,
  } = config;

  return (
    lastMessages * avgMessageTokens +
    workingMemoryTokens +
    semanticRecallTokens
  );
}

// Example budgeting
const budget = {
  totalContextWindow: 128000,  // GPT-4's context
  systemPrompt: 2000,
  tools: 3000,
  memoryBudget: 10000,  // Reserve for memory
  responseBuffer: 4000,
  // Available for user input: ~109,000 tokens
};

// Memory config that fits budget
const fittedMemory = new Memory({
  storage: store,
  options: {
    lastMessages: Math.floor(budget.memoryBudget / 150),  // ~66 messages max
  },
});
```

### Monitoring Memory Usage

```typescript
// Track actual memory token usage
async function monitorMemoryUsage(
  memory: Memory,
  threadId: string,
  resourceId: string
) {
  const messages = await memory.query({
    threadId,
    resourceId,
    last: 100,
  });

  const tokenEstimate = messages.reduce((sum, msg) => {
    // Rough estimate: 4 chars per token
    return sum + Math.ceil(msg.content.length / 4);
  }, 0);

  console.log({
    messageCount: messages.length,
    estimatedTokens: tokenEstimate,
    avgTokensPerMessage: Math.round(tokenEstimate / messages.length),
  });

  // Alert if approaching limits
  if (tokenEstimate > 8000) {
    console.warn("Memory token usage high - consider lower lastMessages");
  }
}
```

### How to Fix

1. Audit current lastMessages settings
2. Analyze typical conversation lengths in your app
3. Set lastMessages based on use case (see table above)
4. Enable semantic recall for long conversations
5. Keep working memory template focused on essentials
6. Monitor actual token usage in production
7. Adjust based on quality and cost metrics

### Reference

- [Memory Configuration](https://mastra.ai/docs/v1/memory/overview)
- [Context Window Management](https://mastra.ai/docs/v1/memory/semantic-recall)
