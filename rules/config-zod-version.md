---
title: Zod Version Compatibility
impact: CRITICAL
impactDescription: Schema validation fails, type errors throughout codebase
tags: zod, schemas, validation, types, version
category: config
---

## Zod Version Compatibility

**Impact: CRITICAL (Schema validation fails, type errors throughout codebase)**

Mastra requires Zod version 4 or higher for schema validation. Zod v3 has
incompatible APIs that will cause runtime errors when defining tool schemas,
workflow inputs/outputs, and other validated structures.

### What to Check

- Zod is installed: `npm ls zod`
- Version is 4.x or higher
- No conflicting Zod versions in dependency tree
- Import uses correct syntax for Zod 4

### Incorrect Configuration

```json
// package.json - OLD ZOD VERSION
{
  "dependencies": {
    "zod": "^3.22.4"  // v3 not compatible!
  }
}
```

```typescript
// Using deprecated Zod 3 patterns
import { z } from "zod";

// v3 optional syntax (deprecated in v4)
const schema = z.object({
  name: z.string().optional().default(""),  // May behave differently
});
```

**Common Error with Zod v3:**

```
TypeError: z.string is not a function
Type 'ZodString' is not assignable to type 'ZodType'
```

### Correct Configuration

```json
// package.json
{
  "dependencies": {
    "zod": "^4"
  }
}
```

```typescript
// src/mastra/tools/example-tool.ts
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const exampleTool = createTool({
  id: "example-tool",
  description: "An example tool",
  inputSchema: z.object({
    query: z.string().describe("Search query"),
    limit: z.number().optional().default(10),
  }),
  outputSchema: z.object({
    results: z.array(z.string()),
    count: z.number(),
  }),
  execute: async ({ query, limit }) => {
    return { results: [], count: 0 };
  },
});
```

### How to Fix

1. Check current Zod version:

```bash
npm ls zod
```

2. Update to Zod 4:

```bash
npm install zod@^4
```

3. Check for peer dependency conflicts:

```bash
npm ls zod --all
```

4. If conflicts exist, update all packages or use overrides:

```json
// package.json
{
  "overrides": {
    "zod": "^4"
  }
}
```

5. Run `npm install` and verify no duplicate versions

### Zod 4 Changes to Note

| Feature | Zod 3 | Zod 4 |
|---------|-------|-------|
| Imports | `import { z } from "zod"` | Same |
| Optional | `.optional()` | `.optional()` (same) |
| Default | `.default(val)` | `.default(val)` (same) |
| Describe | `.describe("...")` | `.describe("...")` (same) |
| Error handling | Different format | New `ZodError` structure |

### Verification

```typescript
// Quick test to verify Zod version works with Mastra
import { z } from "zod";
import { createTool } from "@mastra/core/tools";

const testSchema = z.object({
  name: z.string(),
});

// If this compiles without errors, Zod version is compatible
```

### Reference

- [Zod Documentation](https://zod.dev)
- [Tool Schema Reference](https://mastra.ai/reference/v1/tools/create-tool)
