---
title: Context Header Extraction
impact: HIGH
impactDescription: Missing user data, authentication fails, wrong defaults
tags: context, headers, extraction, middleware
category: context
---

## Context Header Extraction

**Impact: HIGH (Missing user data, authentication fails, wrong defaults)**

RequestContext is typically populated from HTTP headers in middleware.
Incorrect header extraction leads to missing or wrong context values,
causing authentication failures, incorrect user identification, or
fallback to wrong defaults.

### What to Check

- Correct header names are used (case sensitivity)
- Headers are validated before use
- Fallback values are appropriate
- Standard header conventions followed
- Security headers properly handled

### Incorrect Configuration

```typescript
// Wrong header names (case matters in some frameworks)
const badMiddleware = async (c: Context, next: Next) => {
  const ctx = new RequestContext<AppContext>();

  // Header names might be wrong
  ctx.set("user-id", c.req.header("User-ID"));     // Might be "X-User-ID"
  ctx.set("auth", c.req.header("authorization"));  // Might be "Authorization"

  await next();
};

// No validation - trusting raw input
const unsafeMiddleware = async (c: Context, next: Next) => {
  const ctx = new RequestContext<AppContext>();

  // Directly using header without validation
  ctx.set("user-id", c.req.header("X-User-ID"));  // Could be anything!
  ctx.set("user-tier", c.req.header("X-User-Tier") as "free" | "pro");  // Unsafe cast

  await next();
};

// Wrong fallbacks
const wrongDefaultsMiddleware = async (c: Context, next: Next) => {
  const ctx = new RequestContext<AppContext>();

  // Empty string instead of meaningful default
  ctx.set("user-id", c.req.header("X-User-ID") || "");  // Empty is bad
  ctx.set("locale", c.req.header("Accept-Language"));   // No fallback at all

  await next();
};
```

**Common Error Messages:**

```
User ID is empty string
Invalid user tier: undefined
Cannot read locale of undefined
Authentication failed for user ''
```

### Correct Configuration

```typescript
import { Context, Next } from "hono";
import { RequestContext } from "@mastra/core";

type AppContext = {
  "user-id": string;
  "user-tier": "free" | "pro" | "enterprise";
  "locale": string;
  "is-authenticated": boolean;
  "correlation-id": string;
};

const contextMiddleware = async (c: Context, next: Next) => {
  const ctx = new RequestContext<AppContext>();

  // 1. Extract with correct header names
  const userId = c.req.header("X-User-ID");
  const authHeader = c.req.header("Authorization");
  const tierHeader = c.req.header("X-User-Tier");
  const localeHeader = c.req.header("Accept-Language");
  const correlationId = c.req.header("X-Correlation-ID");

  // 2. Validate and set user ID
  if (userId && isValidUserId(userId)) {
    ctx.set("user-id", userId);
    ctx.set("is-authenticated", true);
  } else {
    ctx.set("user-id", "anonymous");
    ctx.set("is-authenticated", false);
  }

  // 3. Validate tier with type guard
  const validTiers = ["free", "pro", "enterprise"] as const;
  const tier = validTiers.includes(tierHeader as any)
    ? (tierHeader as "free" | "pro" | "enterprise")
    : await fetchUserTier(userId);  // Fetch from DB if not in header
  ctx.set("user-tier", tier || "free");

  // 4. Parse locale with fallback
  const locale = parseLocale(localeHeader) || "en-US";
  ctx.set("locale", locale);

  // 5. Generate correlation ID if not provided
  ctx.set("correlation-id", correlationId || crypto.randomUUID());

  c.set("requestContext", ctx);
  await next();
};

// Helper functions
function isValidUserId(id: string): boolean {
  return /^[a-zA-Z0-9-_]{1,64}$/.test(id);
}

function parseLocale(header: string | undefined): string | null {
  if (!header) return null;
  // Parse "en-US,en;q=0.9" format
  const primary = header.split(",")[0]?.split(";")[0]?.trim();
  return primary || null;
}
```

### Common Header Patterns

```typescript
// Standard headers to extract
const standardHeaders = {
  // Authentication
  "Authorization": "Bearer token",
  "X-API-Key": "api-key-value",

  // User identification
  "X-User-ID": "user-123",
  "X-Tenant-ID": "tenant-456",
  "X-Organization-ID": "org-789",

  // User preferences
  "Accept-Language": "en-US,en;q=0.9",
  "X-Timezone": "America/New_York",
  "X-Temperature-Unit": "celsius",

  // Request tracking
  "X-Request-ID": "req-abc-123",
  "X-Correlation-ID": "corr-def-456",
  "X-Trace-ID": "trace-ghi-789",

  // Client information
  "User-Agent": "Mozilla/5.0...",
  "X-Client-Version": "2.1.0",
  "X-Platform": "ios",
};
```

### Secure Header Handling

```typescript
const secureMiddleware = async (c: Context, next: Next) => {
  const ctx = new RequestContext<AppContext>();

  // Validate auth token
  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const decoded = await verifyToken(token);
      ctx.set("user-id", decoded.userId);
      ctx.set("user-tier", decoded.tier);
      ctx.set("is-authenticated", true);
    } catch {
      // Invalid token - use anonymous
      ctx.set("user-id", "anonymous");
      ctx.set("is-authenticated", false);
    }
  }

  // Sanitize user-provided headers
  const rawLocale = c.req.header("Accept-Language");
  const sanitizedLocale = sanitizeLocale(rawLocale);
  ctx.set("locale", sanitizedLocale);

  c.set("requestContext", ctx);
  await next();
};

function sanitizeLocale(locale: string | undefined): string {
  if (!locale) return "en-US";
  // Remove any potentially malicious characters
  const cleaned = locale.replace(/[^a-zA-Z0-9,;=.-]/g, "");
  // Validate format
  const match = cleaned.match(/^[a-z]{2}(-[A-Z]{2})?/);
  return match ? match[0] : "en-US";
}
```

### Header Extraction Checklist

| Header | Validation | Default |
|--------|-----------|---------|
| X-User-ID | Alphanumeric, max length | "anonymous" |
| Authorization | JWT/Bearer format | null |
| X-User-Tier | Enum values | "free" |
| Accept-Language | Locale format | "en-US" |
| X-Correlation-ID | UUID format | Generate new |
| X-Timezone | Valid timezone | "UTC" |

### How to Fix

1. Use correct header names (check framework docs)
2. Validate header values before using
3. Provide meaningful fallback values
4. Type-check enum values before casting
5. Sanitize headers to prevent injection
6. Log missing critical headers for debugging

### Reference

- [Request Context](https://mastra.ai/docs/v1/server/request-context)
- [HTTP Headers (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)
