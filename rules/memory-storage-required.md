---
title: Memory Requires Storage Configuration
impact: MEDIUM-HIGH
impactDescription: Conversations don't persist, memory features fail
tags: memory, storage, configuration, persistence
category: memory
---

## Memory Requires Storage Configuration

**Impact: MEDIUM-HIGH (Conversations don't persist, memory features fail)**

When using Mastra's memory features, a storage provider must be configured
either on the Memory instance directly or on the Mastra instance. Without
storage, conversations cannot be persisted between requests.

### What to Check

- Memory is configured with storage (directly or via Mastra)
- Storage URL/connection is valid
- Storage is accessible at runtime
- Storage type matches deployment environment

### Incorrect Configuration

```typescript
// Memory without storage - won't persist
import { Memory } from "@mastra/memory";

const memory = new Memory({
  options: {
    lastMessages: 20,
  },
  // No storage! Memory is in-memory only
});

const agent = new Agent({
  id: "forgetful-agent",
  model: "openai/gpt-4o",
  memory,  // This memory won't persist
});

// Also incorrect: Mastra without storage
export const mastra = new Mastra({
  agents: { agent },
  // No storage! Agent memory won't work
});
```

### Correct Configuration

```typescript
import { Mastra } from "@mastra/core";
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";

// Option 1: Storage on Mastra instance (recommended)
export const mastra = new Mastra({
  storage: new LibSQLStore({
    id: "main-storage",
    url: process.env.DATABASE_URL || "file:./mastra.db",
  }),
  agents: { conversationAgent },
});

const conversationAgent = new Agent({
  id: "conversation-agent",
  model: "openai/gpt-4o",
  memory: new Memory({
    options: { lastMessages: 20 },
  }),
  // Storage inherited from Mastra instance
});

// Option 2: Storage directly on Memory
const isolatedAgent = new Agent({
  id: "isolated-agent",
  model: "openai/gpt-4o",
  memory: new Memory({
    storage: new LibSQLStore({
      id: "isolated-storage",
      url: "file:./isolated.db",
    }),
    options: { lastMessages: 20 },
  }),
});
```

### Storage Options by Environment

| Environment | Storage | Configuration |
|-------------|---------|--------------|
| Local dev | LibSQL (file) | `file:./mastra.db` |
| Local dev | LibSQL (memory) | `:memory:` |
| Production | LibSQL (Turso) | `libsql://your-db.turso.io` |
| Production | PostgreSQL | `postgresql://...` |
| Production | MongoDB | `mongodb://...` |

### Verifying Storage Works

```typescript
// Test that memory persists
const agent = mastra.getAgent("conversation-agent");

// First request
await agent.generate("My name is Alice", {
  memory: { thread: "test-thread", resource: "test-user" },
});

// Second request - should remember
const response = await agent.generate("What's my name?", {
  memory: { thread: "test-thread", resource: "test-user" },
});

// Response should mention "Alice"
console.log(response.text);
```

### Storage Priority

```
1. Memory's own storage (if configured)
2. Mastra instance storage
3. Error: No storage available
```

### How to Fix

1. Install storage package: `npm install @mastra/libsql@beta`
2. Configure storage on Mastra instance OR Memory instance
3. Set DATABASE_URL environment variable for production
4. Test with consecutive messages to verify persistence
5. For development, use `file:./mastra.db` or `:memory:`

### Reference

- [Memory Storage](https://mastra.ai/docs/v1/memory/storage)
- [LibSQL Storage](https://mastra.ai/reference/v1/storage/libsql)
