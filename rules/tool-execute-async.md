---
title: Tool Execute Must Be Async
impact: MEDIUM
impactDescription: Blocking operations, unhandled promises, runtime errors
tags: tool, execute, async, promises
category: tool
---

## Tool Execute Must Be Async

**Impact: MEDIUM (Blocking operations, unhandled promises, runtime errors)**

Tool execute functions should be async to properly handle I/O operations,
API calls, and database queries. Non-async functions can cause blocking
behavior and make error handling difficult.

### What to Check

- Execute function is declared as async
- Async operations use await
- Errors are properly caught and handled
- No floating promises (unhandled async operations)
- Timeouts are implemented for long operations

### Incorrect Configuration

```typescript
// Not async - can't await operations
const syncTool = createTool({
  id: "sync-tool",
  inputSchema: z.object({ query: z.string() }),
  outputSchema: z.object({ result: z.string() }),
  execute: ({ query }) => {  // Not async!
    const result = fetchData(query);  // Returns promise, not result!
    return { result };  // Returns [object Promise]
  },
});

// Floating promises - errors not caught
const floatingPromise = createTool({
  id: "floating-promise",
  execute: async ({ query }) => {
    fetchData(query);  // No await! Promise floats, errors lost
    saveToLog(query);  // No await! May not complete
    return { result: "done" };  // Returns before operations complete
  },
});

// No error handling
const noErrorHandling = createTool({
  id: "no-error-handling",
  execute: async ({ url }) => {
    const response = await fetch(url);  // Can throw!
    const data = await response.json();  // Can throw!
    return { data };  // Crashes on any error
  },
});
```

### Correct Configuration

```typescript
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Proper async with await
const asyncTool = createTool({
  id: "fetch-data",
  description: "Fetches data from external API",
  inputSchema: z.object({
    url: z.string().url().describe("API endpoint URL"),
    timeout: z.number().default(5000).describe("Timeout in milliseconds"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    data: z.any().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ url, timeout }) => {
    try {
      // Proper await with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return { success: true, data };

    } catch (error) {
      if (error.name === "AbortError") {
        return { success: false, error: "Request timed out" };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
```

### Parallel Async Operations

```typescript
const parallelTool = createTool({
  id: "aggregate-data",
  description: "Fetches data from multiple sources",
  inputSchema: z.object({
    sources: z.array(z.string().url()),
  }),
  outputSchema: z.object({
    results: z.array(z.object({
      source: z.string(),
      success: z.boolean(),
      data: z.any().optional(),
    })),
  }),
  execute: async ({ sources }) => {
    // Parallel fetch with Promise.allSettled
    const promises = sources.map(async (source) => {
      try {
        const response = await fetch(source);
        const data = await response.json();
        return { source, success: true, data };
      } catch (error) {
        return { source, success: false };
      }
    });

    // Wait for all to complete (doesn't fail on individual errors)
    const results = await Promise.allSettled(promises);

    return {
      results: results.map(r =>
        r.status === "fulfilled" ? r.value : { source: "unknown", success: false }
      ),
    };
  },
});
```

### Sequential Async Operations

```typescript
const sequentialTool = createTool({
  id: "process-pipeline",
  execute: async ({ input }) => {
    // Step 1: Validate
    const validated = await validateInput(input);
    if (!validated.ok) {
      return { success: false, error: "Validation failed" };
    }

    // Step 2: Process (depends on step 1)
    const processed = await processData(validated.data);

    // Step 3: Save (depends on step 2)
    const saved = await saveResult(processed);

    // Step 4: Notify (depends on step 3)
    await notifyCompletion(saved.id);

    return { success: true, resultId: saved.id };
  },
});
```

### Timeout Implementation

```typescript
// Utility for adding timeout to any promise
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message = "Operation timed out"
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeout]);
}

// Usage in tool
const timeoutTool = createTool({
  id: "slow-operation",
  execute: async ({ input }) => {
    try {
      const result = await withTimeout(
        slowExternalCall(input),
        30000,  // 30 second timeout
        "External service timed out"
      );
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
});
```

### Cleanup and Finally

```typescript
const resourceTool = createTool({
  id: "database-query",
  execute: async ({ query }) => {
    let connection;

    try {
      connection = await db.connect();
      const result = await connection.query(query);
      return { success: true, data: result.rows };

    } catch (error) {
      return { success: false, error: error.message };

    } finally {
      // Always cleanup, even on error
      if (connection) {
        await connection.close();
      }
    }
  },
});
```

### Common Async Patterns

| Pattern | Use Case | Example |
|---------|----------|---------|
| `await` | Sequential operations | `await step1(); await step2();` |
| `Promise.all` | Parallel, all must succeed | `await Promise.all([a, b, c])` |
| `Promise.allSettled` | Parallel, handle individual failures | `await Promise.allSettled([a, b])` |
| `Promise.race` | First to complete/timeout | `await Promise.race([op, timeout])` |

### How to Fix

1. Add `async` keyword to execute function
2. Add `await` to all async operations
3. Wrap in try/catch for error handling
4. Use `Promise.allSettled` for parallel operations that can fail
5. Implement timeouts for external calls
6. Clean up resources in `finally` blocks

### Reference

- [Tool Creation](https://mastra.ai/docs/v1/tools/create-tool)
- [JavaScript Async/Await](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Promises)
