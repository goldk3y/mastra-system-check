---
title: Workflow Steps Must Be Connected
impact: HIGH
impactDescription: Steps never execute, workflow returns incomplete results
tags: workflow, steps, connections, graph
category: workflow
---

## Workflow Steps Must Be Connected

**Impact: HIGH (Steps never execute, workflow returns incomplete results)**

Every step in a workflow must be connected to the workflow graph using
`.then()`, `.after()`, or `.branch()`. Steps that are defined but not
connected will never execute, leading to incomplete results or missing
data in the workflow output.

### What to Check

- All defined steps are connected in the workflow
- No orphan steps (steps not reached from workflow start)
- Step connections form a valid directed graph
- Parallel steps are properly grouped
- Branch conditions cover all cases

### Incorrect Configuration

```typescript
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

const step1 = createStep({
  id: "step-1",
  inputSchema: z.object({ input: z.string() }),
  outputSchema: z.object({ data: z.string() }),
  execute: async ({ inputData }) => ({ data: inputData.input }),
});

const step2 = createStep({
  id: "step-2",
  inputSchema: z.object({ data: z.string() }),
  outputSchema: z.object({ processed: z.string() }),
  execute: async ({ inputData }) => ({ processed: inputData.data.toUpperCase() }),
});

const step3 = createStep({  // This step exists but is never connected!
  id: "step-3",
  inputSchema: z.object({ processed: z.string() }),
  outputSchema: z.object({ final: z.string() }),
  execute: async ({ inputData }) => ({ final: `Result: ${inputData.processed}` }),
});

// Workflow missing step3 connection
const workflow = createWorkflow({
  id: "incomplete-workflow",
  inputSchema: z.object({ input: z.string() }),
  outputSchema: z.object({ final: z.string() }),  // Expects step3 output
})
  .then(step1)
  .then(step2)
  // step3 never connected!
  .commit();

// Workflow will fail: output doesn't match outputSchema
```

**Common Error Messages:**

```
Workflow output does not match outputSchema
Step 'step-3' is defined but never executed
Orphan step detected: step-3
Workflow graph is disconnected
```

### Correct Configuration

```typescript
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

const step1 = createStep({
  id: "step-1",
  inputSchema: z.object({ input: z.string() }),
  outputSchema: z.object({ data: z.string() }),
  execute: async ({ inputData }) => ({ data: inputData.input }),
});

const step2 = createStep({
  id: "step-2",
  inputSchema: z.object({ data: z.string() }),
  outputSchema: z.object({ processed: z.string() }),
  execute: async ({ inputData }) => ({ processed: inputData.data.toUpperCase() }),
});

const step3 = createStep({
  id: "step-3",
  inputSchema: z.object({ processed: z.string() }),
  outputSchema: z.object({ final: z.string() }),
  execute: async ({ inputData }) => ({ final: `Result: ${inputData.processed}` }),
});

// All steps connected
const completeWorkflow = createWorkflow({
  id: "complete-workflow",
  inputSchema: z.object({ input: z.string() }),
  outputSchema: z.object({ final: z.string() }),
})
  .then(step1)
  .then(step2)
  .then(step3)  // step3 now connected
  .commit();
```

### Parallel Step Connections

```typescript
// Parallel steps must be grouped in an array
const parallelWorkflow = createWorkflow({
  id: "parallel-workflow",
  inputSchema: z.object({ input: z.string() }),
  outputSchema: z.object({ combined: z.string() }),
})
  .then(initialStep)
  .then([stepA, stepB, stepC])  // These run in parallel
  .then(combineStep)            // Waits for all parallel steps
  .commit();
```

### Using .after() for Complex Dependencies

```typescript
// When a step depends on multiple previous steps
const complexWorkflow = createWorkflow({
  id: "complex-workflow",
  inputSchema: z.object({ input: z.string() }),
  outputSchema: z.object({ result: z.string() }),
})
  .then(step1)
  .then([step2a, step2b])  // Parallel
  .then(step3)
  .after(step2a)           // step4 runs after step2a specifically
  .then(step4)
  .commit();
```

### Branch Connections

```typescript
// All branches must eventually connect or terminate
const branchWorkflow = createWorkflow({
  id: "branch-workflow",
  inputSchema: z.object({ value: z.number() }),
  outputSchema: z.object({ result: z.string() }),
})
  .then(evaluateStep)
  .branch([
    [async ({ inputData }) => inputData.value > 100, highValueStep],
    [async ({ inputData }) => inputData.value > 10, mediumValueStep],
    [async () => true, lowValueStep],  // Default branch (always true)
  ])
  .then(finalizeStep)  // All branches converge here
  .commit();
```

### Workflow Graph Visualization

```
Valid Graph:
  [start] → [step1] → [step2] → [step3] → [end]

Valid Parallel Graph:
  [start] → [step1] → [stepA] ↘
                      [stepB] → [combine] → [end]
                      [stepC] ↗

Invalid (Orphan):
  [start] → [step1] → [step2] → [end]
  [step3] (never reached!)
```

### How to Fix

1. List all steps defined for the workflow
2. Trace connections from workflow start to each step
3. Add `.then()` for any unconnected steps
4. Ensure parallel steps are grouped in arrays
5. Verify branches have complete coverage
6. Check that final step output matches workflow outputSchema

### Reference

- [Workflow Steps](https://mastra.ai/docs/v1/workflows/steps)
- [Parallel Execution](https://mastra.ai/docs/v1/workflows/parallel-steps)
- [Branching](https://mastra.ai/docs/v1/workflows/branching)
