---
title: Authentication Configuration
impact: MEDIUM
impactDescription: Unauthorized access, data exposure, security breach
tags: security, authentication, authorization, api
category: security
---

## Authentication Configuration

**Impact: MEDIUM (Unauthorized access, data exposure, security breach)**

API endpoints should have authentication to prevent unauthorized access.
Without authentication, anyone can access your agents, read data, and
potentially incur costs on your API keys.

### What to Check

- Authentication middleware is configured
- Protected routes require valid credentials
- API keys or tokens are validated
- User context is properly set from auth
- Auth failures return appropriate errors

### Incorrect Configuration

```typescript
// No authentication - completely open!
app.post("/api/chat", async (c) => {
  const { message } = await c.req.json();
  const response = await agent.generate(message);
  return c.json({ response });
});

// Authentication but not enforced
const authMiddleware = async (c, next) => {
  const token = c.req.header("Authorization");
  if (token) {
    c.set("user", await validateToken(token));
  }
  // Missing: what if no token? Still continues!
  await next();
};

// Checking auth in some routes but not others
app.post("/api/chat", async (c) => {  // Protected
  if (!c.get("user")) return c.json({ error: "Unauthorized" }, 401);
  // ...
});

app.post("/api/workflow", async (c) => {  // Forgot to check!
  // No auth check - exposed!
});
```

### Correct Configuration

```typescript
import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { jwt } from "hono/jwt";

const app = new Hono();

// Option 1: Simple API key authentication
const apiKeyAuth = async (c: Context, next: Next) => {
  const apiKey = c.req.header("X-API-Key");

  if (!apiKey) {
    return c.json({ error: "API key required" }, 401);
  }

  const validKey = await validateApiKey(apiKey);
  if (!validKey) {
    return c.json({ error: "Invalid API key" }, 401);
  }

  // Set user context from API key
  c.set("user", validKey.user);
  c.set("permissions", validKey.permissions);

  await next();
};

// Option 2: JWT authentication
const jwtAuth = jwt({
  secret: process.env.JWT_SECRET!,
});

const jwtMiddleware = async (c: Context, next: Next) => {
  try {
    await jwtAuth(c, next);
  } catch (error) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
};

// Apply to all API routes
app.use("/api/*", apiKeyAuth);  // or jwtMiddleware

// Routes are now protected
app.post("/api/chat", async (c) => {
  const user = c.get("user");  // Guaranteed to exist
  const { message } = await c.req.json();

  const response = await agent.generate(message, {
    memory: {
      thread: `user-${user.id}`,
      resource: user.id,
    },
  });

  return c.json({ response: response.text });
});
```

### Request Context Integration

```typescript
// Combine auth with RequestContext
const authContextMiddleware = async (c: Context, next: Next) => {
  // Validate authentication
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Bearer token required" }, 401);
  }

  const token = authHeader.slice(7);
  let user;

  try {
    user = await verifyToken(token);
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }

  // Create RequestContext with user info
  const requestContext = new RequestContext<AppContext>();
  requestContext.set("user-id", user.id);
  requestContext.set("user-tier", user.tier);
  requestContext.set("is-admin", user.roles.includes("admin"));

  c.set("requestContext", requestContext);
  c.set("user", user);

  await next();
};

app.use("/api/*", authContextMiddleware);
```

### Role-Based Authorization

```typescript
// Authorization middleware
const requireRole = (requiredRole: string) => {
  return async (c: Context, next: Next) => {
    const user = c.get("user");

    if (!user) {
      return c.json({ error: "Authentication required" }, 401);
    }

    if (!user.roles.includes(requiredRole)) {
      return c.json({ error: "Insufficient permissions" }, 403);
    }

    await next();
  };
};

// Apply to specific routes
app.post("/api/admin/users", requireRole("admin"), async (c) => {
  // Only admins can access
});

app.post("/api/chat", requireRole("user"), async (c) => {
  // Any authenticated user
});
```

### Public vs Protected Routes

```typescript
const app = new Hono();

// Public routes (no auth required)
app.get("/health", (c) => c.json({ status: "ok" }));
app.get("/api/public/docs", (c) => c.json({ docs: "..." }));

// Protected routes
const protectedApi = new Hono();
protectedApi.use("*", authMiddleware);  // All routes in this group

protectedApi.post("/chat", async (c) => { /* ... */ });
protectedApi.post("/workflow", async (c) => { /* ... */ });
protectedApi.get("/history", async (c) => { /* ... */ });

app.route("/api/v1", protectedApi);

// Webhook routes (different auth)
const webhooks = new Hono();
webhooks.use("*", webhookAuth);  // Verify webhook signatures

webhooks.post("/stripe", async (c) => { /* ... */ });
webhooks.post("/github", async (c) => { /* ... */ });

app.route("/webhooks", webhooks);
```

### Authentication Methods

| Method | Use Case | Security Level |
|--------|----------|---------------|
| API Key | Server-to-server | Medium |
| JWT | User sessions | High |
| OAuth | Third-party auth | High |
| Webhook signature | Inbound webhooks | Medium |

### How to Fix

1. Add authentication middleware to your server
2. Apply middleware to all API routes
3. Return 401 for missing credentials
4. Return 403 for insufficient permissions
5. Integrate auth with RequestContext
6. Audit routes to ensure none are exposed

### Reference

- [Hono Authentication](https://hono.dev/guides/middleware#authentication)
- [Server Configuration](https://mastra.ai/docs/v1/server/overview)
