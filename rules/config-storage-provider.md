---
title: Storage Provider Required
impact: CRITICAL
impactDescription: Memory, workflows, and traces won't persist
tags: storage, configuration, persistence, libsql, postgres, mongodb
category: config
---

## Storage Provider Required

**Impact: CRITICAL (Memory, workflows, and traces won't persist)**

Mastra requires a storage provider for memory persistence, workflow state,
suspended tool calls, and observability traces. Without storage, conversations
lose context between requests and workflows cannot suspend/resume.

### What to Check

- Storage provider is configured in Mastra instance
- Storage URL/connection string is valid (not empty or undefined)
- Storage package is installed (@mastra/libsql, @mastra/pg, etc.)
- For production, storage URL comes from environment variable

### Incorrect Configuration

```typescript
// Missing storage - memory and workflows will fail
import { Mastra } from "@mastra/core";
import { Agent } from "@mastra/core/agent";

const myAgent = new Agent({
  id: "my-agent",
  name: "My Agent",
  instructions: "You are helpful.",
  model: "openai/gpt-4o",
});

export const mastra = new Mastra({
  agents: { myAgent },
  // No storage configured - CRITICAL ERROR
});
```

### Correct Configuration

```typescript
import { Mastra } from "@mastra/core";
import { Agent } from "@mastra/core/agent";
import { LibSQLStore } from "@mastra/libsql";

const myAgent = new Agent({
  id: "my-agent",
  name: "My Agent",
  instructions: "You are helpful.",
  model: "openai/gpt-4o",
});

export const mastra = new Mastra({
  storage: new LibSQLStore({
    id: "mastra-storage",
    url: process.env.DATABASE_URL || "file:./mastra.db",
  }),
  agents: { myAgent },
});
```

### Available Storage Providers

| Provider | Package | Use Case |
|----------|---------|----------|
| LibSQL | `@mastra/libsql` | Development, SQLite-compatible |
| PostgreSQL | `@mastra/pg` | Production, scalable |
| MongoDB | `@mastra/mongodb` | Document-based storage |
| DynamoDB | `@mastra/dynamodb` | AWS serverless |
| Convex | `@mastra/convex` | Real-time sync |

### How to Fix

1. Install a storage package: `npm install @mastra/libsql@beta`
2. Import the storage provider in your Mastra entry file
3. Configure storage with a valid URL
4. For production, use environment variables for connection strings
5. For development, `file:./mastra.db` or `:memory:` work well

### Reference

- [Storage Documentation](https://mastra.ai/docs/v1/memory/storage)
- [LibSQL Storage Reference](https://mastra.ai/reference/v1/storage/libsql)
- [PostgreSQL Storage Reference](https://mastra.ai/reference/v1/storage/pg)
