---
title: Workflow Step Schemas Required
impact: HIGH
impactDescription: Type errors, data validation failures, runtime crashes
tags: workflow, steps, schema, validation, zod
category: workflow
---

## Workflow Step Schemas Required

**Impact: HIGH (Type errors, data validation failures, runtime crashes)**

Every workflow step must define `inputSchema` and `outputSchema` using Zod.
These schemas validate data at runtime, provide TypeScript types, and ensure
data flows correctly between steps. Missing or incorrect schemas cause
validation errors and type mismatches.

### What to Check

- Every step has `inputSchema` defined
- Every step has `outputSchema` defined
- Schemas are valid Zod schemas (z.object, z.string, etc.)
- Output schema of step N matches input schema of step N+1
- Workflow input schema matches first step's input
- Workflow output schema matches last step's output

### Incorrect Configuration

```typescript
// Missing schemas entirely
const badStep = createStep({
  id: "bad-step",
  // Missing inputSchema!
  // Missing outputSchema!
  execute: async ({ inputData }) => {
    return { result: "done" };
  },
});

// Schema mismatch between steps
const step1 = createStep({
  id: "step-1",
  inputSchema: z.object({ query: z.string() }),
  outputSchema: z.object({ items: z.array(z.string()) }),  // Outputs 'items'
  execute: async ({ inputData }) => ({ items: ["a", "b"] }),
});

const step2 = createStep({
  id: "step-2",
  inputSchema: z.object({ data: z.array(z.string()) }),  // Expects 'data'! Mismatch!
  outputSchema: z.object({ count: z.number() }),
  execute: async ({ inputData }) => ({ count: inputData.data.length }),
});

// Workflow will fail: step1 outputs 'items' but step2 expects 'data'
```

**Common Error Messages:**

```
ZodError: Required at "inputSchema"
Type 'items' does not exist on type '{ data: string[] }'
Validation failed: Expected object, received undefined
Step output does not match next step input schema
```

### Correct Configuration

```typescript
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

// Step 1: Clear input/output schemas
const fetchStep = createStep({
  id: "fetch-data",
  inputSchema: z.object({
    query: z.string().describe("Search query"),
  }),
  outputSchema: z.object({
    results: z.array(z.string()).describe("Search results"),
  }),
  execute: async ({ inputData }) => {
    const results = await searchDatabase(inputData.query);
    return { results };
  },
});

// Step 2: Input schema matches step 1's output schema
const processStep = createStep({
  id: "process-results",
  inputSchema: z.object({
    results: z.array(z.string()),  // Matches fetchStep output!
  }),
  outputSchema: z.object({
    summary: z.string(),
    count: z.number(),
  }),
  execute: async ({ inputData }) => {
    return {
      summary: inputData.results.join(", "),
      count: inputData.results.length,
    };
  },
});

// Workflow with matching schemas
export const searchWorkflow = createWorkflow({
  id: "search-workflow",
  inputSchema: z.object({
    query: z.string(),  // Matches fetchStep input
  }),
  outputSchema: z.object({
    summary: z.string(),  // Matches processStep output
    count: z.number(),
  }),
})
  .then(fetchStep)
  .then(processStep)
  .commit();
```

### Schema Flow Diagram

```
Workflow Input Schema
        ↓
    [Step 1]
  inputSchema  ← Must match workflow input
  outputSchema → Must match step 2 input
        ↓
    [Step 2]
  inputSchema  ← Must match step 1 output
  outputSchema → Must match workflow output (if last step)
        ↓
Workflow Output Schema
```

### Data Transformation Between Steps

```typescript
// When schemas don't naturally match, use a transformation step
const transformStep = createStep({
  id: "transform",
  inputSchema: z.object({
    items: z.array(z.string()),  // From previous step
  }),
  outputSchema: z.object({
    data: z.array(z.string()),  // For next step
  }),
  execute: async ({ inputData }) => ({
    data: inputData.items,  // Rename field
  }),
});
```

### Using Context in Steps

```typescript
const contextAwareStep = createStep({
  id: "context-step",
  inputSchema: z.object({ query: z.string() }),
  outputSchema: z.object({ result: z.string() }),
  execute: async ({ inputData, mapiCaller, getInitData }) => {
    // Access workflow context if needed
    const initData = getInitData();  // Original workflow input
    return { result: `Processed: ${inputData.query}` };
  },
});
```

### How to Fix

1. Add `inputSchema` and `outputSchema` to every step
2. Ensure schemas use Zod (z.object, z.string, etc.)
3. Verify step output schemas match next step input schemas
4. Verify workflow input/output schemas match first/last steps
5. Add `.describe()` to schema fields for documentation
6. Use transformation steps when schemas don't naturally align

### Reference

- [Workflow Steps](https://mastra.ai/docs/v1/workflows/steps)
- [Zod Schema Reference](https://zod.dev)
