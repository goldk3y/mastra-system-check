---
title: Token Efficiency - Minimize Prompt Bloat
impact: HIGH
impactDescription: Wasted tokens, slower responses, higher costs
tags: prompt, tokens, efficiency, context, optimization
category: prompt
---

## Token Efficiency - Minimize Prompt Bloat

**Impact: HIGH (Wasted tokens, slower responses, higher costs)**

Every token in the prompt depletes the model's "attention budget." Bloated
prompts lead to slower responses, higher costs, and reduced precision as the
context window grows. Find the smallest set of high-signal tokens that
produce your desired outcome.

### What to Check

- No redundant or repetitive instructions
- Examples are diverse and canonical, not exhaustive
- Dynamic context loaded just-in-time, not pre-loaded
- Long context is summarized or compacted
- No copy-pasted documentation as context

### Incorrect Configuration

```typescript
// Bloated: Redundant instructions, pre-loaded data, excessive examples
const bloatedAgent = new Agent({
  id: "bloated-agent",
  model: "openai/gpt-4o",
  instructions: `
    You are a helpful assistant. Be helpful. Always try to help the user.
    Remember to be helpful at all times. Your goal is to help.

    Here is the complete API documentation:
    ${entireApiDocumentation}  // 50,000 tokens of docs!

    Here is every possible error code and how to handle it:
    ${allErrorCodes}  // 10,000 tokens of error codes!

    Example 1: User asks "hello" -> Respond "Hello! How can I help?"
    Example 2: User asks "hi" -> Respond "Hi! How can I help?"
    Example 3: User asks "hey" -> Respond "Hey! How can I help?"
    Example 4: User asks "greetings" -> Respond "Greetings! How can I help?"
    Example 5: User asks "howdy" -> Respond "Howdy! How can I help?"
    Example 6: User asks "good morning" -> Respond "Good morning! How can I help?"
    Example 7: User asks "good afternoon" -> Respond "Good afternoon! How can I help?"
    // 50 more greeting examples...

    Remember: Always be helpful. Being helpful is the most important thing.
    Did I mention you should be helpful?
  `,
});
```

### Correct Configuration

```typescript
// Efficient: Minimal instructions, just-in-time retrieval, diverse examples
const efficientAgent = new Agent({
  id: "efficient-agent",
  model: "openai/gpt-4o",
  instructions: `
    You are an API support assistant helping developers understand and use our API.

    ## Available Tools
    - search_docs: Search API documentation for specific topics
    - get_error_info: Look up error codes and solutions

    ## Guidelines
    - Search docs when users ask about endpoints or parameters
    - Look up errors only when users report specific error codes
    - Provide concise answers with code examples
    - Link to full documentation for complex topics

    ## Example Interaction
    User: "How do I authenticate?"
    Assistant: Let me search the docs for authentication...
    [Calls search_docs with "authentication"]
    "The API uses Bearer tokens. Include this header:
    \`Authorization: Bearer YOUR_API_KEY\`
    See full auth docs at: /docs/auth"
  `,
  tools: { searchDocs, getErrorInfo },  // Just-in-time retrieval
});
```

### Token Efficiency Patterns

| Pattern | Bloated | Efficient |
|---------|---------|-----------|
| Documentation | Pre-load all docs | Search tool retrieves on demand |
| Examples | Many similar examples | 2-3 diverse canonical examples |
| Instructions | Repeated emphasis | Single clear statement |
| Context | Everything pre-loaded | Lightweight refs, load when needed |
| History | Full conversation | Summarized key points |
| Error handling | List all errors | Lookup tool for specific errors |

### Just-in-Time Context Retrieval

```typescript
// Instead of pre-loading all user data...
const badInstructions = `
  User profile: ${JSON.stringify(fullUserProfile)}
  User history: ${JSON.stringify(last1000Interactions)}
  User preferences: ${JSON.stringify(allPreferences)}
`;

// ...create tools to fetch when needed
const getUserProfile = createTool({
  id: "get-user-profile",
  description: "Get current user's profile information",
  inputSchema: z.object({}),
  outputSchema: z.object({
    name: z.string(),
    tier: z.string(),
    joinDate: z.string(),
  }),
  execute: async (_, context) => {
    const userId = context?.mastra?.requestContext?.get("user-id");
    return await fetchUserProfile(userId);
  },
});
```

### Diverse Examples Over Exhaustive Lists

```typescript
// Bad: Exhaustive similar examples
const badExamples = `
  Example: "1+1" -> "2"
  Example: "2+2" -> "4"
  Example: "3+3" -> "6"
  Example: "4+4" -> "8"
  // ... 100 more
`;

// Good: Diverse canonical examples
const goodExamples = `
  ## Example Interactions

  ### Basic Query
  User: "What's 15% of 80?"
  Assistant: "15% of 80 is 12. (80 × 0.15 = 12)"

  ### Multi-step Problem
  User: "If I have $100 and spend 30%, then 20% of what's left?"
  Assistant: "After spending 30% ($30), you have $70.
  Then 20% of $70 is $14.
  Final amount: $56"

  ### Clarification Needed
  User: "Calculate the interest"
  Assistant: "I'd be happy to calculate interest. Could you provide:
  - Principal amount
  - Interest rate
  - Time period
  - Simple or compound interest?"
`;
```

### Prompt Compression Techniques

```typescript
// Use abbreviations for internal concepts
const compressedInstructions = `
  ## Response Format
  - Q&A: Direct answer first, explanation second
  - Error: Acknowledge, diagnose, solution
  - Tutorial: Overview, steps, verification
`;

// Use references instead of inline content
const referenceBasedInstructions = `
  Follow the standard response format (see knowledge base: response-guidelines).
  Apply tone guidelines from: tone-professional.
`;

// Use structured data instead of prose
const structuredInstructions = `
  ## Authorization Levels
  | Tier | Max Refund | Features |
  | free | $50 | basic |
  | pro | $200 | basic+priority |
  | enterprise | unlimited | all |
`;
```

### Measuring Token Efficiency

```typescript
// Simple token estimation (rough)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);  // ~4 chars per token
}

// Check prompt size
const instructions = agent.instructions;
const tokenEstimate = estimateTokens(
  typeof instructions === "function"
    ? instructions({ requestContext: undefined })
    : instructions
);

console.log(`Estimated prompt tokens: ${tokenEstimate}`);
// Target: <2000 tokens for most agents
// Warning: >5000 tokens indicates bloat
```

### How to Fix

1. Remove redundant phrases ("be helpful", "try to help", etc.)
2. Use retrieval tools instead of pre-loading documentation
3. Reduce examples to 2-3 diverse, canonical cases
4. Implement context compaction for long conversations
5. Store references (file paths, IDs) instead of full content
6. Use structured formats (tables, lists) over prose
7. Audit token count and set targets

### Reference

- [Anthropic: Effective Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [OpenAI: GPT Best Practices](https://platform.openai.com/docs/guides/gpt-best-practices)
