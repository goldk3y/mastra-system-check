---
title: Tool Error Handling
impact: MEDIUM
impactDescription: Cryptic errors, agent confusion, poor user experience
tags: tool, errors, handling, resilience
category: tool
---

## Tool Error Handling

**Impact: MEDIUM (Cryptic errors, agent confusion, poor user experience)**

Tools should handle errors gracefully and return meaningful error information.
Unhandled errors cause agent confusion and poor user experience. Well-handled
errors help the agent recover or provide useful feedback.

### What to Check

- All external calls are wrapped in try/catch
- Error responses are structured and informative
- Different error types are handled appropriately
- Errors don't leak sensitive information
- Agent can understand and act on errors

### Incorrect Configuration

```typescript
// No error handling - crashes on failure
const crashyTool = createTool({
  id: "crashy",
  execute: async ({ url }) => {
    const response = await fetch(url);       // Can throw network error
    const data = await response.json();      // Can throw parse error
    return { data };                          // Never reached on error
  },
});

// Swallowing errors - agent can't tell what went wrong
const silentTool = createTool({
  id: "silent",
  execute: async ({ query }) => {
    try {
      const data = await fetchData(query);
      return { data };
    } catch {
      return { data: null };  // Agent thinks it worked but got null!
    }
  },
});

// Leaking internal details
const leakyTool = createTool({
  id: "leaky",
  execute: async ({ input }) => {
    try {
      return await processInput(input);
    } catch (error) {
      return {
        error: error.stack,  // Exposes internal code structure!
        dbQuery: error.query, // Exposes database details!
      };
    }
  },
});
```

### Correct Configuration

```typescript
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Structured error output schema
const resultSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    recoverable: z.boolean(),
    suggestion: z.string().optional(),
  }).optional(),
});

const robustTool = createTool({
  id: "robust-api-call",
  description: "Fetches data from API with comprehensive error handling",
  inputSchema: z.object({
    endpoint: z.string(),
  }),
  outputSchema: resultSchema,
  execute: async ({ endpoint }) => {
    try {
      const response = await fetch(`https://api.example.com/${endpoint}`);

      // Handle HTTP errors
      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            error: {
              code: "NOT_FOUND",
              message: `Resource '${endpoint}' not found`,
              recoverable: true,
              suggestion: "Try a different endpoint or check the resource name",
            },
          };
        }

        if (response.status === 401) {
          return {
            success: false,
            error: {
              code: "UNAUTHORIZED",
              message: "Authentication required",
              recoverable: false,
              suggestion: "API key may be invalid or expired",
            },
          };
        }

        if (response.status === 429) {
          return {
            success: false,
            error: {
              code: "RATE_LIMITED",
              message: "Too many requests",
              recoverable: true,
              suggestion: "Wait a moment and try again",
            },
          };
        }

        return {
          success: false,
          error: {
            code: "HTTP_ERROR",
            message: `Server returned ${response.status}`,
            recoverable: response.status >= 500,  // Server errors may be temporary
            suggestion: response.status >= 500
              ? "This may be a temporary issue, try again later"
              : "Check the request parameters",
          },
        };
      }

      // Handle response parsing
      let data;
      try {
        data = await response.json();
      } catch {
        return {
          success: false,
          error: {
            code: "PARSE_ERROR",
            message: "Could not parse API response",
            recoverable: false,
          },
        };
      }

      return { success: true, data };

    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        return {
          success: false,
          error: {
            code: "NETWORK_ERROR",
            message: "Could not connect to server",
            recoverable: true,
            suggestion: "Check network connection or try again",
          },
        };
      }

      // Handle timeout
      if (error.name === "AbortError") {
        return {
          success: false,
          error: {
            code: "TIMEOUT",
            message: "Request timed out",
            recoverable: true,
            suggestion: "The server is slow, try again",
          },
        };
      }

      // Generic fallback
      return {
        success: false,
        error: {
          code: "UNKNOWN_ERROR",
          message: "An unexpected error occurred",
          recoverable: false,
        },
      };
    }
  },
});
```

### Error Codes and Categories

```typescript
// Define standard error codes
const ErrorCodes = {
  // Client errors (usually not recoverable)
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",

  // Server/external errors (may be recoverable)
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT: "TIMEOUT",
  RATE_LIMITED: "RATE_LIMITED",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",

  // Internal errors
  PARSE_ERROR: "PARSE_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

// Helper to create error responses
function createError(
  code: keyof typeof ErrorCodes,
  message: string,
  recoverable: boolean,
  suggestion?: string
) {
  return {
    success: false,
    error: { code, message, recoverable, suggestion },
  };
}
```

### Input Validation Errors

```typescript
const validatingTool = createTool({
  id: "validated-tool",
  inputSchema: z.object({
    email: z.string().email(),
    amount: z.number().positive(),
  }),
  execute: async ({ email, amount }) => {
    // Additional validation beyond schema
    if (amount > 10000) {
      return createError(
        "VALIDATION_ERROR",
        "Amount exceeds maximum allowed ($10,000)",
        true,
        "Reduce the amount or contact support for large transactions"
      );
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return createError(
        "NOT_FOUND",
        "No user found with this email",
        true,
        "Check the email address or create a new account"
      );
    }

    // Proceed with operation...
    return { success: true, data: { /* ... */ } };
  },
});
```

### Logging Errors (Without Leaking)

```typescript
const loggingTool = createTool({
  id: "logging-tool",
  execute: async (input, context) => {
    try {
      return await performOperation(input);
    } catch (error) {
      // Log full details internally
      console.error("Tool error:", {
        toolId: "logging-tool",
        input,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });

      // Return safe message to agent
      return {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Operation failed",
          recoverable: false,
          // Don't include stack or internal details!
        },
      };
    }
  },
});
```

### How to Fix

1. Wrap all external calls in try/catch
2. Define structured error schema in outputSchema
3. Map specific error types to user-friendly messages
4. Include `recoverable` flag to guide agent behavior
5. Add `suggestion` for actionable next steps
6. Log full details internally, return safe details to agent

### Reference

- [Tool Creation](https://mastra.ai/docs/v1/tools/create-tool)
- [Error Handling Best Practices](https://mastra.ai/docs/v1/tools/error-handling)
