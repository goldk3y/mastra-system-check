---
title: Context Middleware Setup
impact: HIGH
impactDescription: Context not populated, all downstream components fail
tags: context, middleware, setup, initialization
category: context
---

## Context Middleware Setup

**Impact: HIGH (Context not populated, all downstream components fail)**

RequestContext must be created and populated in middleware before it can
be accessed by agents, workflows, or tools. Missing or incorrectly configured
middleware results in empty or undefined context throughout the application.

### What to Check

- Middleware creates RequestContext instance
- Context is populated with required values
- Context is attached to the request/response cycle
- Middleware runs before route handlers
- Error handling doesn't skip context setup

### Incorrect Configuration

```typescript
// Middleware doesn't create context
const badMiddleware = async (c: Context, next: Next) => {
  // Does authentication but no context setup
  const user = await authenticate(c.req.header("Authorization"));
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  await next();
  // Context never created - agents can't access user info
};

// Context created but not attached
const lostContextMiddleware = async (c: Context, next: Next) => {
  const requestContext = new RequestContext<AppContext>();
  requestContext.set("user-id", getUserId(c));
  // Context created but never attached to request!
  await next();
};

// Context attached after next() - too late
const lateContextMiddleware = async (c: Context, next: Next) => {
  await next();  // Handlers already ran!
  const requestContext = new RequestContext<AppContext>();
  c.set("requestContext", requestContext);  // Too late
};
```

**Common Error Messages:**

```
requestContext is undefined
Cannot read property 'get' of undefined
Context not available in agent
```

### Correct Configuration

```typescript
// src/server/middleware/context.ts
import { Context, Next } from "hono";
import { RequestContext } from "@mastra/core";
import type { AppContext } from "../../types/context";

export const contextMiddleware = async (c: Context, next: Next) => {
  // 1. Create typed context
  const requestContext = new RequestContext<AppContext>();

  // 2. Extract and validate request data
  const userId = c.req.header("X-User-ID");
  const authToken = c.req.header("Authorization");

  // 3. Populate context with request data
  if (userId) {
    requestContext.set("user-id", userId);
    requestContext.set("user-tier", await fetchUserTier(userId));
    requestContext.set("is-admin", await checkAdminRole(userId));
  } else {
    requestContext.set("user-id", "anonymous");
    requestContext.set("user-tier", "free");
    requestContext.set("is-admin", false);
  }

  // 4. Add request metadata
  requestContext.set("locale", c.req.header("Accept-Language") || "en-US");
  requestContext.set("temperature-unit", "fahrenheit");  // Default

  // 5. Attach to request BEFORE next()
  c.set("requestContext", requestContext);

  // 6. Continue to handlers
  await next();
};
```

### Middleware Registration

```typescript
// src/server/index.ts
import { Hono } from "hono";
import { contextMiddleware } from "./middleware/context";
import { authMiddleware } from "./middleware/auth";

const app = new Hono();

// Order matters: context should be set up early
app.use("*", contextMiddleware);  // First: create context
app.use("*", authMiddleware);     // Second: can use context

// Route handlers have access to context
app.post("/api/chat", async (c) => {
  const requestContext = c.get("requestContext");
  const userId = requestContext.get("user-id");
  // ...
});
```

### Express Adapter Example

```typescript
// For Express-based servers
import express from "express";
import { RequestContext } from "@mastra/core";

const app = express();

app.use((req, res, next) => {
  const requestContext = new RequestContext<AppContext>();

  requestContext.set("user-id", req.headers["x-user-id"] as string || "anonymous");
  requestContext.set("user-tier", "free");

  // Attach to request object
  (req as any).requestContext = requestContext;

  next();
});
```

### Error-Safe Middleware

```typescript
export const safeContextMiddleware = async (c: Context, next: Next) => {
  const requestContext = new RequestContext<AppContext>();

  try {
    // Attempt to populate context
    const userId = c.req.header("X-User-ID") || "anonymous";
    requestContext.set("user-id", userId);

    // External call that might fail
    const tier = await fetchUserTier(userId).catch(() => "free");
    requestContext.set("user-tier", tier);

  } catch (error) {
    // Log but don't fail - use defaults
    console.error("Context setup error:", error);
    requestContext.set("user-id", "anonymous");
    requestContext.set("user-tier", "free");
  }

  // Always attach context, even with defaults
  c.set("requestContext", requestContext);
  await next();
};
```

### Middleware Checklist

| Step | Action |
|------|--------|
| 1 | Create RequestContext with type parameter |
| 2 | Extract data from request headers/body |
| 3 | Validate and transform extracted data |
| 4 | Set values on context with type-safe keys |
| 5 | Attach context to request with `c.set()` |
| 6 | Call `next()` to continue to handlers |

### How to Fix

1. Create middleware that initializes RequestContext
2. Extract needed data from request (headers, auth, etc.)
3. Populate context with `.set()` before calling `next()`
4. Attach context using `c.set("requestContext", ctx)`
5. Register middleware before route handlers
6. Add error handling to ensure context is always set

### Reference

- [Request Context Documentation](https://mastra.ai/docs/v1/server/request-context)
- [Server Middleware](https://mastra.ai/docs/v1/server/middleware)
