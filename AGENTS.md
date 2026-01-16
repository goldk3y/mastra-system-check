# Mastra System Check - Comprehensive Guide

This document contains all 66 rules for validating Mastra AI agent projects. Rules are organized by category and priority level.

## Priority Levels

| Level | Impact | Action |
|-------|--------|--------|
| CRITICAL | System won't function | Must fix immediately |
| HIGH | Major functionality issues | Fix before deployment |
| MEDIUM | Quality/maintainability | Fix when possible |
| LOW | Performance/cost optimization | Nice to have |

---

# Section 1: Configuration & Setup (CRITICAL)

Core configuration checks that prevent system failures.

## 1.1 Storage Provider Required

**Impact: CRITICAL (Memory, workflows, and traces won't persist)**

Mastra requires a storage provider for memory persistence, workflow state, suspended tool calls, and observability traces. Without storage, conversations lose context between requests and workflows cannot suspend/resume.

### What to Check

- Storage provider is configured in Mastra instance
- Storage URL is valid (not empty or undefined)
- Storage is accessible at runtime

### Incorrect Configuration

```typescript
// Missing storage - memory and workflows will fail
import { Mastra } from "@mastra/core";

export const mastra = new Mastra({
  agents: { myAgent },
  // No storage configured!
});
```

### Correct Configuration

```typescript
import { Mastra } from "@mastra/core";
import { LibSQLStore } from "@mastra/libsql";

export const mastra = new Mastra({
  storage: new LibSQLStore({
    id: "mastra-storage",
    url: process.env.DATABASE_URL || "file:./mastra.db",
  }),
  agents: { myAgent },
});
```

### How to Fix

1. Install a storage package: `pnpm add @mastra/libsql@latest`
2. Import and configure the storage provider
3. Set DATABASE_URL in your .env file for production
4. For development, use `file:./mastra.db` or `:memory:`

---

## 1.2 Environment Variables Required

**Impact: CRITICAL (API calls fail, system non-functional)**

Mastra agents require API keys for LLM providers. Missing environment variables cause runtime failures when agents try to generate responses.

### What to Check

- Required API keys are set (OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.)
- Keys match the models being used
- Production secrets are properly managed

### Incorrect Configuration

```typescript
// No .env file or missing keys
const agent = new Agent({
  model: "openai/gpt-4o",  // Will fail without OPENAI_API_KEY
});
```

### Correct Configuration

```bash
# .env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=file:./mastra.db
```

```typescript
// Validate at startup
const requiredEnvVars = ["OPENAI_API_KEY"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
```

---

## 1.3 TypeScript Module Configuration

**Impact: CRITICAL (Build failures, import errors)**

Mastra uses ES modules with modern TypeScript features. Incorrect tsconfig settings cause build failures and runtime errors.

### What to Check

- `module` is set to "ES2022" or "ESNext"
- `moduleResolution` is "bundler" or "node16"
- `target` is "ES2022" or later
- Strict mode is enabled

### Incorrect Configuration

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "target": "ES5"
  }
}
```

### Correct Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "./dist"
  }
}
```

---

## 1.4 Mastra Entry Point

**Impact: CRITICAL (Mastra instance not found, CLI failures)**

The Mastra CLI and server expect to find a Mastra instance exported from `src/mastra/index.ts`. Missing or incorrect exports cause startup failures.

### What to Check

- File exists at `src/mastra/index.ts`
- Exports a named `mastra` instance
- Mastra is properly configured

### Incorrect Configuration

```typescript
// Wrong file location: src/index.ts
// Or missing export
const mastra = new Mastra({ agents: { myAgent } });
// Not exported!
```

### Correct Configuration

```typescript
// src/mastra/index.ts
import { Mastra } from "@mastra/core";
import { myAgent } from "./agents/my-agent";

export const mastra = new Mastra({
  agents: { myAgent },
  storage: new LibSQLStore({ id: "storage", url: "file:./mastra.db" }),
});
```

---

## 1.5 Package Dependencies

**Impact: CRITICAL (Missing modules, import failures)**

Mastra requires specific packages to be installed. Missing dependencies cause immediate failures on import.

### What to Check

- `@mastra/core` is installed
- Provider packages match models used
- Storage packages are installed if using persistence
- All packages are on compatible versions

### Correct Configuration

```bash
# Core package (always required)
pnpm add @mastra/core@latest

# AI SDK providers (based on models used)
pnpm add @ai-sdk/openai @ai-sdk/anthropic

# Storage (if using memory/workflows)
pnpm add @mastra/libsql@latest

# Memory (if using agent memory)
pnpm add @mastra/memory@latest

# RAG (if using vector search)
pnpm add @mastra/rag@latest
```

