---
title: Environment Variables for Secrets
impact: MEDIUM
impactDescription: API keys exposed, security breach risk
tags: security, secrets, environment, api-keys
category: security
---

## Environment Variables for Secrets

**Impact: MEDIUM (API keys exposed, security breach risk)**

API keys and secrets must never be hardcoded in source code. They should
always be loaded from environment variables. Hardcoded secrets can be
exposed through version control, logs, or error messages.

### What to Check

- No API keys in source code
- Secrets loaded from environment variables
- .env files are in .gitignore
- .env.example exists with placeholder values
- No secrets in error messages or logs

### Incorrect Configuration

```typescript
// Hardcoded API keys - CRITICAL SECURITY ISSUE
const agent = new Agent({
  model: "openai/gpt-4o",
  // Never do this!
});

// Hardcoded in configuration
const config = {
  openaiKey: "sk-proj-abc123...",  // Exposed in code!
  databaseUrl: "postgresql://user:password@host/db",  // Credentials exposed!
};

// Committed .env file
// .gitignore missing .env entry!

// Secret in error message
catch (error) {
  console.error(`Auth failed with key: ${apiKey}`);  // Key in logs!
  throw new Error(`Database connection failed: ${dbUrl}`);  // URL in error!
}
```

### Correct Configuration

```typescript
// Load from environment
import "dotenv/config";  // Load .env in development

// Use environment variables
const openaiKey = process.env.OPENAI_API_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!openaiKey) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

// Agent automatically uses OPENAI_API_KEY
const agent = new Agent({
  model: "openai/gpt-4o",
  instructions: "You are a helpful assistant.",
});

// Storage uses DATABASE_URL
const storage = new LibSQLStore({
  id: "storage",
  url: process.env.DATABASE_URL || "file:./mastra.db",
});
```

### Environment Files

```bash
# .env (never commit!)
OPENAI_API_KEY=sk-proj-real-key-here
ANTHROPIC_API_KEY=sk-ant-real-key-here
DATABASE_URL=libsql://your-db.turso.io
DATABASE_AUTH_TOKEN=your-token-here
```

```bash
# .env.example (safe to commit)
OPENAI_API_KEY=your-openai-key-here
ANTHROPIC_API_KEY=your-anthropic-key-here
DATABASE_URL=file:./mastra.db
DATABASE_AUTH_TOKEN=your-token-here
```

```gitignore
# .gitignore
.env
.env.local
.env.*.local
.env.production
*.pem
*.key
```

### Validation on Startup

```typescript
// src/config/env.ts
import { z } from "zod";

const envSchema = z.object({
  // Required
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),

  // Optional with defaults
  DATABASE_URL: z.string().default("file:./mastra.db"),
  NODE_ENV: z.enum(["development", "staging", "production"]).default("development"),

  // Conditional requirements
  TURSO_AUTH_TOKEN: z.string().optional(),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("Environment validation failed:");
    result.error.issues.forEach(issue => {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    });
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();
```

### Safe Logging

```typescript
// Never log secrets
function logConfig() {
  console.log("Configuration:");
  console.log(`  Model: ${process.env.DEFAULT_MODEL || "openai/gpt-4o"}`);
  console.log(`  Database: ${maskUrl(process.env.DATABASE_URL)}`);
  console.log(`  OpenAI Key: ${maskKey(process.env.OPENAI_API_KEY)}`);
}

function maskKey(key: string | undefined): string {
  if (!key) return "(not set)";
  if (key.length < 8) return "****";
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

function maskUrl(url: string | undefined): string {
  if (!url) return "(not set)";
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = "****";
    }
    return parsed.toString();
  } catch {
    return "(invalid url)";
  }
}
```

### Safe Error Handling

```typescript
// Don't expose secrets in errors
try {
  await database.connect(connectionUrl);
} catch (error) {
  // Bad - exposes connection URL
  // throw new Error(`Connection failed: ${connectionUrl}`);

  // Good - generic message
  console.error("Database connection failed:", error.message);
  throw new Error("Failed to connect to database. Check DATABASE_URL configuration.");
}
```

### Secret Management for Production

```typescript
// For production, consider secret managers
// AWS Secrets Manager, HashiCorp Vault, Doppler, etc.

// Example: AWS Secrets Manager
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

async function loadSecrets() {
  const client = new SecretsManagerClient({ region: "us-east-1" });

  const response = await client.send(
    new GetSecretValueCommand({ SecretId: "mastra/production" })
  );

  const secrets = JSON.parse(response.SecretString || "{}");

  // Set as environment variables
  process.env.OPENAI_API_KEY = secrets.OPENAI_API_KEY;
  process.env.DATABASE_URL = secrets.DATABASE_URL;
}
```

### How to Fix

1. Remove all hardcoded secrets from source code
2. Move secrets to .env file (for development)
3. Add .env to .gitignore
4. Create .env.example with placeholders
5. Add startup validation for required env vars
6. Use masking in logs and error messages
7. Consider secret manager for production

### Reference

- [Environment Configuration](https://mastra.ai/docs/v1/getting-started/manual-install)
- [12-Factor App Config](https://12factor.net/config)
