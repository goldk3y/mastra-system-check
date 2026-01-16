---
title: Workflow Error Handling
impact: HIGH
impactDescription: Unhandled errors crash workflows, no recovery path
tags: workflow, errors, handling, recovery
category: workflow
---

## Workflow Error Handling

**Impact: HIGH (Unhandled errors crash workflows, no recovery path)**

Workflow steps should handle errors gracefully to prevent entire workflow
failures. Unhandled exceptions in steps cause the workflow to crash with
no recovery path. Proper error handling enables retries, fallbacks, and
meaningful error messages.

### What to Check

- Steps have try/catch blocks for external calls
- Error information is captured and logged
- Retry logic is implemented for transient failures
- Fallback values are provided where appropriate
- Error states are properly typed in output schema

### Incorrect Configuration

```typescript
// No error handling - any error crashes the workflow
const riskyStep = createStep({
  id: "risky-step",
  inputSchema: z.object({ url: z.string() }),
  outputSchema: z.object({ data: z.any() }),
  execute: async ({ inputData }) => {
    const response = await fetch(inputData.url);  // Can throw!
    const data = await response.json();           // Can throw!
    return { data };
    // If either fails, entire workflow crashes
  },
});

// Silent failures - errors hidden, bad data propagates
const silentFailStep = createStep({
  id: "silent-fail",
  inputSchema: z.object({ input: z.string() }),
  outputSchema: z.object({ result: z.string() }),
  execute: async ({ inputData }) => {
    try {
      const result = await processData(inputData.input);
      return { result };
    } catch {
      return { result: "" };  // Empty string hides the error!
    }
  },
});
```

**Common Error Messages:**

```
Workflow failed: TypeError: Cannot read property 'x' of undefined
Unhandled promise rejection in workflow step
Workflow execution terminated unexpectedly
```

### Correct Configuration

```typescript
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

// Output schema includes error state
const fetchResultSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
});

const robustFetchStep = createStep({
  id: "fetch-data",
  inputSchema: z.object({ url: z.string() }),
  outputSchema: fetchResultSchema,
  execute: async ({ inputData }) => {
    try {
      const response = await fetch(inputData.url);

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return { success: true, data };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// Step that handles upstream errors
const processStep = createStep({
  id: "process-data",
  inputSchema: fetchResultSchema,
  outputSchema: z.object({ result: z.string() }),
  execute: async ({ inputData }) => {
    if (!inputData.success) {
      // Log error and provide fallback
      console.error("Upstream error:", inputData.error);
      return { result: "Data unavailable" };
    }

    return { result: processData(inputData.data) };
  },
});
```

### Retry Logic

```typescript
const retryableStep = createStep({
  id: "retryable-step",
  inputSchema: z.object({ query: z.string() }),
  outputSchema: z.object({ data: z.any(), attempts: z.number() }),
  execute: async ({ inputData }) => {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const data = await externalApiCall(inputData.query);
        return { data, attempts: attempt };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown");
        console.warn(`Attempt ${attempt} failed: ${lastError.message}`);

        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw new Error(`Failed after ${maxRetries} attempts: ${lastError?.message}`);
  },
});
```

### Circuit Breaker Pattern

```typescript
// Track failures across workflow runs
const failureCount = new Map<string, { count: number; lastFailure: number }>();
const FAILURE_THRESHOLD = 5;
const RECOVERY_TIME = 60000; // 1 minute

const circuitBreakerStep = createStep({
  id: "protected-step",
  inputSchema: z.object({ serviceId: z.string(), query: z.string() }),
  outputSchema: z.object({ data: z.any(), circuitOpen: z.boolean() }),
  execute: async ({ inputData }) => {
    const { serviceId, query } = inputData;
    const failure = failureCount.get(serviceId);

    // Check if circuit is open
    if (failure && failure.count >= FAILURE_THRESHOLD) {
      if (Date.now() - failure.lastFailure < RECOVERY_TIME) {
        return { data: null, circuitOpen: true };
      }
      // Reset after recovery time
      failureCount.delete(serviceId);
    }

    try {
      const data = await callService(query);
      return { data, circuitOpen: false };
    } catch (error) {
      // Record failure
      const current = failureCount.get(serviceId) || { count: 0, lastFailure: 0 };
      failureCount.set(serviceId, {
        count: current.count + 1,
        lastFailure: Date.now(),
      });
      throw error;
    }
  },
});
```

### Error Handling Checklist

| Scenario | Strategy |
|----------|----------|
| Network errors | Retry with backoff |
| API rate limits | Wait and retry |
| Validation errors | Return error state |
| Missing data | Provide defaults |
| Timeout | Set limits, fail fast |
| Unknown errors | Log and rethrow |

### How to Fix

1. Wrap external calls in try/catch blocks
2. Add error state to step output schemas
3. Implement retry logic for transient failures
4. Log errors with context for debugging
5. Provide fallback values where appropriate
6. Propagate critical errors to workflow level

### Reference

- [Workflow Error Handling](https://mastra.ai/docs/v1/workflows/error-handling)
- [Step Retries](https://mastra.ai/docs/v1/workflows/retries)
