---
title: Suspended Workflows Require Storage
impact: HIGH
impactDescription: Workflow state lost on suspend, cannot resume execution
tags: workflow, suspend, resume, storage, persistence
category: workflow
---

## Suspended Workflows Require Storage

**Impact: HIGH (Workflow state lost on suspend, cannot resume execution)**

Workflows that use suspend/resume functionality (like human-in-the-loop
approval steps) require a storage provider to persist workflow state.
Without storage, suspended workflows cannot be resumed after server restart
or in distributed environments.

### What to Check

- Storage is configured on Mastra instance
- Workflows using `.suspend()` have access to storage
- Suspended workflow IDs are tracked for resumption
- Resume calls include correct workflow run ID

### Incorrect Configuration

```typescript
// Mastra without storage - suspend won't persist
export const mastra = new Mastra({
  agents: { myAgent },
  workflows: { approvalWorkflow },
  // No storage! Suspended workflows will be lost
});

// Workflow with suspend but no persistence
const approvalStep = createStep({
  id: "approval",
  inputSchema: z.object({ requestId: z.string() }),
  outputSchema: z.object({ approved: z.boolean() }),
  execute: async ({ inputData, suspend }) => {
    // Suspend for human approval
    await suspend({ requestId: inputData.requestId });
    // If server restarts, this workflow is lost!
    return { approved: true };
  },
});
```

**Common Error Messages:**

```
Error: Cannot resume workflow - storage not configured
Error: Workflow run 'xyz' not found
Error: Suspended workflow state lost
```

### Correct Configuration

```typescript
import { Mastra } from "@mastra/core";
import { LibSQLStore } from "@mastra/libsql";
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

// Configure storage for workflow persistence
export const mastra = new Mastra({
  storage: new LibSQLStore({
    id: "mastra-storage",
    url: process.env.DATABASE_URL || "file:./mastra.db",
  }),
  workflows: { approvalWorkflow },
});

// Step that suspends for human approval
const requestApprovalStep = createStep({
  id: "request-approval",
  inputSchema: z.object({
    requestId: z.string(),
    amount: z.number(),
  }),
  outputSchema: z.object({
    status: z.enum(["pending", "approved", "rejected"]),
  }),
  suspendSchema: z.object({
    requestId: z.string(),
    approvalUrl: z.string(),
  }),
  resumeSchema: z.object({
    approved: z.boolean(),
    approverNotes: z.string().optional(),
  }),
  execute: async ({ inputData, suspend, resumeData }) => {
    // Check if we're resuming from suspension
    if (resumeData) {
      return {
        status: resumeData.approved ? "approved" : "rejected",
      };
    }

    // Suspend and wait for human approval
    await suspend({
      requestId: inputData.requestId,
      approvalUrl: `https://app.example.com/approve/${inputData.requestId}`,
    });

    // This won't execute until resumed
    return { status: "pending" };
  },
});

// Workflow with suspend/resume
export const approvalWorkflow = createWorkflow({
  id: "approval-workflow",
  inputSchema: z.object({
    requestId: z.string(),
    amount: z.number(),
  }),
  outputSchema: z.object({
    status: z.enum(["pending", "approved", "rejected"]),
  }),
})
  .then(requestApprovalStep)
  .commit();
```

### Resuming Suspended Workflows

```typescript
// Start a workflow (will suspend at approval step)
const run = await approvalWorkflow.createRun();
const result = await run.start({
  inputData: { requestId: "req-123", amount: 1000 },
});

// result.status === "suspended"
// Store run.id for later resumption
const workflowRunId = run.id;

// Later, when approval comes in...
const resumedRun = await approvalWorkflow.resume({
  runId: workflowRunId,
  stepId: "request-approval",
  resumeData: {
    approved: true,
    approverNotes: "Approved by manager",
  },
});
```

### Suspend/Resume Schema Requirements

| Schema | Purpose |
|--------|---------|
| `suspendSchema` | Data passed when suspending (e.g., approval URL) |
| `resumeSchema` | Data expected when resuming (e.g., approval decision) |

### Storage Requirements for Suspend

```
Suspended workflow data stored:
- Workflow run ID
- Current step ID
- Step input data
- Suspend payload
- Execution context

Required for:
- Server restarts
- Distributed execution
- Long-running approvals
- Audit trails
```

### How to Fix

1. Add storage configuration to your Mastra instance
2. Install storage package: `npm install @mastra/libsql@beta`
3. Define `suspendSchema` and `resumeSchema` on steps that suspend
4. Store the workflow run ID when suspension occurs
5. Implement resume endpoint/handler with the stored run ID

### Reference

- [Workflow Suspend/Resume](https://mastra.ai/docs/v1/workflows/suspend-resume)
- [Storage Configuration](https://mastra.ai/docs/v1/memory/storage)
