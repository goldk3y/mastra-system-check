---
title: Workflow Context Access
impact: HIGH
impactDescription: Context data unavailable in steps, incorrect behavior
tags: workflow, context, mastra, access
category: workflow
---

## Workflow Context Access

**Impact: HIGH (Context data unavailable in steps, incorrect behavior)**

Workflow steps can access the Mastra context (including RequestContext) through
the execute function parameters. Incorrect access patterns result in undefined
values or missing context data when steps need request-specific information.

### What to Check

- Steps access context through execute function parameters
- Context is properly destructured from execute params
- RequestContext values are accessed with correct keys
- Context is available when needed (not after async boundaries)

### Incorrect Configuration

```typescript
// Trying to access context outside execute
const badStep = createStep({
  id: "bad-context-step",
  inputSchema: z.object({ input: z.string() }),
  outputSchema: z.object({ result: z.string() }),
  // Cannot access context here!
  execute: async ({ inputData }) => {
    // How do I get the user ID?
    const userId = globalContext.get("user-id");  // Wrong! No global context
    return { result: inputData.input };
  },
});

// Wrong parameter destructuring
const wrongParamsStep = createStep({
  id: "wrong-params",
  inputSchema: z.object({ input: z.string() }),
  outputSchema: z.object({ result: z.string() }),
  execute: async (inputData) => {  // Wrong! Not destructured
    // inputData is actually { inputData, mastra, ... }
    return { result: inputData.input };  // undefined!
  },
});
```

**Common Error Messages:**

```
TypeError: Cannot read property 'get' of undefined
requestContext is not defined
mastra.get is not a function
```

### Correct Configuration

```typescript
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

// Proper context access in execute
const contextAwareStep = createStep({
  id: "context-step",
  inputSchema: z.object({ query: z.string() }),
  outputSchema: z.object({ result: z.string(), userId: z.string() }),
  execute: async ({ inputData, mastra }) => {
    // Access RequestContext through mastra
    const requestContext = mastra?.requestContext;
    const userId = requestContext?.get("user-id") || "anonymous";
    const userTier = requestContext?.get("user-tier") || "free";

    // Use context data in step logic
    const result = userTier === "premium"
      ? await premiumSearch(inputData.query)
      : await basicSearch(inputData.query);

    return { result, userId };
  },
});

// Accessing other mastra services
const serviceAccessStep = createStep({
  id: "service-step",
  inputSchema: z.object({ agentId: z.string(), message: z.string() }),
  outputSchema: z.object({ response: z.string() }),
  execute: async ({ inputData, mastra }) => {
    // Access agents through mastra
    const agent = mastra?.getAgent(inputData.agentId);

    if (!agent) {
      throw new Error(`Agent ${inputData.agentId} not found`);
    }

    const response = await agent.generate(inputData.message);
    return { response: response.text || "" };
  },
});
```

### Accessing Initial Workflow Data

```typescript
const stepWithInitData = createStep({
  id: "init-data-step",
  inputSchema: z.object({ currentData: z.string() }),
  outputSchema: z.object({ combined: z.string() }),
  execute: async ({ inputData, getInitData }) => {
    // Access original workflow input
    const initData = getInitData<{ originalInput: string }>();

    return {
      combined: `${initData?.originalInput} -> ${inputData.currentData}`,
    };
  },
});
```

### Full Execute Parameter Reference

```typescript
const fullParamsStep = createStep({
  id: "full-params",
  inputSchema: z.object({ input: z.string() }),
  outputSchema: z.object({ result: z.string() }),
  execute: async ({
    inputData,      // Current step's input (from previous step or workflow input)
    mastra,         // Mastra instance with context
    getInitData,    // Function to get original workflow input
    suspend,        // Function to suspend workflow (if suspendSchema defined)
    resumeData,     // Data passed when resuming (if resumeSchema defined)
    getStepResult,  // Get result from a specific previous step
  }) => {
    // inputData: typed according to inputSchema
    const { input } = inputData;

    // mastra.requestContext: access request-scoped data
    const userId = mastra?.requestContext?.get("user-id");

    // mastra.getAgent(): access registered agents
    const agent = mastra?.getAgent("my-agent");

    // mastra.getWorkflow(): access registered workflows
    const workflow = mastra?.getWorkflow("other-workflow");

    // getInitData(): original workflow input
    const initData = getInitData();

    // getStepResult(): result from a named step
    const prevResult = getStepResult("previous-step-id");

    return { result: `Processed by ${userId}` };
  },
});
```

### Context Flow in Workflows

```
[Request with Headers]
        ↓
[Middleware creates RequestContext]
        ↓
[Workflow.execute({ requestContext })]
        ↓
[Step 1] → mastra.requestContext available
        ↓
[Step 2] → mastra.requestContext available
        ↓
[Step N] → mastra.requestContext available
```

### How to Fix

1. Destructure execute parameters: `async ({ inputData, mastra }) =>`
2. Access RequestContext via `mastra?.requestContext`
3. Use optional chaining for safe access: `?.get("key")`
4. Provide fallback values for missing context data
5. Access initial data via `getInitData()` function

### Reference

- [Workflow Context](https://mastra.ai/docs/v1/workflows/context)
- [Request Context](https://mastra.ai/docs/v1/server/request-context)
