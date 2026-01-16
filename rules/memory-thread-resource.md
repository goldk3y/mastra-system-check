---
title: Thread and Resource IDs Required
impact: MEDIUM-HIGH
impactDescription: Conversations mixed up, wrong context, privacy issues
tags: memory, thread, resource, identifiers
category: memory
---

## Thread and Resource IDs Required

**Impact: MEDIUM-HIGH (Conversations mixed up, wrong context, privacy issues)**

When using agent memory, `thread` and `resource` identifiers must be provided
to properly isolate conversations. Without these IDs, conversations may be
mixed up or memory features won't work correctly.

### What to Check

- `thread` ID is provided in generate() calls
- `resource` ID is provided (typically user ID)
- IDs are unique and consistent for the same conversation
- IDs don't leak between users (privacy)

### Incorrect Configuration

```typescript
// Missing memory options entirely
const response = await agent.generate("Hello");
// No memory context - previous messages not retrieved!

// Missing thread ID
const response = await agent.generate("Hello", {
  memory: {
    resource: "user-123",
    // Missing thread! Can't identify conversation
  },
});

// Hardcoded IDs (wrong for multi-user)
const response = await agent.generate("Hello", {
  memory: {
    thread: "main-thread",    // Same for all users!
    resource: "main-resource", // Same for all users!
  },
});
// All users share the same conversation history!
```

### Correct Configuration

```typescript
// Proper thread and resource identification
async function chat(userId: string, conversationId: string, message: string) {
  const response = await agent.generate(message, {
    memory: {
      thread: conversationId,  // Unique per conversation
      resource: userId,        // Unique per user
    },
  });

  return response.text;
}

// Example usage
await chat("user-123", "conv-abc", "Hello!");
await chat("user-123", "conv-abc", "What did I just say?");
// Agent remembers "Hello!" from same conversation

// Different conversation for same user
await chat("user-123", "conv-def", "Let's talk about something else");
// Fresh conversation, no memory of previous thread
```

### ID Strategies

```typescript
// Strategy 1: Use existing IDs from your system
memory: {
  thread: existingConversationId,  // From your database
  resource: authenticatedUserId,    // From auth system
}

// Strategy 2: Generate UUIDs
memory: {
  thread: crypto.randomUUID(),  // New conversation
  resource: userId,
}

// Strategy 3: Composite IDs for scoping
memory: {
  thread: `${userId}-${topicId}`,  // User + topic specific
  resource: userId,
}

// Strategy 4: Session-based
memory: {
  thread: sessionId,      // From session management
  resource: userId,
}
```

### Thread vs Resource Explained

```
Resource: WHO is having conversations (user, organization, etc.)
Thread:   WHICH conversation (one user can have multiple threads)

Example:
- User "alice" (resource) can have:
  - Thread "alice-support-123" (support conversation)
  - Thread "alice-sales-456" (sales conversation)
  - Thread "alice-general-789" (general chat)

Each thread is isolated. Switching threads switches context.
```

### API Route Example

```typescript
// src/app/api/chat/route.ts
export async function POST(req: Request) {
  const { message, conversationId } = await req.json();

  // Get user from authentication
  const userId = await getUserFromAuth(req);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Generate with proper memory context
  const response = await chatAgent.generate(message, {
    memory: {
      thread: conversationId,
      resource: userId,
    },
  });

  return Response.json({ response: response.text });
}
```

### Creating New Conversations

```typescript
// When user starts a new conversation
async function createConversation(userId: string): Promise<string> {
  const conversationId = crypto.randomUUID();

  // Optionally store metadata
  await db.conversations.create({
    id: conversationId,
    userId,
    createdAt: new Date(),
  });

  return conversationId;
}

// First message in new conversation
const convId = await createConversation("user-123");
await chat("user-123", convId, "Starting a new topic!");
```

### Privacy Considerations

```typescript
// Ensure resource IDs don't leak between users
async function secureChat(userId: string, threadId: string, message: string) {
  // Verify the thread belongs to this user
  const thread = await db.conversations.findOne({
    id: threadId,
    userId: userId,  // Critical: must match!
  });

  if (!thread) {
    throw new Error("Conversation not found or access denied");
  }

  return agent.generate(message, {
    memory: {
      thread: threadId,
      resource: userId,
    },
  });
}
```

### How to Fix

1. Always provide `thread` and `resource` in memory options
2. Use user ID or authenticated identity as `resource`
3. Use conversation/session ID as `thread`
4. Ensure IDs are unique (UUIDs recommended)
5. Verify thread ownership for privacy
6. Store thread-to-user mappings in your database

### Reference

- [Agent Memory](https://mastra.ai/docs/v1/agents/agent-memory)
- [Memory Configuration](https://mastra.ai/reference/v1/memory/memory-class)
