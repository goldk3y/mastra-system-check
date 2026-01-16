---
title: Context Propagation Through Components
impact: HIGH
impactDescription: Context not available where needed, inconsistent behavior
tags: context, propagation, agents, workflows, tools
category: context
---

## Context Propagation Through Components

**Impact: HIGH (Context not available where needed, inconsistent behavior)**

RequestContext must properly flow from middleware through agents, workflows,
and tools. Each component type accesses context differently, and missing
propagation causes silent failures or undefined values.

### What to Check

- Middleware creates and attaches RequestContext
- Context is passed to agent/workflow calls
- Agents use function-style config to access context
- Workflows access context in step execute() functions
- Tools receive context through the context parameter

### Incorrect Configuration

```typescript
// Middleware sets context but doesn't attach properly
middleware: async (c, next) => {
  const ctx = new RequestContext<AppContext>();
  ctx.set("user-id", c.req.header("X-User-ID"));
  // Context not attached!
  await next();
}

// Agent uses static config - can't access context
const agent = new Agent({
  instructions: "You are a helpful assistant",  // Static
  model: "openai/gpt-4o",  // Static
});

// Workflow not receiving context
const result = await workflow.execute({
  inputData: { query: "test" },
  // Missing requestContext!
});

// Tool can't access context
execute: async (input) => {
  const userId = requestContext.get("user-id");  // undefined!
}
```

### Correct Configuration

```typescript
// 1. Middleware creates and attaches context
const contextMiddleware = async (c: Context, next: Next) => {
  const ctx = new RequestContext<AppContext>();
  ctx.set("user-id", c.req.header("X-User-ID") || "anonymous");
  ctx.set("user-tier", await getUserTier(c.req.header("X-User-ID")));

  // CRITICAL: Attach context to request
  c.set("requestContext", ctx);
  await next();
};

// 2. Agent uses function config for context access
const contextAwareAgent = new Agent({
  id: "context-agent",
  instructions: ({ requestContext }) => {
    const tier = requestContext?.get("user-tier");
    return tier === "enterprise"
      ? "You are a premium support agent."
      : "You are a helpful assistant.";
  },
  model: ({ requestContext }) => {
    return requestContext?.get("user-tier") === "enterprise"
      ? "anthropic/claude-sonnet-4-20250514"
      : "openai/gpt-4o-mini";
  },
});

// 3. Route handler passes context to agent
app.post("/api/chat", async (c) => {
  const requestContext = c.get("requestContext");
  const { message } = await c.req.json();

  // Context flows through mastra
  const response = await contextAwareAgent.generate(message);

  return c.json({ response: response.text });
});
```

### Workflow Context Propagation

```typescript
// 4. Workflow execution with context
app.post("/api/process", async (c) => {
  const requestContext = c.get("requestContext");
  const { data } = await c.req.json();

  // Pass context to workflow
  const result = await dataWorkflow.execute({
    inputData: { data },
    requestContext: requestContext,  // CRITICAL
  });

  return c.json({ result });
});

// 5. Workflow steps access context through mastra
const processStep = createStep({
  id: "process",
  inputSchema: z.object({ data: z.string() }),
  outputSchema: z.object({ processed: z.string() }),
  execute: async ({ inputData, mastra }) => {
    // Context accessible via mastra
    const userId = mastra?.requestContext?.get("user-id");
    return { processed: `${inputData.data} by ${userId}` };
  },
});
```

### Tool Context Propagation

```typescript
// 6. Tools receive context in execute
const userAwareTool = createTool({
  id: "user-tool",
  inputSchema: z.object({ action: z.string() }),
  outputSchema: z.object({ result: z.string() }),
  execute: async ({ action }, context) => {
    // Context flows through agent to tool
    const userId = context?.mastra?.requestContext?.get("user-id");
    return { result: `${action} performed for ${userId}` };
  },
});
```

### Complete Propagation Flow

```
┌─────────────────────────────────────────────────────────────┐
│ HTTP Request with Headers                                    │
│ X-User-ID: "user-123"                                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ Middleware                                                   │
│ const ctx = new RequestContext()                            │
│ ctx.set("user-id", "user-123")                              │
│ c.set("requestContext", ctx)  ← ATTACH                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ Route Handler                                                │
│ const ctx = c.get("requestContext")  ← RETRIEVE             │
│ agent.generate(msg)                                         │
│ workflow.execute({ inputData, requestContext: ctx })        │
└─────────────────┬───────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌───────────────┐   ┌───────────────────┐
│ Agent         │   │ Workflow          │
│ instructions: │   │ step.execute:     │
│ ({ ctx }) =>  │   │ ({ mastra }) =>   │
│ ctx?.get()    │   │ mastra?.ctx?.get()│
└───────┬───────┘   └───────────────────┘
        │
        ▼
┌───────────────────┐
│ Tool              │
│ execute:          │
│ (input, context)  │
│ context?.mastra   │
│ ?.ctx?.get()      │
└───────────────────┘
```

### Verification Checklist

| Component | How to Access | Check |
|-----------|--------------|-------|
| Middleware | `c.set("requestContext", ctx)` | Context attached |
| Route | `c.get("requestContext")` | Context retrieved |
| Agent | `({ requestContext }) => ...` | Function config |
| Workflow | `requestContext` in execute options | Passed to execute |
| Step | `mastra?.requestContext` | Accessed in execute |
| Tool | `context?.mastra?.requestContext` | Second param used |

### How to Fix

1. Ensure middleware attaches context with `c.set()`
2. Convert static agent config to function style
3. Pass `requestContext` when executing workflows
4. Access context in steps via `mastra?.requestContext`
5. Access context in tools via `context?.mastra?.requestContext`

### Reference

- [Request Context](https://mastra.ai/docs/v1/server/request-context)
- [Middleware Documentation](https://mastra.ai/docs/v1/server/middleware)
