---
title: Tool Schema Validation with Zod
impact: MEDIUM
impactDescription: Invalid tool inputs/outputs, runtime type errors
tags: tool, schema, validation, zod
category: tool
---

## Tool Schema Validation with Zod

**Impact: MEDIUM (Invalid tool inputs/outputs, runtime type errors)**

Tools must define `inputSchema` and `outputSchema` using Zod to validate
data at runtime and provide TypeScript types. Invalid or missing schemas
cause runtime errors and make tools unreliable.

### What to Check

- inputSchema is defined using Zod
- outputSchema is defined using Zod
- Schemas accurately describe expected data
- Schema field descriptions are provided
- Execute function returns data matching outputSchema

### Incorrect Configuration

```typescript
// Missing schemas
const noSchemasTool = createTool({
  id: "no-schemas",
  description: "Does something",
  // Missing inputSchema!
  // Missing outputSchema!
  execute: async (input) => {
    return { result: "done" };
  },
});

// Non-Zod schemas
const badSchemasTool = createTool({
  id: "bad-schemas",
  description: "Has wrong schemas",
  inputSchema: {
    type: "object",
    properties: { query: { type: "string" } },
  },  // This is JSON Schema, not Zod!
  execute: async (input) => {},
});

// Schema mismatch
const mismatchTool = createTool({
  id: "mismatch",
  description: "Schema doesn't match implementation",
  inputSchema: z.object({ query: z.string() }),
  outputSchema: z.object({ result: z.string() }),
  execute: async ({ query }) => {
    return { answer: query };  // Wrong! Returns 'answer', schema expects 'result'
  },
});
```

### Correct Configuration

```typescript
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const wellDefinedTool = createTool({
  id: "search-products",
  description: "Search the product catalog by query",
  inputSchema: z.object({
    query: z.string()
      .min(1)
      .describe("Search query for products"),
    category: z.enum(["electronics", "clothing", "home", "all"])
      .default("all")
      .describe("Product category to filter by"),
    maxResults: z.number()
      .int()
      .min(1)
      .max(50)
      .default(10)
      .describe("Maximum number of results to return"),
    priceRange: z.object({
      min: z.number().min(0).optional(),
      max: z.number().min(0).optional(),
    }).optional().describe("Optional price filter"),
  }),
  outputSchema: z.object({
    products: z.array(z.object({
      id: z.string(),
      name: z.string(),
      price: z.number(),
      category: z.string(),
      inStock: z.boolean(),
    })).describe("List of matching products"),
    totalCount: z.number()
      .describe("Total number of matches (may exceed returned)"),
    searchTime: z.number()
      .describe("Search execution time in milliseconds"),
  }),
  execute: async ({ query, category, maxResults, priceRange }) => {
    const results = await productDB.search({
      query,
      category: category === "all" ? undefined : category,
      limit: maxResults,
      priceMin: priceRange?.min,
      priceMax: priceRange?.max,
    });

    return {
      products: results.items,
      totalCount: results.total,
      searchTime: results.executionMs,
    };
  },
});
```

### Schema Design Best Practices

```typescript
// Use specific types
const goodTypes = z.object({
  email: z.string().email(),           // Not just z.string()
  url: z.string().url(),               // Validated URL
  date: z.string().datetime(),         // ISO datetime
  id: z.string().uuid(),               // UUID format
  count: z.number().int().min(0),      // Non-negative integer
});

// Use enums for known values
const goodEnums = z.object({
  status: z.enum(["pending", "active", "completed"]),
  priority: z.enum(["low", "medium", "high"]),
});

// Use defaults for optional fields
const goodDefaults = z.object({
  limit: z.number().default(10),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  includeArchived: z.boolean().default(false),
});

// Use describe for documentation
const goodDescriptions = z.object({
  query: z.string().describe("Search keywords, supports AND/OR operators"),
  filters: z.array(z.string()).describe("Field:value pairs for filtering"),
});
```

### Complex Schema Patterns

```typescript
// Union types for different input modes
const flexibleInput = z.union([
  z.object({
    mode: z.literal("id"),
    id: z.string().uuid(),
  }),
  z.object({
    mode: z.literal("search"),
    query: z.string(),
  }),
]);

// Discriminated unions
const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), data: z.any() }),
  z.object({ action: z.literal("update"), id: z.string(), data: z.any() }),
  z.object({ action: z.literal("delete"), id: z.string() }),
]);

// Recursive schemas (for tree structures)
const treeNodeSchema: z.ZodType<TreeNode> = z.lazy(() =>
  z.object({
    value: z.string(),
    children: z.array(treeNodeSchema).default([]),
  })
);
```

### Output Schema for Errors

```typescript
// Include error state in output schema
const robustOutput = z.object({
  success: z.boolean(),
  data: z.object({
    items: z.array(z.any()),
  }).optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }).optional(),
});

const robustTool = createTool({
  id: "robust-tool",
  outputSchema: robustOutput,
  execute: async (input) => {
    try {
      const items = await fetchItems(input);
      return { success: true, data: { items } };
    } catch (error) {
      return {
        success: false,
        error: {
          code: "FETCH_FAILED",
          message: error.message,
        },
      };
    }
  },
});
```

### Validation Behavior

```typescript
// Input validation happens before execute
// Output validation happens after execute

// If input doesn't match schema: Tool call rejected, error returned
// If output doesn't match schema: Runtime error (catch this!)

// Always ensure execute returns matching output
execute: async (input) => {
  // Type of 'input' is inferred from inputSchema
  // Return type must match outputSchema

  return {
    // All required fields must be present
    // Types must match schema
  };
}
```

### How to Fix

1. Define inputSchema using Zod
2. Define outputSchema using Zod
3. Add `.describe()` to all fields for LLM understanding
4. Use specific types (email, url, int, etc.)
5. Ensure execute return matches outputSchema exactly
6. Test with edge cases (empty, null, invalid inputs)

### Reference

- [Tool Creation](https://mastra.ai/docs/v1/tools/create-tool)
- [Zod Documentation](https://zod.dev)
