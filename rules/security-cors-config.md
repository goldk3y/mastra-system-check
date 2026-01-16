---
title: CORS Configuration for Production
impact: MEDIUM
impactDescription: Cross-origin attacks, unauthorized API access
tags: security, cors, production, api
category: security
---

## CORS Configuration for Production

**Impact: MEDIUM (Cross-origin attacks, unauthorized API access)**

CORS (Cross-Origin Resource Sharing) must be properly configured for
production to prevent unauthorized cross-origin requests. Overly permissive
CORS allows any website to access your API.

### What to Check

- CORS is explicitly configured, not defaulting to allow-all
- Allowed origins are specific domains, not wildcards
- Credentials setting matches authentication requirements
- Preflight caching is appropriate
- Different environments have appropriate settings

### Incorrect Configuration

```typescript
// Allow all origins - dangerous in production!
app.use(cors());  // Defaults to allow all

// Wildcard origin with credentials - invalid and insecure
app.use(cors({
  origin: "*",
  credentials: true,  // Can't use with wildcard!
}));

// Overly permissive in production
app.use(cors({
  origin: true,  // Reflects any origin - equivalent to *
}));

// No CORS headers - may work but unpredictable
// Relying on no configuration
```

### Correct Configuration

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

// Development configuration
const devCors = {
  origin: ["http://localhost:3000", "http://localhost:5173"],
  credentials: true,
};

// Production configuration
const prodCors = {
  origin: [
    "https://app.yourdomain.com",
    "https://www.yourdomain.com",
  ],
  credentials: true,
  maxAge: 86400,  // Cache preflight for 24 hours
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
  exposeHeaders: ["X-Request-ID", "X-Trace-ID"],
};

app.use("*", cors(
  process.env.NODE_ENV === "production" ? prodCors : devCors
));
```

### Dynamic Origin Validation

```typescript
// Validate origins dynamically
const allowedOrigins = new Set([
  "https://app.yourdomain.com",
  "https://admin.yourdomain.com",
  // Add more as needed
]);

// Also allow subdomains
function isAllowedOrigin(origin: string): boolean {
  if (allowedOrigins.has(origin)) return true;

  // Allow *.yourdomain.com subdomains
  try {
    const url = new URL(origin);
    return url.hostname.endsWith(".yourdomain.com");
  } catch {
    return false;
  }
}

app.use("*", cors({
  origin: (origin) => {
    if (!origin) return null;  // Same-origin requests
    return isAllowedOrigin(origin) ? origin : null;
  },
  credentials: true,
}));
```

### Route-Specific CORS

```typescript
// Different CORS for different routes
const app = new Hono();

// Public API - more permissive
app.use("/api/public/*", cors({
  origin: "*",
  credentials: false,  // No auth needed
  maxAge: 86400,
}));

// Private API - strict origin checking
app.use("/api/v1/*", cors({
  origin: ["https://app.yourdomain.com"],
  credentials: true,
  allowHeaders: ["Content-Type", "Authorization"],
}));

// Webhook endpoints - specific origins only
app.use("/webhooks/*", cors({
  origin: [
    "https://api.stripe.com",
    "https://api.github.com",
  ],
  credentials: false,
}));
```

### With Mastra Server

```typescript
import { Mastra } from "@mastra/core";
import { serve } from "@mastra/server";

export const mastra = new Mastra({
  agents: { myAgent },
});

// Configure server with CORS
serve(mastra, {
  port: 3000,
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "https://app.yourdomain.com",
    ],
    credentials: true,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  },
});
```

### CORS Settings Reference

| Setting | Development | Production |
|---------|-------------|------------|
| origin | localhost ports | Specific domains |
| credentials | true (if using) | true (if using) |
| maxAge | Short/none | 24h (86400) |
| allowMethods | All needed | Minimum needed |
| allowHeaders | Permissive | Specific |

### Testing CORS Configuration

```bash
# Test preflight request
curl -X OPTIONS https://api.yourdomain.com/api/v1/chat \
  -H "Origin: https://app.yourdomain.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  -v

# Should see:
# Access-Control-Allow-Origin: https://app.yourdomain.com
# Access-Control-Allow-Methods: POST
# Access-Control-Allow-Headers: Content-Type, Authorization
# Access-Control-Allow-Credentials: true
```

```typescript
// Automated CORS test
async function testCors(apiUrl: string, origin: string) {
  const response = await fetch(apiUrl, {
    method: "OPTIONS",
    headers: {
      Origin: origin,
      "Access-Control-Request-Method": "POST",
    },
  });

  const allowedOrigin = response.headers.get("Access-Control-Allow-Origin");
  const isAllowed = allowedOrigin === origin || allowedOrigin === "*";

  console.log(`Origin ${origin}: ${isAllowed ? "ALLOWED" : "BLOCKED"}`);
  return isAllowed;
}

// Test various origins
await testCors("https://api.example.com", "https://app.example.com");  // Should pass
await testCors("https://api.example.com", "https://evil.com");  // Should fail
```

### How to Fix

1. Explicitly configure CORS middleware
2. List specific allowed origins (no wildcards in production)
3. Set credentials based on authentication needs
4. Configure appropriate preflight cache (maxAge)
5. Limit allowed methods and headers
6. Test with both allowed and disallowed origins

### Reference

- [CORS MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Hono CORS Middleware](https://hono.dev/middleware/builtin/cors)
