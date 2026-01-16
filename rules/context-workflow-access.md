---
title: Workflow Context Access Pattern
impact: HIGH
impactDescription: Workflows cannot personalize behavior per request
tags: context, workflow, access, steps
category: context
---

## Workflow Context Access Pattern

**Impact: HIGH (Workflows cannot personalize behavior per request)**

Workflow steps access RequestContext through the `mastra` parameter in the
execute function. This enables steps to make decisions based on request-specific
data like user identity, permissions, or preferences.

### What to Check

- Steps access context via `mastra.requestContext`
- Context is accessed inside execute function
- Optional chaining is used for safe access
- Context values are validated before use

### Incorrect Configuration

```typescript
// Trying to access context outside execute
const brokenStep = createStep({
  id: "broken-step",
  inputSchema: z.object({ input: z.string() }),
  outputSchema: z.object({ result: z.string() }),
  // Cannot access context here!
  userId: requestContext.get("user-id"),  // Error!
  execute: async ({ inputData }) => {
    return { result: inputData.input };
  },
});

// Wrong parameter access
const wrongAccessStep = createStep({
  id: "wrong-access",
  inputSchema: z.object({ input: z.string() }),
  outputSchema: z.object({ result: z.string() }),
  execute: async ({ inputData, context }) => {  // 'context' is wrong!
    const userId = context.get("user-id");  // Error!
    return { result: inputData.input };
  },
});
```

**Common Error Messages:**

```
ReferenceError: requestContext is not defined
TypeError: Cannot read properties of undefined (reading 'get')
mastra is undefined
```

### Correct Configuration

```typescript
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

// Step with proper context access
const contextAwareStep = createStep({
  id: "context-step",
  inputSchema: z.object({ query: z.string() }),
  outputSchema: z.object({
    result: z.string(),
    processedBy: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    // Access RequestContext through mastra parameter
    const requestContext = mastra?.requestContext;

    // Safe access with optional chaining
    const userId = requestContext?.get("user-id") || "anonymous";
    const userTier = requestContext?.get("user-tier") || "free";

    // Use context in step logic
    const result = userTier === "enterprise"
      ? await premiumProcess(inputData.query)
      : await standardProcess(inputData.query);

    return {
      result,
      processedBy: userId,
    };
  },
});
```

### Conditional Logic Based on Context

```typescript
const tierBasedStep = createStep({
  id: "tier-based-step",
  inputSchema: z.object({ data: z.array(z.string()) }),
  outputSchema: z.object({
    processed: z.array(z.string()),
    limited: z.boolean(),
  }),
  execute: async ({ inputData, mastra }) => {
    const tier = mastra?.requestContext?.get("user-tier") || "free";

    // Apply limits based on user tier
    const limits = {
      free: 10,
      pro: 100,
      enterprise: Infinity,
    };

    const limit = limits[tier] || limits.free;
    const limited = inputData.data.length > limit;
    const processed = inputData.data.slice(0, limit);

    return { processed, limited };
  },
});
```

### Accessing Mastra Services in Steps

```typescript
const agentCallingStep = createStep({
  id: "agent-step",
  inputSchema: z.object({ question: z.string() }),
  outputSchema: z.object({ answer: z.string() }),
  execute: async ({ inputData, mastra }) => {
    // Get user context for agent call
    const userId = mastra?.requestContext?.get("user-id");

    // Access registered agent through mastra
    const agent = mastra?.getAgent("research-agent");

    if (!agent) {
      throw new Error("Research agent not found");
    }

    // Call agent with memory context
    const response = await agent.generate(inputData.question, {
      memory: {
        thread: `workflow-${userId}`,
        resource: userId || "anonymous",
      },
    });

    return { answer: response.text || "" };
  },
});
```

### Passing Context to Workflow Execution

```typescript
// When executing a workflow, pass the requestContext
const result = await dataWorkflow.execute({
  inputData: { query: "test query" },
  requestContext: requestContext,  // Pass context here
});

// Or through createRun
const run = await dataWorkflow.createRun();
const result = await run.start({
  inputData: { query: "test query" },
  requestContext: requestContext,
});
```

### Full Execute Parameter Reference

```typescript
const fullParamsStep = createStep({
  id: "full-params",
  inputSchema: z.object({ input: z.string() }),
  outputSchema: z.object({ result: z.string() }),
  execute: async ({
    inputData,      // Typed step input
    mastra,         // Mastra instance
    getInitData,    // Get original workflow input
    getStepResult,  // Get result from specific step
    suspend,        // Suspend workflow (if schema defined)
    resumeData,     // Resume data (if resuming)
  }) => {
    // Access context
    const ctx = mastra?.requestContext;
    const userId = ctx?.get("user-id");

    // Access other mastra features
    const agent = mastra?.getAgent("my-agent");
    const workflow = mastra?.getWorkflow("other-workflow");

    // Get original workflow input
    const initData = getInitData();

    // Get result from previous step
    const prevResult = getStepResult("previous-step-id");

    return { result: `Processed for ${userId}` };
  },
});
```

### How to Fix

1. Access context via `mastra.requestContext` in execute function
2. Use optional chaining: `mastra?.requestContext?.get("key")`
3. Provide fallback values for missing context
4. Pass `requestContext` when executing workflows
5. Test steps with different context values

### Reference

- [Workflow Context](https://mastra.ai/docs/v1/workflows/context)
- [Request Context](https://mastra.ai/docs/v1/server/request-context)
