---
title: Workflow Must Call commit()
impact: HIGH
impactDescription: Workflow returns undefined, steps never execute
tags: workflow, commit, configuration, execution
category: workflow
---

## Workflow Must Call commit()

**Impact: HIGH (Workflow returns undefined, steps never execute)**

Mastra workflows must call `.commit()` after defining all steps to finalize
the workflow graph. Without commit, the workflow definition is incomplete
and executing it will return undefined or fail silently.

### What to Check

- Workflow definition ends with `.commit()`
- commit() is called after all steps are defined
- commit() is called after all step connections (`.then()`, `.after()`)
- No steps added after commit()

### Incorrect Configuration

```typescript
import { createWorkflow, createStep } from "@mastra/core/workflows";

// Missing commit() entirely
const workflow = createWorkflow({
  id: "my-workflow",
  inputSchema: z.object({ data: z.string() }),
  outputSchema: z.object({ result: z.string() }),
})
  .then(step1)
  .then(step2);
  // No .commit()! Workflow is incomplete

// Trying to execute incomplete workflow
const result = await workflow.execute({ data: "test" });
// result is undefined or throws error
```

```typescript
// Steps added after commit (ignored)
const workflow = createWorkflow({
  id: "my-workflow",
  inputSchema: z.object({ data: z.string() }),
  outputSchema: z.object({ result: z.string() }),
})
  .then(step1)
  .commit()  // Workflow finalized here
  .then(step2);  // This step is ignored!
```

**Common Error Messages:**

```
Workflow 'my-workflow' returned undefined
Cannot execute uncommitted workflow
Workflow execution completed with no result
```

### Correct Configuration

```typescript
import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";

const step1 = createStep({
  id: "fetch-data",
  inputSchema: z.object({ query: z.string() }),
  outputSchema: z.object({ data: z.array(z.string()) }),
  execute: async ({ inputData }) => {
    return { data: ["result1", "result2"] };
  },
});

const step2 = createStep({
  id: "process-data",
  inputSchema: z.object({ data: z.array(z.string()) }),
  outputSchema: z.object({ processed: z.string() }),
  execute: async ({ inputData }) => {
    return { processed: inputData.data.join(", ") };
  },
});

// Correct: commit() at the end
export const dataWorkflow = createWorkflow({
  id: "data-workflow",
  inputSchema: z.object({ query: z.string() }),
  outputSchema: z.object({ processed: z.string() }),
})
  .then(step1)
  .then(step2)
  .commit();  // Always end with commit()
```

### Complex Workflow with commit()

```typescript
// Parallel steps with commit
const complexWorkflow = createWorkflow({
  id: "complex-workflow",
  inputSchema: z.object({ input: z.string() }),
  outputSchema: z.object({ combined: z.string() }),
})
  .then(initialStep)
  .then([parallelStep1, parallelStep2])  // Parallel execution
  .then(combineStep)
  .commit();  // Finalize after all connections

// Conditional branching with commit
const branchingWorkflow = createWorkflow({
  id: "branching-workflow",
  inputSchema: z.object({ value: z.number() }),
  outputSchema: z.object({ result: z.string() }),
})
  .then(checkStep)
  .branch([
    [async ({ inputData }) => inputData.value > 10, highValueStep],
    [async ({ inputData }) => inputData.value <= 10, lowValueStep],
  ])
  .then(finalStep)
  .commit();  // Commit after all branches defined
```

### Workflow Lifecycle

```
1. createWorkflow({ id, inputSchema, outputSchema })
2. .then(step) - Add sequential steps
3. .then([step1, step2]) - Add parallel steps
4. .branch([...]) - Add conditional branches
5. .after(step) - Define dependencies
6. .commit() - REQUIRED: Finalize workflow graph
7. Execute with .execute() or .createRun()
```

### How to Fix

1. Locate your workflow definition
2. Ensure `.commit()` is the last method called
3. Move any steps currently after commit() to before it
4. Verify the workflow executes and returns expected results
5. Add workflow to Mastra instance registration

### Reference

- [Workflow Definition](https://mastra.ai/docs/v1/workflows/define-workflow)
- [Workflow Reference](https://mastra.ai/reference/v1/workflows/workflow-class)
