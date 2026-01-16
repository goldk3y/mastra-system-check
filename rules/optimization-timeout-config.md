---
title: Timeout Configuration
impact: LOW
impactDescription: Hung requests, poor user experience, resource exhaustion
tags: optimization, timeout, reliability, performance
category: optimization
---

## Timeout Configuration

**Impact: LOW (Hung requests, poor user experience, resource exhaustion)**

LLM operations can take variable amounts of time. Without proper timeouts,
requests may hang indefinitely, degrading user experience and potentially
exhausting server resources. Configure appropriate timeouts at each layer.

### What to Check

- Agent generation has timeout configured
- Tool executions have timeouts
- Workflow steps have timeouts
- HTTP client timeouts are set
- Streaming timeouts are appropriate
- Timeout errors are handled gracefully

### Incorrect Configuration

```typescript
// No timeouts: Can hang forever
const agent = new Agent({
  id: "slow-agent",
  model: "anthropic/claude-sonnet-4-20250514",
  instructions: "You are a helpful assistant.",
  // No maxTokens, no timeout!
});

// Tool can hang on slow API
const apiTool = createTool({
  id: "slow-api",
  execute: async ({ query }) => {
    // No timeout - if API is slow, this hangs
    const response = await fetch(`https://slow-api.com/search?q=${query}`);
    return response.json();
  },
});

// Workflow step can run forever
const workflow = new Workflow({ id: "slow-workflow" })
  .step("long-step", {
    execute: async () => {
      // No timeout on potentially slow operation
      return await processLargeDataset();
    },
  })
  .commit();
```

### Correct Configuration

```typescript
import { Agent } from "@mastra/core/agent";

// Agent with generation limits
const agent = new Agent({
  id: "controlled-agent",
  model: "anthropic/claude-sonnet-4-20250514",
  instructions: "You are a helpful assistant. Be concise.",
  // Limit token generation
  maxTokens: 1000,  // Prevent runaway generation
});

// Tool with fetch timeout
const apiTool = createTool({
  id: "api-with-timeout",
  execute: async ({ query }) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);  // 10s timeout

    try {
      const response = await fetch(`https://api.com/search?q=${query}`, {
        signal: controller.signal,
      });
      return response.json();
    } catch (error) {
      if (error.name === "AbortError") {
        return { error: "Request timed out. Please try again." };
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  },
});

// Reusable timeout wrapper
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = "Operation timed out"
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}

// Usage in tools
const safeApiTool = createTool({
  id: "safe-api",
  execute: async ({ query }) => {
    return withTimeout(
      fetch(`https://api.com/search?q=${query}`).then(r => r.json()),
      10000,
      "API request timed out"
    );
  },
});
```

### Workflow Step Timeouts

```typescript
// Workflow with step-level timeouts
const workflow = new Workflow({
  id: "timeout-workflow",
})
  .step("fetch-data", {
    timeout: 30000,  // 30 second timeout
    execute: async () => {
      return await fetchExternalData();
    },
    onError: async (error) => {
      if (error.message.includes("timeout")) {
        return { data: null, error: "Data fetch timed out" };
      }
      throw error;
    },
  })
  .step("process", {
    timeout: 60000,  // 60 second timeout for processing
    execute: async ({ data }) => {
      if (!data) return { processed: false };
      return await processData(data);
    },
  })
  .commit();
```

### HTTP Server Timeouts

```typescript
import { Hono } from "hono";
import { timeout } from "hono/timeout";

const app = new Hono();

// Global timeout middleware
app.use("*", timeout(30000));  // 30 second global timeout

// Route-specific timeout
app.post("/api/generate", timeout(60000), async (c) => {  // 60s for generation
  const response = await agent.generate(message);
  return c.json({ response });
});

// Streaming endpoints need different handling
app.post("/api/stream", async (c) => {
  const stream = await agent.stream(message);

  // Set initial response timeout
  const timeoutId = setTimeout(() => {
    // Handle if no data received in 30s
    console.error("Stream timeout - no initial data");
  }, 30000);

  return streamResponse(c, stream, () => clearTimeout(timeoutId));
});
```

### Timeout Configuration Guide

| Operation | Recommended Timeout | Notes |
|-----------|-------------------|-------|
| Simple generation | 30-60s | Most complete in <30s |
| Complex reasoning | 60-120s | Multi-step thinking |
| Tool execution | 10-30s | External API calls |
| Database queries | 5-15s | Should be fast |
| File operations | 30-60s | Large files may need more |
| Workflow step | 30-120s | Depends on step complexity |
| Full workflow | 5-10 min | Sum of steps + buffer |
| HTTP request | 30-60s | User-facing timeout |

### Graceful Timeout Handling

```typescript
// Timeout with fallback
const resilientTool = createTool({
  id: "resilient-tool",
  execute: async ({ query }, context) => {
    try {
      return await withTimeout(
        expensiveOperation(query),
        15000,
        "Operation timed out"
      );
    } catch (error) {
      if (error.message.includes("timed out")) {
        // Log and return graceful fallback
        console.warn(`Tool timeout for query: ${query}`);
        return {
          result: null,
          message: "The operation took too long. Please try a simpler query.",
          cached: false,
        };
      }
      throw error;
    }
  },
});

// Agent with timeout and retry
async function generateWithRetry(
  agent: Agent,
  message: string,
  maxRetries = 2
): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await withTimeout(
        agent.generate(message),
        60000,
        "Generation timed out"
      );
      return response.text;
    } catch (error) {
      if (attempt < maxRetries - 1 && error.message.includes("timed out")) {
        console.warn(`Attempt ${attempt + 1} timed out, retrying...`);
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}
```

### How to Fix

1. Add `maxTokens` to agents to limit generation
2. Wrap fetch calls with AbortController timeouts
3. Add timeout configuration to workflow steps
4. Configure HTTP server timeouts
5. Implement graceful error handling for timeouts
6. Monitor timeout frequency to tune values
7. Add retry logic for transient timeouts

### Reference

- [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [Hono Timeout Middleware](https://hono.dev/middleware/builtin/timeout)
