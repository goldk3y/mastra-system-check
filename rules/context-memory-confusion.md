---
title: Context vs Memory - Avoid Confusion
impact: HIGH
impactDescription: Data in wrong place, lost between requests, incorrect persistence
tags: context, memory, confusion, antipattern
category: context
---

## Context vs Memory - Avoid Confusion

**Impact: HIGH (Data in wrong place, lost between requests, incorrect persistence)**

RequestContext and Memory serve different purposes. Context is for per-request
data (user identity, preferences, permissions) that doesn't persist. Memory is
for conversation history and data that persists across requests. Using the
wrong one leads to data loss or incorrect behavior.

### What to Check

- Request-specific data uses RequestContext
- Conversation data uses Memory
- Context is not used to store persistent data
- Memory is not used for per-request metadata
- Clear separation of concerns

### Incorrect Configuration

```typescript
// Using context to store conversation data (WRONG)
const badAgent = new Agent({
  id: "confused-agent",
  model: "openai/gpt-4o",
  instructions: ({ requestContext }) => {
    // Trying to store conversation history in context
    const history = requestContext?.get("conversation-history");  // Lost each request!
    return `Previous messages: ${history}`;  // Always undefined!
  },
});

// Trying to set context values that should persist
middleware: async (c, next) => {
  const ctx = new RequestContext();
  // This is lost after the request!
  ctx.set("user-preferences", await fetchPreferences());
  ctx.set("conversation-summary", await summarizePreviousChats());  // Wrong place!
  await next();
};

// Using memory for per-request metadata (WRONG)
const response = await agent.generate("Hello", {
  memory: {
    thread: "conversation-123",
    resource: "user-456",
    // Don't put request metadata in memory!
    metadata: {
      requestId: "req-789",     // This belongs in context
      clientIp: "192.168.1.1",  // This belongs in context
    },
  },
});
```

### Correct Configuration

```typescript
// RequestContext for per-request data
const contextMiddleware = async (c: Context, next: Next) => {
  const ctx = new RequestContext<AppContext>();

  // Per-request data that doesn't need to persist
  ctx.set("user-id", c.req.header("X-User-ID") || "anonymous");
  ctx.set("user-tier", await fetchUserTier(c.req.header("X-User-ID")));
  ctx.set("request-id", crypto.randomUUID());
  ctx.set("client-ip", c.req.header("X-Forwarded-For"));
  ctx.set("locale", c.req.header("Accept-Language") || "en-US");

  c.set("requestContext", ctx);
  await next();
};

// Memory for persistent conversation data
const memoryAgent = new Agent({
  id: "memory-agent",
  model: "openai/gpt-4o",
  memory: new Memory({
    options: {
      lastMessages: 20,  // Persists across requests
    },
  }),
  instructions: ({ requestContext }) => {
    // Use context for current request info
    const tier = requestContext?.get("user-tier");
    return `You are helping a ${tier} tier user.`;
  },
});

// Proper usage: context for request, memory for conversation
const response = await memoryAgent.generate("Remember my name is Alice", {
  // Memory persists conversation across requests
  memory: {
    thread: "conversation-123",
    resource: "user-456",
  },
  // Context passed through mastra (set in middleware)
});
```

### When to Use Each

| Data Type | Use | Example |
|-----------|-----|---------|
| User ID | RequestContext | `"user-id": "u123"` |
| User permissions | RequestContext | `"is-admin": true` |
| Request metadata | RequestContext | `"request-id": "req-789"` |
| Locale/preferences | RequestContext | `"locale": "en-US"` |
| Conversation history | Memory | Previous messages |
| User preferences (persistent) | Memory (working memory) | Learned preferences |
| Long-term user data | Database/Storage | Profile, settings |

### Working Memory for Persistent Preferences

```typescript
// If you need preferences that persist AND update during conversation
const smartAgent = new Agent({
  id: "smart-agent",
  model: "openai/gpt-4o",
  memory: new Memory({
    options: { lastMessages: 20 },
    // Working memory schema for persistent preferences
    workingMemory: {
      schema: z.object({
        userName: z.string().optional(),
        preferredTopics: z.array(z.string()).optional(),
        communicationStyle: z.enum(["formal", "casual"]).optional(),
      }),
    },
  }),
  instructions: ({ requestContext }) => {
    // Request context for current session info
    const tier = requestContext?.get("user-tier");
    // Working memory preferences accessed automatically by agent
    return `You are a ${tier} tier assistant. Adapt to user preferences stored in working memory.`;
  },
});
```

### Decision Flowchart

```
Is this data specific to the current HTTP request?
  │
  ├── YES → Use RequestContext
  │         (user-id, request-id, auth token, IP, headers)
  │
  └── NO → Does it need to persist across requests?
           │
           ├── YES → Is it conversation-related?
           │         │
           │         ├── YES → Use Memory
           │         │         (chat history, working memory)
           │         │
           │         └── NO → Use Database/Storage
           │                   (user profiles, settings)
           │
           └── NO → Use local variables
                    (computed values, temp data)
```

### Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Context for chat history | Lost each request | Use Memory |
| Memory for request ID | Pollutes conversation | Use Context |
| Context for user prefs | Fetched every request | Use Memory/DB |
| Memory for auth tokens | Security risk | Use Context |

### How to Fix

1. Audit what data you're storing in context vs memory
2. Move conversation-related data to Memory
3. Move per-request metadata to RequestContext
4. Move long-term user data to database
5. Use working memory for preferences that evolve in conversation

### Reference

- [Request Context](https://mastra.ai/docs/v1/server/request-context)
- [Agent Memory](https://mastra.ai/docs/v1/agents/agent-memory)
- [Working Memory](https://mastra.ai/docs/v1/memory/working-memory)
