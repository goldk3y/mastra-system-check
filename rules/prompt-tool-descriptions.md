---
title: Tool Descriptions Must Be Clear and Distinct
impact: HIGH
impactDescription: Wrong tool selected, tools confused, poor agent performance
tags: prompt, tools, descriptions, clarity
category: prompt
---

## Tool Descriptions Must Be Clear and Distinct

**Impact: HIGH (Wrong tool selected, tools confused, poor agent performance)**

Tool descriptions guide the LLM's tool selection. Vague, overlapping, or
poorly written descriptions cause the agent to select wrong tools, use
tools incorrectly, or fail to use available tools when appropriate.

### What to Check

- Each tool has a clear, specific description
- Descriptions explain WHEN to use the tool
- Descriptions explain WHAT the tool does
- No overlapping descriptions between tools
- Parameter descriptions are clear

### Incorrect Configuration

```typescript
// Vague descriptions - when should these be used?
const vagueTool1 = createTool({
  id: "tool-1",
  description: "Does stuff with data",  // What stuff? What data?
  inputSchema: z.object({ input: z.string() }),
  execute: async ({ input }) => ({ result: input }),
});

const vagueTool2 = createTool({
  id: "tool-2",
  description: "Handles things",  // What things?
  inputSchema: z.object({ data: z.any() }),
  execute: async ({ data }) => ({ output: data }),
});

// Overlapping descriptions - which one to use?
const overlapping1 = createTool({
  id: "search",
  description: "Search for information",
  inputSchema: z.object({ query: z.string() }),
});

const overlapping2 = createTool({
  id: "find",
  description: "Find information you need",  // Same as search?
  inputSchema: z.object({ query: z.string() }),
});

// Missing parameter descriptions
const missingParamDesc = createTool({
  id: "send-email",
  description: "Send an email",
  inputSchema: z.object({
    to: z.string(),      // What format? Can it be multiple?
    subject: z.string(), // Any length limits?
    body: z.string(),    // Plain text? HTML?
  }),
});
```

### Correct Configuration

```typescript
// Clear, distinct, well-documented tools
const searchDocsTool = createTool({
  id: "search-docs",
  description: `Search the official API documentation for specific topics.
    Use this when users ask about:
    - How to use specific API endpoints
    - Parameter requirements for API calls
    - Authentication methods
    - Rate limits and quotas
    Returns: Relevant documentation excerpts with links`,
  inputSchema: z.object({
    query: z.string().describe("Search terms (e.g., 'authentication', 'create user endpoint')"),
    section: z.enum(["auth", "endpoints", "errors", "guides"]).optional()
      .describe("Optional: limit search to specific doc section"),
  }),
  outputSchema: z.object({
    results: z.array(z.object({
      title: z.string(),
      content: z.string(),
      url: z.string(),
    })),
  }),
  execute: async ({ query, section }) => { /* ... */ },
});

const searchCodeExamples = createTool({
  id: "search-code-examples",
  description: `Search the code examples repository for implementation samples.
    Use this when users:
    - Ask for code samples or snippets
    - Want to see how something is implemented
    - Need working examples to copy/modify
    Returns: Code snippets with language and context`,
  inputSchema: z.object({
    query: z.string().describe("What kind of code to find (e.g., 'oauth flow', 'file upload')"),
    language: z.enum(["javascript", "python", "go", "all"]).default("all")
      .describe("Programming language filter"),
  }),
  outputSchema: z.object({
    examples: z.array(z.object({
      title: z.string(),
      language: z.string(),
      code: z.string(),
    })),
  }),
  execute: async ({ query, language }) => { /* ... */ },
});

const createSupportTicket = createTool({
  id: "create-support-ticket",
  description: `Create a support ticket for issues requiring human assistance.
    Use this when:
    - User has a bug that needs engineering investigation
    - User needs account-level changes you can't make
    - Issue is complex and needs human follow-up
    Do NOT use for:
    - Questions answerable from docs
    - Simple how-to questions
    Returns: Ticket ID and expected response time`,
  inputSchema: z.object({
    title: z.string().min(10).max(100)
      .describe("Brief summary of the issue (10-100 chars)"),
    description: z.string().min(50)
      .describe("Detailed description including steps to reproduce, at least 50 chars"),
    priority: z.enum(["low", "medium", "high", "urgent"])
      .describe("low: nice-to-have, medium: blocking but has workaround, high: blocking work, urgent: production down"),
    category: z.enum(["bug", "feature", "account", "billing"])
      .describe("Type of issue"),
  }),
  execute: async (input) => { /* ... */ },
});
```

### Tool Description Components

```typescript
const wellDescribedTool = createTool({
  id: "process-refund",
  description: `
    Process a refund for a customer order.

    WHEN TO USE:
    - Customer requests refund for eligible order
    - Order is within return window (14 days)
    - Item is in returnable condition

    WHEN NOT TO USE:
    - Order is past return window (use escalate_refund instead)
    - Customer wants exchange (use exchange_item instead)
    - Refund amount exceeds $500 (use escalate_refund instead)

    REQUIRES:
    - Valid order ID from order_history tool
    - Customer confirmation of refund (not exchange)

    RETURNS:
    - Confirmation with refund ID and timeline
    - Error if order not eligible
  `,
  inputSchema: z.object({
    orderId: z.string().describe("Order ID from order_history lookup"),
    reason: z.enum(["defective", "not_as_described", "changed_mind", "wrong_item"])
      .describe("Customer's reason for refund"),
    amount: z.number().optional()
      .describe("Partial refund amount. Omit for full refund."),
  }),
});
```

### Distinguishing Similar Tools

```typescript
// Three search tools with clear distinctions
const tools = {
  searchProducts: createTool({
    id: "search-products",
    description: "Search product catalog. Use when customer is looking to BUY something.",
  }),

  searchOrders: createTool({
    id: "search-orders",
    description: "Search customer's order history. Use when asking about PAST purchases.",
  }),

  searchFAQ: createTool({
    id: "search-faq",
    description: "Search help articles. Use when customer has QUESTIONS about policies or how-to.",
  }),
};
```

### Parameter Description Best Practices

| Element | Bad | Good |
|---------|-----|------|
| Type hint | `query: z.string()` | `query: z.string().describe("Search keywords")` |
| Format | `email: z.string()` | `email: z.string().email().describe("Recipient email address")` |
| Options | `priority: z.enum([...])` | Add `.describe()` explaining each option |
| Optional | `limit: z.number().optional()` | `.describe("Max results. Default: 10, Max: 100")` |

### How to Fix

1. Write descriptions that explain WHEN and WHAT
2. Add "Use this when..." and "Don't use when..." guidance
3. Ensure no two tools have overlapping descriptions
4. Add `.describe()` to all input schema fields
5. Specify return value format in description
6. Test by asking: "Could an LLM distinguish these tools?"

### Reference

- [Tool Creation](https://mastra.ai/docs/v1/tools/create-tool)
- [Anthropic: Tool Use Best Practices](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)
