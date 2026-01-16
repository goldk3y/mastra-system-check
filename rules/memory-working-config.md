---
title: Working Memory Schema Validation
impact: MEDIUM
impactDescription: Working memory corruption, invalid state, runtime errors
tags: memory, working, schema, validation, zod
category: memory
---

## Working Memory Schema Validation

**Impact: MEDIUM (Working memory corruption, invalid state, runtime errors)**

Working memory allows agents to maintain structured state that evolves during
conversations. The schema must be properly defined with Zod, and the agent
must understand how to update it correctly.

### What to Check

- Working memory schema is valid Zod schema
- Schema fields have appropriate types and defaults
- Agent instructions explain working memory usage
- Updates to working memory are validated
- Schema handles optional/undefined values

### Incorrect Configuration

```typescript
// Invalid schema (not Zod)
const badMemory = new Memory({
  workingMemory: {
    schema: {
      userName: "string",  // This is not Zod!
      preferences: {},
    },
  },
});

// Schema without defaults (causes issues)
const noDefaultsMemory = new Memory({
  workingMemory: {
    schema: z.object({
      userName: z.string(),     // Required, but what if not set?
      age: z.number(),          // Required, but what if not set?
      tags: z.array(z.string()), // Required array, starts empty?
    }),
  },
});

// Agent doesn't know about working memory
const unawareAgent = new Agent({
  instructions: "You are a helpful assistant.",  // No mention of working memory
  memory: memoryWithWorkingMemory,
  // Agent won't update working memory correctly
});
```

### Correct Configuration

```typescript
import { Memory } from "@mastra/memory";
import { Agent } from "@mastra/core/agent";
import { z } from "zod";

// Properly defined working memory schema
const workingMemorySchema = z.object({
  // Optional fields with sensible defaults
  userName: z.string().optional().describe("User's preferred name"),

  // Arrays start empty
  interests: z.array(z.string()).default([])
    .describe("Topics the user is interested in"),

  // Enums with defaults
  communicationStyle: z.enum(["formal", "casual", "technical"])
    .default("casual")
    .describe("User's preferred communication style"),

  // Numbers with constraints
  sessionCount: z.number().int().min(0).default(0)
    .describe("Number of sessions with this user"),

  // Nested objects
  preferences: z.object({
    timezone: z.string().optional(),
    language: z.string().default("en"),
    units: z.enum(["metric", "imperial"]).default("metric"),
  }).default({}),

  // Timestamps
  lastInteraction: z.string().datetime().optional()
    .describe("ISO timestamp of last interaction"),
});

const memoryWithWorking = new Memory({
  storage: new LibSQLStore({ id: "storage", url: "file:./memory.db" }),
  options: { lastMessages: 20 },
  workingMemory: {
    schema: workingMemorySchema,
  },
});

// Agent that understands working memory
const workingMemoryAgent = new Agent({
  id: "working-memory-agent",
  model: "openai/gpt-4o",
  memory: memoryWithWorking,
  instructions: `
    You are a personalized assistant that remembers user preferences.

    ## Working Memory
    You have access to working memory that persists information about the user:
    - userName: Their preferred name
    - interests: Topics they're interested in
    - communicationStyle: How they prefer to communicate
    - preferences: Settings like timezone and language

    ## Updating Working Memory
    When you learn new information about the user, update working memory:
    - If they mention their name, update userName
    - If they express interest in a topic, add to interests
    - If they request a different communication style, update it

    ## Using Working Memory
    - Address users by name if known
    - Tailor responses to their interests
    - Match their communication style
    - Use their preferred units and language
  `,
});
```

### Working Memory Operations

```typescript
// Working memory is automatically available in agent context
// The agent can read and update it during conversation

// Example conversation:
// User: "Hi, I'm Sarah and I'm really into machine learning"
// Agent updates working memory: { userName: "Sarah", interests: ["machine learning"] }

// User: "Can you be more technical in your explanations?"
// Agent updates: { communicationStyle: "technical" }

// Later:
// User: "Tell me something interesting"
// Agent reads working memory, knows Sarah likes ML and prefers technical content
```

### Schema Design Best Practices

| Pattern | Bad | Good |
|---------|-----|------|
| Required fields | `z.string()` | `z.string().optional()` or `.default()` |
| Arrays | `z.array(z.string())` | `z.array(z.string()).default([])` |
| Numbers | `z.number()` | `z.number().default(0)` |
| Descriptions | None | `.describe("Purpose of field")` |

### Validating Working Memory Updates

```typescript
// Working memory updates are validated against schema
const schema = z.object({
  score: z.number().min(0).max(100),
  tags: z.array(z.string()).max(10),
});

// Valid update: { score: 85, tags: ["helpful"] }
// Invalid update: { score: 150 } -> Rejected (max 100)
// Invalid update: { tags: [...11 items] } -> Rejected (max 10)
```

### Reading Working Memory State

```typescript
// Get current working memory state
const memoryState = await memory.getWorkingMemory({
  thread: "conversation-123",
  resource: "user-456",
});

console.log(memoryState);
// { userName: "Sarah", interests: ["machine learning"], ... }
```

### Working Memory vs Message History

| Feature | Message History | Working Memory |
|---------|----------------|----------------|
| Content | Raw messages | Structured data |
| Updates | Append only | Can modify/replace |
| Schema | None | Zod validated |
| Use case | Conversation context | User preferences |

### How to Fix

1. Define working memory schema using Zod
2. Use `.optional()` or `.default()` for all fields
3. Add `.describe()` to help agent understand each field
4. Explain working memory usage in agent instructions
5. Specify when and how to update working memory
6. Test that schema validation catches invalid updates

### Reference

- [Working Memory](https://mastra.ai/docs/v1/memory/working-memory)
- [Memory Configuration](https://mastra.ai/reference/v1/memory/memory-class)