---

## 1.6 Zod Version Compatibility

**Impact: CRITICAL (Schema validation fails, type mismatches)**

Mastra v1 requires Zod v4 for schemas. Using Zod v3 causes subtle validation failures and type incompatibilities.

### What to Check

- Zod version is 4.x
- Using correct import syntax for v4
- No mixed v3/v4 code

### Incorrect Configuration

```typescript
// Zod v3 syntax - won't work correctly
import { z } from "zod";
const schema = z.object({ name: z.string() });
```

### Correct Configuration

```bash
pnpm add zod@^4.0.0
```

```typescript
// Zod v4 - use standard-schema compatible exports
import { z } from "zod";
// Note: v4 API is mostly compatible but check migration guide
```

---

# Section 2: Agent Configuration (HIGH)

Agent setup and configuration validation.

## 2.1 Model Format Validation

**Impact: HIGH (Agent generation fails)**

Model strings must follow the `provider/model-name` format. Incorrect formats cause the AI SDK to fail when initializing the model.

### Incorrect Configuration

```typescript
const agent = new Agent({
  model: "gpt-4o",  // Missing provider!
});
```

### Correct Configuration

```typescript
const agent = new Agent({
  model: "openai/gpt-4o",  // Correct: provider/model
});
```

Valid providers: `openai`, `anthropic`, `google`, `mistral`, `groq`, `together`, `perplexity`

---

## 2.2 Agent Instructions Defined

**Impact: HIGH (Generic, unpredictable behavior)**

Agents without instructions behave generically. Clear instructions define the agent's role, capabilities, and constraints.

### Incorrect Configuration

```typescript
const agent = new Agent({
  id: "my-agent",
  model: "openai/gpt-4o",
  // No instructions!
});
```

### Correct Configuration

```typescript
const agent = new Agent({
  id: "my-agent",
  model: "openai/gpt-4o",
  instructions: `
    You are a customer support agent for Acme Corp.

    ## Capabilities
    - Answer product questions using the product_search tool
    - Help with order status using order_lookup tool

    ## Guidelines
    - Be concise and helpful
    - Escalate billing issues to human support
  `,
});
```

---

## 2.3 Tool Registration

**Impact: HIGH (Tools not available to agent)**

Tools must be registered with the agent to be usable. Defining tools without registration means the agent cannot call them.

### Incorrect Configuration

```typescript
// Tool defined but not registered
const searchTool = createTool({ /* ... */ });

const agent = new Agent({
  id: "search-agent",
  model: "openai/gpt-4o",
  // tools not specified!
});
```

### Correct Configuration

```typescript
const agent = new Agent({
  id: "search-agent",
  model: "openai/gpt-4o",
  tools: { searchTool, lookupTool },
});
```

---

## 2.4 Agent Memory Storage

**Impact: HIGH (Conversations lose context)**

When an agent uses memory, it requires storage to persist messages. Without storage, the agent cannot recall previous conversation.

### Incorrect Configuration

```typescript
const agent = new Agent({
  id: "memory-agent",
  memory: new Memory({ options: { lastMessages: 20 } }),
  // No storage anywhere!
});

// Missing thread/resource
await agent.generate("Hello");
```

### Correct Configuration

```typescript
// Storage on Mastra instance
export const mastra = new Mastra({
  storage: new LibSQLStore({ id: "storage", url: ":memory:" }),
  agents: { memoryAgent },
});

// Always provide thread and resource
await memoryAgent.generate("Hello", {
  memory: {
    thread: "conversation-123",
    resource: "user-456",
  },
});
```

---

## 2.5 Agent ID Uniqueness

**Impact: HIGH (Agent conflicts, wrong agent invoked)**

Each agent must have a unique ID within the Mastra instance. Duplicate IDs cause conflicts and unpredictable behavior.

### Incorrect Configuration

```typescript
const agent1 = new Agent({ id: "assistant", /* ... */ });
const agent2 = new Agent({ id: "assistant", /* ... */ });  // Duplicate!
```

### Correct Configuration

```typescript
const customerAgent = new Agent({ id: "customer-support", /* ... */ });
const salesAgent = new Agent({ id: "sales-assistant", /* ... */ });
```

---

## 2.6 Scorer Configuration

