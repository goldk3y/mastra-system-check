---
title: RequestContext Type Safety Required
impact: HIGH
impactDescription: Runtime errors, missing data, no IDE support
tags: context, typescript, type-safety, middleware
category: context
---

## RequestContext Type Safety Required

**Impact: HIGH (Runtime errors, missing data, no IDE support)**

RequestContext should be typed to ensure type-safe access across agents,
workflows, and tools. Without proper typing, you lose IDE autocompletion,
type checking, and may access non-existent keys at runtime.

### What to Check

- RequestContext is created with a type parameter
- Type covers all keys that will be set/get
- All components access context with proper typing
- No `.get()` calls for undefined keys

### Incorrect Configuration

```typescript
// Untyped context - no type safety
const requestContext = new RequestContext();
requestContext.set("user-tier", "enterprise");  // No type checking
requestContext.set("typo-key", "value");        // Typo not caught

// Agent can't infer types
instructions: ({ requestContext }) => {
  const tier = requestContext.get("user-tier");  // Returns unknown
  const bad = requestContext.get("wrong-key");   // No error for invalid key!
}
```

```typescript
// Inconsistent typing across files
// file1.ts
type Context1 = { "user-id": string };
const ctx = new RequestContext<Context1>();

// file2.ts - different type definition
type Context2 = { "userId": string };  // Different key name!
```

**Common Error Messages:**

```
Type 'unknown' is not assignable to type 'string'
Property 'user-tier' does not exist on type
Cannot call get() with argument 'invalid-key'
```

### Correct Configuration

```typescript
// src/types/context.ts - Centralized context type definition
export type AppContext = {
  "user-id": string;
  "user-tier": "free" | "pro" | "enterprise";
  "temperature-unit": "celsius" | "fahrenheit";
  "locale": string;
  "is-admin": boolean;
};

// Export typed RequestContext creator
import { RequestContext } from "@mastra/core";
export const createAppContext = () => new RequestContext<AppContext>();
```

```typescript
// src/server/middleware.ts
import { createAppContext, AppContext } from "../types/context";

export const contextMiddleware = async (c: Context, next: Next) => {
  const requestContext = createAppContext();

  // Type-safe setting
  requestContext.set("user-id", c.req.header("X-User-ID") || "anonymous");
  requestContext.set("user-tier", await getUserTier(c.req.header("X-User-ID")));
  requestContext.set("locale", c.req.header("Accept-Language") || "en-US");
  requestContext.set("is-admin", await checkAdminStatus(c.req.header("X-User-ID")));

  // Type error if key doesn't exist
  // requestContext.set("invalid-key", "value");  // Error!

  c.set("requestContext", requestContext);
  await next();
};
```

```typescript
// src/mastra/agents/support-agent.ts
import type { AppContext } from "../../types/context";

const supportAgent = new Agent({
  id: "support-agent",
  model: "openai/gpt-4o",
  instructions: ({ requestContext }) => {
    // Type-safe access with autocomplete
    const tier = requestContext.get("user-tier");  // Type: "free" | "pro" | "enterprise"
    const isAdmin = requestContext.get("is-admin"); // Type: boolean

    return tier === "enterprise"
      ? "You are a premium support agent with full access."
      : "You are a helpful support assistant.";
  },
});
```

### Type-Safe Iteration

```typescript
// Iterate over context with type safety
const logContext = (ctx: RequestContext<AppContext>) => {
  // Get all keys with proper typing
  const keys = ctx.keys();  // Type: Array<keyof AppContext>

  // Get all entries with proper typing
  const entries = ctx.entries();  // Type: Array<[keyof AppContext, AppContext[keyof AppContext]]>

  for (const [key, value] of entries) {
    console.log(`${key}: ${value}`);
  }
};
```

### Generic Context Functions

```typescript
// Type-safe utility functions
function getContextValue<T extends AppContext, K extends keyof T>(
  ctx: RequestContext<T>,
  key: K,
  defaultValue: T[K]
): T[K] {
  return ctx.get(key) ?? defaultValue;
}

// Usage
const tier = getContextValue(requestContext, "user-tier", "free");
// tier is typed as "free" | "pro" | "enterprise"
```

### Context Type Checklist

| Requirement | Description |
|-------------|-------------|
| Centralized type | Single source of truth for context shape |
| All keys defined | Every key used in .set() or .get() is in the type |
| Value types specific | Use union types, not just `string` |
| Shared across files | Same type imported everywhere |
| Optional values | Use `?` for keys that may not be set |

### How to Fix

1. Create a centralized type definition file for your context
2. Define all keys and their specific value types
3. Update RequestContext creation to use the type parameter
4. Import the type in all files that access context
5. Fix any type errors that surface from incorrect access

### Reference

- [Request Context Documentation](https://mastra.ai/docs/v1/server/request-context)
- [TypeScript Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
