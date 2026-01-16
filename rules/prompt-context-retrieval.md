---
title: Just-in-Time Context Retrieval
impact: HIGH
impactDescription: Wasted context window, slower responses, stale data
tags: prompt, context, retrieval, tools, efficiency
category: prompt
---

## Just-in-Time Context Retrieval

**Impact: HIGH (Wasted context window, slower responses, stale data)**

Loading all potentially relevant context upfront wastes the context window
and may include stale data. Instead, give agents tools to retrieve specific
context when needed, keeping the base prompt lean and ensuring fresh data.

### What to Check

- Large documents are not embedded in instructions
- Tools exist for retrieving context on demand
- Pre-loaded context is truly essential
- Dynamic data is fetched fresh, not cached in prompt
- Agent knows when to retrieve vs use existing context

### Incorrect Configuration

```typescript
// Pre-loading everything - wasteful and potentially stale
const preloadedAgent = new Agent({
  id: "preloaded",
  model: "openai/gpt-4o",
  instructions: `
    You are a product support agent.

    ## Complete Product Catalog
    ${JSON.stringify(entireProductCatalog)}  // 20,000 tokens

    ## All Customer Policies
    ${allPolicies}  // 15,000 tokens

    ## FAQ Database
    ${faqDatabase}  // 10,000 tokens

    ## Recent Announcements
    ${recentAnnouncements}  // 5,000 tokens (already stale!)

    Help customers with their questions.
  `,
  // Problems:
  // - 50,000 tokens before conversation starts
  // - Announcements are stale after prompt creation
  // - Most context never used in typical conversation
});
```

### Correct Configuration

```typescript
// Just-in-time retrieval
const jitAgent = new Agent({
  id: "jit-agent",
  model: "openai/gpt-4o",
  instructions: `
    You are a product support agent with access to our knowledge systems.

    ## Available Tools
    - search_products: Find products by name, category, or feature
    - search_policies: Look up return, shipping, warranty policies
    - search_faq: Find answers to common questions
    - get_announcements: Get latest product updates and news

    ## Approach
    - Start by understanding the customer's question
    - Search relevant systems for accurate, current information
    - Combine information from multiple sources when needed
    - Always cite which source your answer came from

    ## When to Search
    - Product details: Always search, don't guess specs
    - Policies: Search for exact policy wording
    - Pricing: Always verify current prices
    - Availability: Must check real-time inventory
  `,
  tools: {
    searchProducts,
    searchPolicies,
    searchFaq,
    getAnnouncements,
  },
});
```

### Retrieval Tool Design

```typescript
// Well-designed retrieval tool
const searchPolicies = createTool({
  id: "search-policies",
  description: `Search company policies for specific topics.
    Use when customer asks about returns, warranties, shipping, etc.
    Returns relevant policy sections with last-updated date.`,
  inputSchema: z.object({
    query: z.string().describe("Policy topic to search (e.g., 'return window', 'warranty coverage')"),
    category: z.enum(["returns", "shipping", "warranty", "payment", "privacy"]).optional()
      .describe("Optional category filter"),
  }),
  outputSchema: z.object({
    results: z.array(z.object({
      title: z.string(),
      content: z.string(),
      lastUpdated: z.string(),
      url: z.string(),
    })),
    disclaimer: z.string().optional(),
  }),
  execute: async ({ query, category }) => {
    // Search policy database
    const results = await policyDB.search(query, { category });
    return {
      results,
      disclaimer: "Policies may vary by region. Verify with customer's location.",
    };
  },
});
```

### Hybrid Approach: Essential + Retrieval

```typescript
// Some context is truly essential, rest is retrieved
const hybridAgent = new Agent({
  id: "hybrid-agent",
  model: "openai/gpt-4o",
  instructions: ({ requestContext }) => {
    const userName = requestContext?.get("user-name") || "Customer";
    const accountType = requestContext?.get("account-type") || "standard";

    // Essential context (small, always needed)
    return `
      You are helping ${userName} (${accountType} account).

      ## Quick Reference
      - Standard support hours: 9am-6pm EST
      - Premium support: 24/7
      - Emergency line: 1-800-HELP

      ## Tools for Detailed Information
      - search_knowledge_base: Technical documentation and guides
      - check_account_status: Customer's specific account details
      - get_order_history: Customer's recent orders
      - search_tickets: Customer's support history

      ## Approach
      Use tools to get specific information rather than guessing.
      The quick reference above is for common questions only.
    `;
  },
  tools: {
    searchKnowledgeBase,
    checkAccountStatus,
    getOrderHistory,
    searchTickets,
  },
});
```

### Context Size Guidelines

| Context Type | Embed in Prompt? | Retrieval Tool? |
|--------------|------------------|-----------------|
| Role definition | Yes | No |
| Quick reference (1 page) | Yes | No |
| Full documentation | No | Yes |
| User preferences | Small: Yes, Large: No | For large |
| Product catalog | No | Yes |
| Real-time data | No | Yes |
| Historical data | No | Yes |

### Caching Strategy

```typescript
// Retrieval with intelligent caching
const cachedSearch = createTool({
  id: "cached-search",
  description: "Search with caching for frequently accessed data",
  execute: async ({ query }, context) => {
    const cacheKey = `search:${query}`;
    const threadId = context?.mastra?.requestContext?.get("thread-id");

    // Check if already retrieved in this conversation
    const cached = await conversationCache.get(threadId, cacheKey);
    if (cached && !cached.stale) {
      return { ...cached.data, fromCache: true };
    }

    // Fetch fresh
    const results = await database.search(query);

    // Cache for this conversation (not across conversations)
    await conversationCache.set(threadId, cacheKey, results, { ttl: 300 });

    return { ...results, fromCache: false };
  },
});
```

### Anti-Pattern: Over-Retrieval

```typescript
// Don't retrieve everything for every request
const overRetrievalAgent = new Agent({
  instructions: `
    Before responding to ANY question:
    1. Search products
    2. Search policies
    3. Search FAQ
    4. Check announcements
    5. Get user history
    Then respond.
  `,
  // Problem: 5 tool calls for "Hi, how are you?"
});

// Better: Targeted retrieval
const targetedAgent = new Agent({
  instructions: `
    Use tools when you need specific information:
    - Product questions → search_products
    - Policy questions → search_policies
    - Account questions → check_account

    For general conversation, respond directly without tools.
  `,
});
```

### How to Fix

1. Identify large static content in prompts
2. Create retrieval tools for each content type
3. Keep only essential quick-reference in prompt
4. Add guidance on when to retrieve vs respond directly
5. Implement caching for frequently accessed data
6. Test that retrieval produces fresher results than embedding

### Reference

- [Anthropic: Effective Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [RAG Documentation](https://mastra.ai/docs/v1/rag/overview)