**Impact: HIGH (Evals don't run, evaluation fails)**

Agent scorers for evals require proper model configuration and sampling rates between 0 and 1.

### Incorrect Configuration

```typescript
const agent = new Agent({
  evals: {
    scorers: [
      new SomeScorer({ samplingRate: 150 }),  // Invalid! Must be 0-1
    ],
  },
});
```

### Correct Configuration

```typescript
const agent = new Agent({
  evals: {
    scorers: [
      new RelevancyScorer({
        model: openai("gpt-4o-mini"),
        samplingRate: 0.1,  // 10% of interactions
      }),
    ],
  },
});
```

---

# Section 3: Workflow Configuration (HIGH)

Workflow definition and connection checks.

## 3.1 Workflow Commit Required

**Impact: HIGH (Workflow doesn't execute)**

Workflows must call `.commit()` to finalize the step graph. Without commit, the workflow cannot be executed.

### Incorrect Configuration

```typescript
const workflow = new Workflow({ id: "my-workflow" })
  .step("step1", { execute: async () => ({ result: "done" }) });
// Missing .commit()!
```

### Correct Configuration

```typescript
const workflow = new Workflow({ id: "my-workflow" })
  .step("step1", { execute: async () => ({ result: "done" }) })
  .commit();  // Required!
```

---

## 3.2 Workflow Step Schemas

**Impact: HIGH (Type safety lost, runtime errors)**

Workflow steps should define input and output schemas for type safety and validation.

### Incorrect Configuration

```typescript
.step("process", {
  execute: async ({ data }) => {
    // No schema - data type is unknown
    return { result: data.value * 2 };
  },
})
```

### Correct Configuration

```typescript
.step("process", {
  inputSchema: z.object({ value: z.number() }),
  outputSchema: z.object({ result: z.number() }),
  execute: async ({ data }) => {
    return { result: data.value * 2 };
  },
})
```

---

## 3.3 Suspended Workflows Need Storage

**Impact: HIGH (Suspended workflows lost)**

Workflows using `suspend()` for human-in-the-loop patterns require storage to persist the suspended state.

### What to Check

- Workflows calling `suspend()` have Mastra storage configured
- Suspended state can be retrieved and resumed

### Correct Configuration

```typescript
export const mastra = new Mastra({
  storage: new LibSQLStore({ id: "storage", url: "file:./mastra.db" }),
  workflows: { approvalWorkflow },
});
```

---

## 3.4 Workflow Step Connections

**Impact: HIGH (Steps don't execute, dead code)**

All workflow steps must be connected to the graph. Orphan steps never execute.

### Incorrect Configuration

```typescript
const workflow = new Workflow({ id: "flow" })
  .step("step1", { execute: async () => ({ a: 1 }) })
  .step("step2", { execute: async () => ({ b: 2 }) })  // Not connected!
  .commit();
```

### Correct Configuration

```typescript
const workflow = new Workflow({ id: "flow" })
  .step("step1", { execute: async () => ({ a: 1 }) })
  .then("step2", { execute: async ({ data }) => ({ b: data.a + 1 }) })
  .commit();
```

---

## 3.5 Workflow Error Handling

**Impact: HIGH (Silent failures, stuck workflows)**

Workflow steps should handle errors gracefully to prevent stuck workflows.

### Correct Configuration

```typescript
.step("risky-step", {
  execute: async ({ data }) => {
    try {
      return await riskyOperation(data);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  onError: async (error, context) => {
    console.error("Step failed:", error);
    return { fallback: true };
  },
})
```

---

## 3.6 Workflow Context Access

**Impact: HIGH (Missing request data in workflows)**

Workflows access RequestContext through the execute function's context parameter.

### Incorrect Configuration

```typescript
.step("user-step", {
  execute: async ({ data }) => {
    const userId = requestContext.get("user-id");  // undefined!
  },
})
```

### Correct Configuration

```typescript
.step("user-step", {
  execute: async ({ data, mastra }) => {
    const userId = mastra?.requestContext?.get("user-id");
    return { userId };
  },
})
```

---

# Section 4: Context & Data Flow (HIGH)

RequestContext typing and propagation validation.

## 4.1 RequestContext Type Safety

**Impact: HIGH (Runtime errors, no IDE support)**

RequestContext should be typed for type-safe access across components.

### Incorrect Configuration

```typescript
const ctx = new RequestContext();  // Untyped
ctx.set("user-tier", "enterprise");
ctx.get("typo-key");  // No error for wrong key!
```

### Correct Configuration

```typescript
type AppContext = {
  "user-tier": "free" | "pro" | "enterprise";
  "user-id": string;
};

const ctx = new RequestContext<AppContext>();
ctx.set("user-tier", "enterprise");  // Type checked
ctx.get("user-tier");  // Returns: "free" | "pro" | "enterprise"
```

---

## 4.2 Middleware Context Setup

**Impact: HIGH (Context empty in components)**

Middleware must properly create and attach RequestContext to the request.

### Incorrect Configuration

```typescript
app.use("/api/*", async (c, next) => {
  const ctx = new RequestContext();
  ctx.set("user-id", getUserId(c));
  await next();  // Context lost!
});
```

### Correct Configuration

```typescript
app.use("/api/*", async (c, next) => {
  const ctx = new RequestContext<AppContext>();
  ctx.set("user-id", getUserId(c));
  c.set("requestContext", ctx);  // Attach to request
  await next();
});
```

---

## 4.3 Agent Context Access

**Impact: HIGH (Context values unavailable)**

Agents access context via function-style configuration.

### Incorrect Configuration

```typescript
const agent = new Agent({
  instructions: "You are a helpful assistant",  // Static, no context
  model: "openai/gpt-4o",  // Can't vary by user
});
```

### Correct Configuration

```typescript
const agent = new Agent({
  instructions: ({ requestContext }) => {
    const tier = requestContext.get("user-tier");
    return tier === "enterprise"
      ? "You are a premium support agent."
      : "You are a helpful assistant.";
  },
  model: ({ requestContext }) => {
    return requestContext.get("user-tier") === "enterprise"
      ? "anthropic/claude-sonnet-4-20250514"
      : "openai/gpt-4o-mini";
  },
});
```

---

## 4.4 Workflow Context Access

**Impact: HIGH (Workflows can't access request data)**

Workflows access context through the execute function's mastra parameter.

### Correct Configuration

```typescript
.step("user-step", {
  execute: async ({ data, mastra }) => {
    const userId = mastra?.requestContext?.get("user-id");
    const tier = mastra?.requestContext?.get("user-tier");
    return { userId, tier };
  },
})
```

---

## 4.5 Tool Context Access

**Impact: HIGH (Tools can't personalize behavior)**

Tools receive context through the second parameter of execute.

### Incorrect Configuration

```typescript
execute: async (input) => {
  const userId = globalContext.get("user-id");  // Wrong approach
}
```

### Correct Configuration

```typescript
execute: async (input, context) => {
  const userId = context?.mastra?.requestContext?.get("user-id");
  return await fetchUserData(userId);
}
```

---

## 4.6 Context vs Memory Confusion

**Impact: HIGH (Data persistence issues)**

RequestContext is per-request; Memory is for persistent conversation history. Don't confuse them.

### Context Purpose

- Per-request data (user ID, auth token, preferences)
- Doesn't persist between requests
- Set by middleware, consumed by components

### Memory Purpose

- Conversation history across requests
- Persists in storage
- Managed automatically by Mastra

---

## 4.7 Context Propagation

**Impact: HIGH (Context not available where needed)**

Ensure context flows from middleware through all components.

### Propagation Chain

```
Request → Middleware (creates context)
       → Server (c.set("requestContext", ctx))
       → Agent (via function params)
       → Tools (via context param)
       → Workflows (via mastra param)
```

---

## 4.8 Header Extraction

**Impact: HIGH (User data not available)**

Extract request headers into context for use in components.

### Correct Configuration

```typescript
app.use("/api/*", async (c, next) => {
  const ctx = new RequestContext<AppContext>();

  // Extract from headers
  ctx.set("user-id", c.req.header("X-User-ID") || "anonymous");
  ctx.set("user-tier", await getUserTier(c.req.header("Authorization")));
  ctx.set("locale", c.req.header("Accept-Language")?.split(",")[0] || "en");

  c.set("requestContext", ctx);
  await next();
});
```

---

# Section 5: Prompt Engineering & Token Efficiency (HIGH)

Prompt structure, clarity, and token optimization.

## 5.1 Right Altitude - Avoid Over/Under Specification

**Impact: HIGH (Brittle or vague behavior)**

Prompts should be specific enough to guide behavior but flexible enough for varied inputs.

### Over-Specified (Bad)

```typescript
instructions: `
  If user asks about weather, call weather tool.
  If user asks about stocks, call stock tool.
  If user asks anything else, say "I can't help with that."
`
```

### Under-Specified (Bad)

```typescript
instructions: "You are a helpful assistant."
```

### Right Altitude (Good)

```typescript
instructions: `
  You are a personal assistant with access to weather and stock data.

  ## Capabilities
  Use available tools based on user needs. Combine information when relevant.

  ## Guidelines
  - Ask clarifying questions for ambiguous requests
  - Provide concise answers with key details highlighted
`
```

---

## 5.2 Use Clear Sections

**Impact: HIGH (Model confusion)**

Organize prompts with clear section headers using XML tags or Markdown.

### Correct Configuration

```typescript
instructions: `
  <role>
  You are a customer support agent for an e-commerce company.
  </role>

  <tools>
  - customer_lookup: Get customer info
  - order_history: View past orders
  </tools>

  <policies>
  - Refunds under $100: Process immediately
  - Refunds $100+: Escalate to manager
  </policies>

  <tone>
  Professional and empathetic.
  </tone>
`
```

---

## 5.3 Token Efficiency

**Impact: HIGH (Wasted tokens, higher costs)**

Minimize prompt bloat. Use retrieval instead of pre-loading documentation.

### Incorrect (Bloated)

```typescript
instructions: `
  ${entireApiDocumentation}  // 50,000 tokens!
  ${allErrorCodes}  // 10,000 more tokens!
`
```

### Correct (Efficient)

```typescript
instructions: `
  You are an API support assistant.

  Use search_docs tool to find relevant documentation.
  Use get_error_info tool for specific error codes.
`,
tools: { searchDocs, getErrorInfo },
```

---

## 5.4 Few-Shot Examples

**Impact: HIGH (Inconsistent outputs)**

Use 2-3 diverse, canonical examples rather than many similar ones.

### Incorrect

```typescript
// 100 greeting examples that all look the same
Example 1: "hello" -> "Hello! How can I help?"
Example 2: "hi" -> "Hi! How can I help?"
Example 3: "hey" -> "Hey! How can I help?"
// ...
```

### Correct

```typescript
// 2-3 diverse examples showing different patterns
<examples>
User: "How do I reset my password?"
Assistant: [Uses account_tools] "I can help you reset your password..."

User: "My order hasn't arrived"
Assistant: [Uses order_lookup] "Let me check your order status..."
</examples>
```

---

## 5.5 Tool Descriptions Quality

**Impact: HIGH (LLM chooses wrong tools)**

Tool descriptions should be clear, distinct, and help the LLM understand when to use each tool.

### Incorrect

```typescript
createTool({
  id: "search",
  description: "Searches stuff",  // Too vague
});
```

### Correct

```typescript
createTool({
  id: "product-search",
  description: `
    Search the product catalog by name, category, or SKU.
    Returns: product details including price, availability, and specifications.
    Use when: User asks about products, prices, or availability.
  `,
});
```

---

## 5.6 Avoid Laundry Lists

**Impact: HIGH (Wasted tokens, false constraints)**

Don't enumerate every possible edge case. Focus on principles.

### Incorrect

```typescript
instructions: `
  Don't say these words: bad, terrible, awful, horrible, dreadful...
  Don't discuss these topics: politics, religion, sports, weather...
  If user says X, respond with Y...
  If user says A, respond with B...
`
```

### Correct

```typescript
instructions: `
  ## Communication Style
  Maintain professional, neutral language. Avoid inflammatory terms.

  ## Topics
  Focus on product support. Redirect off-topic discussions politely.
`
```

---

## 5.7 Just-in-Time Context Retrieval

**Impact: HIGH (Context overflow, slow responses)**

Load context when needed rather than pre-loading everything.

### Correct Approach

```typescript
tools: {
  searchDocs,      // Retrieve documentation on demand
  getUserHistory,  // Fetch user data when needed
  getOrderDetails, // Look up specific orders
},
instructions: `
  Retrieve relevant information using tools before answering.
  Don't assume - verify with tools.
`
```

---

## 5.8 Chain vs Mega-Prompt

**Impact: HIGH (Unreliable complex behavior)**

Split complex tasks into workflow steps rather than one mega-prompt.

### Mega-Prompt (Bad)

```typescript
instructions: `
  Analyze the input, extract entities, classify sentiment,
  generate summary, translate to Spanish, format as JSON...
`
```

### Chained Workflow (Good)

```typescript
const workflow = new Workflow({ id: "analyze" })
  .step("extract", { execute: extractEntities })
  .step("classify", { execute: classifySentiment })
  .step("summarize", { execute: generateSummary })
  .commit();
```

---

## 5.9 Role Definition

**Impact: HIGH (Inconsistent persona)**

Clearly define the agent's role at the start of instructions.

### Correct Configuration

```typescript
instructions: `
  <role>
  You are a senior software engineer at Acme Corp specializing in
  TypeScript and React. You provide code reviews, debugging help,
  and architectural guidance.
  </role>
`
```

---

## 5.10 Output Format Specification

**Impact: HIGH (Unparseable responses)**

Specify expected output format when structured output is needed.

### Correct Configuration

```typescript
instructions: `
  ## Output Format
  Always respond with JSON in this format:
  {
    "answer": "your response",
    "confidence": 0.0-1.0,
    "sources": ["source1", "source2"]
  }
`
```

Or use structured output:

```typescript
const result = await agent.generate(prompt, {
  output: z.object({
    answer: z.string(),
    confidence: z.number(),
  }),
});
```

---

# Section 6: Memory Configuration (MEDIUM-HIGH)

Memory setup, storage, and recall configuration.

## 6.1 Memory Storage Required

**Impact: MEDIUM-HIGH (Conversations don't persist)**

Memory requires storage to persist across requests. Without storage, memory is lost.

### Correct Configuration

```typescript
const memory = new Memory({
  storage: new LibSQLStore({ id: "memory", url: "file:./memory.db" }),
  options: { lastMessages: 20 },
});
```

---

## 6.2 Thread and Resource IDs

**Impact: MEDIUM-HIGH (Messages from different users mixed)**

Always provide thread and resource identifiers when using memory.

### Correct Configuration

```typescript
await agent.generate("Hello", {
  memory: {
    thread: `session-${sessionId}`,
    resource: `user-${userId}`,
  },
});
```

---

## 6.3 Vector Store for Semantic Recall

**Impact: MEDIUM (Can't find relevant past context)**

For semantic recall, configure a vector store with embedder.

### Correct Configuration

```typescript
const memory = new Memory({
  storage: store,
  vector: new PineconeStore({ index: "conversations" }),
  embedder: openai.embedding("text-embedding-3-small"),
  options: {
    lastMessages: 20,
    semanticRecall: { topK: 5 },
  },
});
```

---

## 6.4 Working Memory Configuration

**Impact: MEDIUM (Key facts lost between messages)**

Working memory extracts and maintains key facts across conversation.

### Correct Configuration

```typescript
const memory = new Memory({
  storage: store,
  options: {
    workingMemory: {
      enabled: true,
      template: `
        Track key information:
        - User's name
        - Current task/goal
        - Stated preferences
      `,
    },
  },
});
```

---

## 6.5 Reasonable Message Limits

**Impact: MEDIUM (Context overflow or amnesia)**

Set `lastMessages` to a reasonable value (10-50 for most use cases).

| Use Case | Recommended |
|----------|-------------|
| Quick Q&A | 5-10 |
| Chat assistant | 15-25 |
| Customer support | 25-40 |

---

## 6.6 Processor Order

**Impact: MEDIUM (PII stored before redaction)**

Security processors (PII redaction) must run before other processors.

### Correct Order

```typescript
const memory = new Memory({
  storage: store,
  processors: [
    piiRedactionProcessor,      // FIRST - security
    contentFilterProcessor,     // SECOND - safety
    summarizationProcessor,     // THIRD - transformation
    embeddingProcessor,         // LAST - indexing
  ],
});
```

---

# Section 7: Tool Configuration (MEDIUM)

Tool definitions, schemas, and error handling.

## 7.1 Schema Validation

**Impact: MEDIUM (Invalid inputs, unclear errors)**

Tools should have inputSchema (and optionally outputSchema) defined with Zod.

### Correct Configuration

```typescript
const searchTool = createTool({
  id: "search",
  inputSchema: z.object({
    query: z.string().min(1).describe("Search query"),
    limit: z.number().optional().default(10),
  }),
  outputSchema: z.object({
    results: z.array(z.object({
      title: z.string(),
      url: z.string(),
    })),
  }),
  execute: async ({ query, limit }) => {
    // Implementation
  },
});
```

---

## 7.2 Tool ID Format

**Impact: MEDIUM (Confusion, conflicts)**

Use kebab-case for tool IDs. Be descriptive but concise.

Good: `search-products`, `get-order-status`, `send-email`
Bad: `SearchProducts`, `tool1`, `doTheThing`

---

## 7.3 Description Quality

**Impact: MEDIUM (LLM uses tool incorrectly)**

Descriptions should explain:
- What the tool does
- When to use it
- What it returns

---

## 7.4 Async Execute Functions

**Impact: MEDIUM (Blocking, potential errors)**

Tool execute functions should be async.

### Correct Configuration

```typescript
execute: async ({ query }, context) => {
  const results = await searchAPI(query);
  return { results };
},
```

---

## 7.5 Error Handling

**Impact: MEDIUM (Cryptic failures)**

Tools should handle errors gracefully.

### Correct Configuration

```typescript
execute: async ({ query }) => {
  try {
    return await riskyOperation(query);
  } catch (error) {
    return {
      success: false,
      error: `Operation failed: ${error.message}`,
    };
  }
},
```

---

## 7.6 Suspend/Resume Schemas

**Impact: MEDIUM (Human-in-loop fails)**

Tools using suspend must define inputSchema for the resume payload.

### Correct Configuration

```typescript
const approvalTool = createTool({
  id: "request-approval",
  inputSchema: z.object({ request: z.string() }),
  // Schema for human input on resume
  resumeSchema: z.object({
    approved: z.boolean(),
    reason: z.string().optional(),
  }),
  execute: async ({ request }, { suspend }) => {
    const humanInput = await suspend({ request });
    return humanInput;
  },
});
```

---

# Section 8: Observability & Evals (MEDIUM) - CONDITIONAL

Tracing, logging, and scorer configuration.

**Important: All observability checks are conditional.** They only apply if you have enabled observability/telemetry or are using evals. If you're not using these features, skip this entire section - observability is completely optional.

## 8.1 Observability Storage (Conditional)

**Impact: MEDIUM (Traces not persisted)**

**Only applies if:** You have observability/telemetry configured.

When observability is enabled, configure storage for trace persistence.

### Correct Configuration

```typescript
export const mastra = new Mastra({
  storage: new LibSQLStore({ id: "storage", url: "file:./mastra.db" }),
  telemetry: {
    serviceName: "my-mastra-app",
    enabled: true,
  },
});
```

---

## 8.2 Exporters Configured (Conditional)

**Impact: MEDIUM (Can't view traces)**

**Only applies if:** You have observability enabled and want external monitoring.

Configure at least one exporter for observability data.

### Correct Configuration

```typescript
telemetry: {
  serviceName: "my-app",
  enabled: true,
  export: {
    type: "otlp",
    endpoint: process.env.OTEL_ENDPOINT,
  },
}
```

---

## 8.3 Service Name Set (Conditional)

**Impact: MEDIUM (Can't identify traces)**

**Only applies if:** You have observability/telemetry configured.

When using observability, set a meaningful `serviceName` in telemetry config.

---

## 8.4 Scorer Model Configuration (Conditional)

**Impact: MEDIUM (Evals fail)**

**Only applies if:** You're using model-graded scorers for evals.

Scorers that use LLM judges need model configuration.

### Correct Configuration

```typescript
new RelevancyScorer({
  model: openai("gpt-4o-mini"),
  samplingRate: 0.1,
})
```

---

## 8.5 Appropriate Sampling Rates (Conditional)

**Impact: MEDIUM (Missed issues or high costs)**

**Only applies if:** You have observability or evals with sampling configured.

| Environment | Sampling Rate |
|-------------|---------------|
| Development | 1.0 (100%) |
| Staging | 0.5 (50%) |
| Production | 0.1-0.2 (10-20%) |

---

## 8.6 CI/CD Eval Setup (Conditional)

**Impact: MEDIUM (Quality regressions)**

**Only applies if:** You want automated quality regression testing for production agents.

Run evals in CI to catch regressions before deployment.

### GitHub Actions Example

```yaml
- name: Run Evals
  run: pnpm mastra eval --ci
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

---

# Section 9: Security & Guardrails (MEDIUM)

Authentication, CORS, and content safety.

## 9.1 No Hardcoded Secrets

**Impact: MEDIUM (Security breach)**

Never hardcode API keys or secrets. Use environment variables.

### Incorrect

```typescript
const client = new OpenAI({ apiKey: "sk-abc123..." });  // Exposed!
```

### Correct

```typescript
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
```

---

## 9.2 CORS Configuration

**Impact: MEDIUM (Cross-origin attacks)**

Configure specific allowed origins, not wildcards in production.

### Correct Configuration

```typescript
app.use("*", cors({
  origin: process.env.NODE_ENV === "production"
    ? ["https://app.yourdomain.com"]
    : ["http://localhost:3000"],
  credentials: true,
}));
```

---

## 9.3 Authentication Required

**Impact: MEDIUM (Unauthorized access)**

Protect API endpoints with authentication middleware.

### Correct Configuration

```typescript
const authMiddleware = async (c, next) => {
  const token = c.req.header("Authorization")?.slice(7);
  if (!token || !await validateToken(token)) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
};

app.use("/api/*", authMiddleware);
```

---

## 9.4 Security Processors First

**Impact: MEDIUM (PII processed before filtering)**

Security processors must run before other processors in memory.

### Correct Order

```typescript
processors: [
  piiRedactionProcessor,    // FIRST
  contentFilterProcessor,   // SECOND
  // ... other processors
]
```

---

## 9.5 PII Detection

**Impact: MEDIUM (Privacy violations)**

Implement PII detection for sensitive applications.

### Correct Configuration

```typescript
const piiPatterns = [
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: "[SSN]" },
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: "[EMAIL]" },
];

function redactPII(text: string): string {
  let redacted = text;
  for (const { pattern, replacement } of piiPatterns) {
    redacted = redacted.replace(pattern, replacement);
  }
  return redacted;
}
```

---

## 9.6 Prompt Injection Detection

**Impact: MEDIUM (Agent manipulation)**

Detect and handle prompt injection attempts.

### Key Patterns to Detect

- "ignore previous instructions"
- "you are now a..."
- "pretend you are..."
- "show me your system prompt"

### Defense

1. Input validation with pattern detection
2. Harden agent instructions with security guidelines
3. Restrict tool access
4. Monitor for anomalies

---

# Section 10: Performance & Optimization (LOW)

Performance tuning and cost optimization.

## 10.1 Model Selection

**Impact: LOW (Higher costs, slower responses)**

Match model to task complexity. Don't use GPT-4 for simple classification.

| Task | Recommended |
|------|-------------|
| Classification | gpt-4o-mini |
| Simple extraction | gpt-4o-mini |
| Complex reasoning | claude-sonnet, gpt-4o |
| Code generation | claude-sonnet, gpt-4o |

---

## 10.2 Memory Limits

**Impact: LOW (Wasted tokens)**

Set appropriate `lastMessages` based on use case (typically 10-50).

---

## 10.3 Batch Processing

**Impact: LOW (Unnecessary API calls)**

Batch embeddings and vector operations.

### Correct Configuration

```typescript
// Batch embeddings
const { embeddings } = await embedMany({
  model: openai.embedding("text-embedding-3-small"),
  values: documents,  // Array of texts
});

// Batch vector upserts
await vectorStore.upsert(records);  // Array of records
```

---

## 10.4 Caching Opportunities

**Impact: LOW (Redundant API calls)**

Cache embeddings for repeated queries and tool results with TTL.

### Correct Configuration

```typescript
const embeddingCache = new Map<string, number[]>();

async function getCachedEmbedding(text: string) {
  const key = hashString(text);
  if (embeddingCache.has(key)) {
    return embeddingCache.get(key);
  }
  const embedding = await embed(text);
  embeddingCache.set(key, embedding);
  return embedding;
}
```

---

## 10.5 Timeout Configuration

**Impact: LOW (Hung requests)**

Configure timeouts for agent generation and tool execution.

### Correct Configuration

```typescript
// Agent with token limit
const agent = new Agent({
  maxTokens: 1000,  // Limit generation
});

// Tool with timeout
execute: async ({ query }) => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 10000);
  return await fetch(url, { signal: controller.signal });
}
```

---

## 10.6 Bundler Externals

**Impact: LOW (Build failures)**

Mark native modules as external in bundler configuration.

### Correct Configuration

```typescript
// esbuild
await build({
  external: [
    "better-sqlite3",
    "@libsql/client",
    "pg",
    "@mastra/*",
  ],
});
```

```javascript
// next.config.js
experimental: {
  serverComponentsExternalPackages: [
    "@libsql/client",
    "@mastra/core",
    "@mastra/memory",
  ],
}
```

---

# Quick Reference

## Check Priority Order

1. **CRITICAL (config-*)**: Fix immediately - system won't work
2. **HIGH (agent-, workflow-, context-, prompt-*)**: Fix before deployment
3. **MEDIUM (memory-, tool-, observability-, security-*)**: Fix when possible
4. **LOW (optimization-*)**: Nice to have

## Most Common Issues

1. Missing storage provider
2. Missing API keys
3. Wrong model format
4. No thread/resource in memory calls
5. Untyped RequestContext
6. Security processors not first
7. Missing .commit() on workflows

## Essential Packages

```bash
pnpm add @mastra/core@latest
pnpm add @mastra/memory@latest
pnpm add @mastra/libsql@latest
pnpm add @ai-sdk/openai @ai-sdk/anthropic
pnpm add zod@^4
```

---

# References

- [Mastra Documentation](https://mastra.ai/docs)
- [AI SDK Documentation](https://sdk.vercel.ai/docs)
- [Anthropic Prompt Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [OWASP LLM Security](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
