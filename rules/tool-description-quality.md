---
title: Tool Description Quality for LLM
impact: MEDIUM
impactDescription: LLM chooses wrong tools, misuses tools, poor agent behavior
tags: tool, description, llm, documentation
category: tool
---

## Tool Description Quality for LLM

**Impact: MEDIUM (LLM chooses wrong tools, misuses tools, poor agent behavior)**

Tool descriptions are the primary way the LLM understands when and how to
use a tool. Poor descriptions lead to wrong tool selection, incorrect usage,
or failure to use appropriate tools.

### What to Check

- Description explains WHAT the tool does
- Description explains WHEN to use the tool
- Description differentiates from similar tools
- Parameter descriptions are clear
- Examples or usage hints are provided when helpful

### Incorrect Configuration

```typescript
// Vague description
const vagueTool = createTool({
  id: "search",
  description: "Searches for things",  // What things? Where? How?
  inputSchema: z.object({ q: z.string() }),  // 'q' - what does this mean?
});

// Missing context
const noContextTool = createTool({
  id: "get-data",
  description: "Gets data from the API",  // Which API? What data?
  inputSchema: z.object({
    id: z.string(),    // ID of what?
    type: z.string(),  // Type of what?
  }),
});

// No differentiation from similar tools
const confusingSimilar = createTool({
  id: "lookup",
  description: "Looks up information",  // How is this different from 'search'?
});
```

### Correct Configuration

```typescript
const wellDescribedTool = createTool({
  id: "search-products",
  description: `Search the product catalog for items matching given criteria.

Use this tool when:
- Customer asks about product availability
- Customer wants to find products by name, category, or feature
- You need to look up product details or pricing

Do NOT use for:
- Checking order status (use get-order-status instead)
- Inventory counts (use check-inventory instead)

Returns product details including name, price, description, and availability.`,
  inputSchema: z.object({
    query: z.string()
      .describe("Search keywords - can include product names, features, or categories"),
    category: z.enum(["electronics", "clothing", "home", "outdoor"])
      .optional()
      .describe("Optional: Filter to specific product category"),
    inStockOnly: z.boolean()
      .default(false)
      .describe("When true, only returns products currently in stock"),
    priceMax: z.number()
      .optional()
      .describe("Optional: Maximum price filter in USD"),
  }),
  outputSchema: z.object({
    products: z.array(z.object({
      id: z.string().describe("Unique product ID"),
      name: z.string().describe("Product display name"),
      price: z.number().describe("Current price in USD"),
      inStock: z.boolean().describe("Whether product is available"),
      description: z.string().describe("Product description"),
    })),
    totalFound: z.number().describe("Total matching products (may exceed returned list)"),
  }),
  execute: async ({ query, category, inStockOnly, priceMax }) => {
    // ...
  },
});
```

### Description Components

```typescript
const completeDescription = createTool({
  id: "process-refund",
  description: `
Process a customer refund for a specific order.

## Purpose
Issues a refund to the customer's original payment method.

## When to Use
- Customer requests refund for eligible order
- Order is within 30-day return window
- Item condition meets return policy

## When NOT to Use
- Order is over 30 days old (use request-exception instead)
- Customer wants exchange (use process-exchange instead)
- Refund amount exceeds $500 (requires manager approval)

## Prerequisites
- Must have valid order ID from order lookup
- Customer identity must be verified

## Returns
Refund confirmation with transaction ID and expected timeline.
`,
  inputSchema: z.object({
    orderId: z.string()
      .describe("Order ID from order lookup (format: ORD-XXXXX)"),
    reason: z.enum([
      "defective",
      "not_as_described",
      "changed_mind",
      "arrived_late",
      "other"
    ]).describe("Reason for refund - affects return shipping policy"),
    amount: z.number()
      .optional()
      .describe("Partial refund amount in USD. Omit for full refund."),
    notes: z.string()
      .optional()
      .describe("Additional notes about the refund (for records)"),
  }),
});
```

### Differentiating Similar Tools

```typescript
// Clear differentiation between related tools
const productSearch = createTool({
  id: "search-products",
  description: `Search the product CATALOG for items to purchase.
Use when: Customer is SHOPPING for products.
Returns: Product listings with prices.`,
});

const orderSearch = createTool({
  id: "search-orders",
  description: `Search customer's ORDER HISTORY for past purchases.
Use when: Customer asks about PREVIOUS orders.
Returns: Order summaries with status.`,
});

const inventoryCheck = createTool({
  id: "check-inventory",
  description: `Check STOCK LEVELS for a specific product.
Use when: Need exact QUANTITY available.
Returns: Current stock count by location.`,
});
```

### Parameter Descriptions

```typescript
// Good parameter descriptions
inputSchema: z.object({
  // Clear, specific descriptions
  customerId: z.string()
    .describe("Customer ID (format: CUS-XXXXX) from customer lookup"),

  // Explain the options
  priority: z.enum(["low", "medium", "high", "urgent"])
    .describe("low: 5 day SLA, medium: 2 day, high: 24hr, urgent: 4hr"),

  // Explain defaults
  limit: z.number()
    .default(10)
    .describe("Number of results to return (default: 10, max: 100)"),

  // Explain format expectations
  dateRange: z.object({
    start: z.string().describe("Start date in ISO format (YYYY-MM-DD)"),
    end: z.string().describe("End date in ISO format (YYYY-MM-DD)"),
  }).optional().describe("Optional date filter for results"),
});
```

### Description Quality Checklist

| Element | Question |
|---------|----------|
| What | Does it explain what the tool does? |
| When | Does it explain when to use it? |
| When Not | Does it explain when NOT to use it? |
| Differentiation | Is it distinct from similar tools? |
| Prerequisites | Are requirements clear? |
| Parameters | Are all inputs well-described? |
| Output | Is the return value explained? |

### How to Fix

1. Rewrite descriptions to include what/when/when-not
2. Add `.describe()` to ALL schema parameters
3. For similar tools, add clear differentiation
4. Include format expectations (IDs, dates, etc.)
5. Test by asking: "Would an LLM know when to use this?"
6. Consider adding usage examples for complex tools

### Reference

- [Tool Creation](https://mastra.ai/docs/v1/tools/create-tool)
- [Anthropic Tool Use](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)
