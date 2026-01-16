---
title: Tool Suspend/Resume Schema Configuration
impact: MEDIUM
impactDescription: Human-in-the-loop fails, suspended tools can't resume
tags: tool, suspend, resume, human-in-the-loop
category: tool
---

## Tool Suspend/Resume Schema Configuration

**Impact: MEDIUM (Human-in-the-loop fails, suspended tools can't resume)**

Tools that require human input or external approval need suspend/resume
functionality. Proper schema configuration ensures the tool can pause
execution and correctly handle the resume data when approval comes.

### What to Check

- suspendSchema defined for tools that pause
- resumeSchema defined for expected resume data
- Execute function handles both initial call and resume
- Storage is configured for suspend state persistence
- Resume data is validated against schema

### Incorrect Configuration

```typescript
// Missing suspend/resume schemas
const incompleteTool = createTool({
  id: "approval-tool",
  execute: async (input, context) => {
    // Tries to suspend but no schema defined
    await context.suspend({ needsApproval: true });  // What data?
    // Resume data has no type information
  },
});

// Schema mismatch
const mismatchTool = createTool({
  id: "mismatch-tool",
  suspendSchema: z.object({
    requestId: z.string(),
  }),
  resumeSchema: z.object({
    isApproved: z.boolean(),  // Expects boolean
  }),
  execute: async (input, context) => {
    if (!context.resumeData) {
      await context.suspend({ requestId: "123" });
    }
    // Resume data might be { approved: "yes" } - string not boolean!
  },
});
```

### Correct Configuration

```typescript
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const approvalTool = createTool({
  id: "request-approval",
  description: "Request human approval for an action",
  inputSchema: z.object({
    actionType: z.string().describe("Type of action requiring approval"),
    details: z.string().describe("Details about the action"),
    urgency: z.enum(["low", "medium", "high"]).describe("Urgency level"),
  }),
  outputSchema: z.object({
    approved: z.boolean(),
    approvedBy: z.string().optional(),
    notes: z.string().optional(),
    timestamp: z.string(),
  }),

  // Define what data is saved when suspending
  suspendSchema: z.object({
    requestId: z.string().describe("Unique ID for this approval request"),
    actionType: z.string().describe("What action needs approval"),
    details: z.string().describe("Action details for reviewer"),
    requestedAt: z.string().datetime().describe("When approval was requested"),
    approvalUrl: z.string().url().describe("URL for approver to use"),
  }),

  // Define what data is expected when resuming
  resumeSchema: z.object({
    approved: z.boolean().describe("Whether the request was approved"),
    approvedBy: z.string().describe("ID or name of approver"),
    notes: z.string().optional().describe("Optional notes from approver"),
    decidedAt: z.string().datetime().describe("When decision was made"),
  }),

  execute: async ({ actionType, details, urgency }, context) => {
    // Check if we're resuming from suspension
    if (context.resumeData) {
      // Type is inferred from resumeSchema
      const { approved, approvedBy, notes, decidedAt } = context.resumeData;

      return {
        approved,
        approvedBy,
        notes,
        timestamp: decidedAt,
      };
    }

    // First call - suspend for approval
    const requestId = crypto.randomUUID();
    const approvalUrl = `https://app.example.com/approve/${requestId}`;

    await context.suspend({
      requestId,
      actionType,
      details,
      requestedAt: new Date().toISOString(),
      approvalUrl,
    });

    // This line is reached after resume
    // But we handle resume above, so this is fallback
    return {
      approved: false,
      timestamp: new Date().toISOString(),
    };
  },
});
```

### Multi-Step Approval

```typescript
const multiStepApproval = createTool({
  id: "multi-step-approval",
  inputSchema: z.object({
    amount: z.number(),
  }),
  suspendSchema: z.object({
    step: z.enum(["manager", "finance", "executive"]),
    approvalChain: z.array(z.object({
      role: z.string(),
      approved: z.boolean(),
      timestamp: z.string(),
    })),
  }),
  resumeSchema: z.object({
    approved: z.boolean(),
    role: z.string(),
  }),
  outputSchema: z.object({
    fullyApproved: z.boolean(),
    approvalChain: z.array(z.any()),
  }),

  execute: async ({ amount }, context) => {
    const chain = context.resumeData
      ? [...(context.suspendData?.approvalChain || []), {
          role: context.resumeData.role,
          approved: context.resumeData.approved,
          timestamp: new Date().toISOString(),
        }]
      : [];

    // Determine approval requirements based on amount
    const requiredApprovals = amount > 10000
      ? ["manager", "finance", "executive"]
      : amount > 1000
        ? ["manager", "finance"]
        : ["manager"];

    const nextRequired = requiredApprovals.find(
      role => !chain.find(a => a.role === role)
    );

    if (nextRequired && chain.every(a => a.approved)) {
      await context.suspend({
        step: nextRequired,
        approvalChain: chain,
      });
    }

    const fullyApproved = requiredApprovals.every(
      role => chain.find(a => a.role === role && a.approved)
    );

    return { fullyApproved, approvalChain: chain };
  },
});
```

### Handling Resume in Workflows

```typescript
// When using suspended tools in workflows
const approvalWorkflow = createWorkflow({
  id: "approval-workflow",
})
  .then(prepareRequestStep)
  .then(approvalStep)  // This step uses suspended tool
  .then(processResultStep)
  .commit();

// Resume a suspended workflow
async function handleApprovalResponse(
  workflowRunId: string,
  stepId: string,
  approvalData: { approved: boolean; approvedBy: string }
) {
  await approvalWorkflow.resume({
    runId: workflowRunId,
    stepId: stepId,
    resumeData: {
      approved: approvalData.approved,
      approvedBy: approvalData.approvedBy,
      notes: undefined,
      decidedAt: new Date().toISOString(),
    },
  });
}
```

### Storage Requirements

```typescript
// Suspend requires storage to persist state
export const mastra = new Mastra({
  storage: new LibSQLStore({
    id: "mastra-storage",
    url: process.env.DATABASE_URL || "file:./mastra.db",
  }),
  tools: { approvalTool },
});

// Without storage, suspended state is lost on:
// - Server restart
// - Process termination
// - Load balancer routing to different instance
```

### How to Fix

1. Define `suspendSchema` for data saved at suspension
2. Define `resumeSchema` for data expected at resume
3. Check `context.resumeData` in execute to detect resume
4. Ensure storage is configured on Mastra instance
5. Track suspended tool/workflow IDs for resume endpoint
6. Validate resume data matches schema before calling resume

### Reference

- [Tool Suspend/Resume](https://mastra.ai/docs/v1/tools/suspend-resume)
- [Workflow Suspend/Resume](https://mastra.ai/docs/v1/workflows/suspend-resume)
