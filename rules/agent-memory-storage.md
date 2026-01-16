---
title: Agent Memory Requires Storage
impact: HIGH
impactDescription: Agent conversations lose context between requests
tags: agent, memory, storage, persistence
category: agent
---

## Agent Memory Requires Storage

**Impact: HIGH (Agent conversations lose context between requests)**

When an agent is configured with memory, it requires a storage provider to
persist message history. Without storage, the agent cannot recall previous
messages in a conversation thread. Memory also requires thread and resource
identifiers when generating responses.

### What to Check

- Agent has `memory` configured (if conversational)
- Either Mastra instance has storage OR memory has its own storage
- Memory is called with `thread` and `resource` identifiers
- Storage provider is properly initialized

### Incorrect Configuration

```typescript
// Memory configured but no storage anywhere
const memoryAgent = new Agent({
  id: "memory-agent",
  model: "openai/gpt-4o",
  instructions: "You are a helpful assistant.",
  memory: new Memory({
    options: { lastMessages: 20 }
  }),
  // Storage not configured on agent or Mastra instance!
});

// Mastra instance also missing storage
export const mastra = new Mastra({
  agents: { memoryAgent },
  // No storage! Memory won't work.
});
```

```typescript
// Calling agent without thread/resource
const response = await memoryAgent.generate("Hello");  // No memory context!

// Memory will not persist or recall previous messages
```

**Common Error Messages:**

```
Error: Storage is required for memory persistence
Error: Thread ID is required when using memory
Memory context lost between requests
```

### Correct Configuration

```typescript
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";

// Option 1: Storage on Mastra instance (recommended)
export const mastra = new Mastra({
  storage: new LibSQLStore({
    id: "mastra-storage",
    url: process.env.DATABASE_URL || "file:./mastra.db"
  }),
  agents: { memoryAgent },
});

const memoryAgent = new Agent({
  id: "memory-agent",
  model: "openai/gpt-4o",
  instructions: "You are a helpful assistant with memory.",
  memory: new Memory({
    options: {
      lastMessages: 20,
      semanticRecall: false,
    },
  }),
});

// Option 2: Storage directly on memory (for isolated memory)
const isolatedMemoryAgent = new Agent({
  id: "isolated-memory-agent",
  model: "openai/gpt-4o",
  instructions: "You are a helpful assistant.",
  memory: new Memory({
    storage: new LibSQLStore({
      id: "memory-storage",
      url: "file:./memory.db"
    }),
    options: { lastMessages: 20 },
  }),
});
```

### Proper Memory Usage

```typescript
// Always provide thread and resource when generating
const response = await memoryAgent.generate("Hello, remember my name is Alice", {
  memory: {
    thread: "conversation-123",  // Unique conversation ID
    resource: "user-456",        // User or resource identifier
  },
});

// Later in the same conversation
const response2 = await memoryAgent.generate("What's my name?", {
  memory: {
    thread: "conversation-123",  // Same thread to continue conversation
    resource: "user-456",        // Same resource
  },
});
// Agent will recall: "Your name is Alice"
```

### Memory Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `lastMessages` | number | Number of recent messages to include (1-100) |
| `semanticRecall` | boolean | Enable vector-based semantic memory |
| `topK` | number | Number of semantic matches to retrieve |
| `messageRange` | object | Range of messages for semantic search |

### Storage Inheritance

```
Priority Order:
1. Memory's own storage (if configured)
2. Mastra instance storage
3. Error if neither is configured
```

### How to Fix

1. Configure storage on your Mastra instance OR directly on memory
2. Install storage package: `npm install @mastra/libsql@beta`
3. Provide `thread` and `resource` in all generate() calls
4. Use consistent thread IDs for conversation continuity
5. Use consistent resource IDs for user-specific memory

### Reference

- [Agent Memory](https://mastra.ai/docs/v1/agents/agent-memory)
- [Memory Configuration](https://mastra.ai/reference/v1/memory/memory-class)
- [Storage Providers](https://mastra.ai/docs/v1/memory/storage)
