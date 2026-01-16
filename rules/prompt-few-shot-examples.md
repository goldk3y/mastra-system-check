---
title: Effective Few-Shot Examples
impact: HIGH
impactDescription: Model doesn't understand expected format or behavior
tags: prompt, examples, few-shot, demonstrations
category: prompt
---

## Effective Few-Shot Examples

**Impact: HIGH (Model doesn't understand expected format or behavior)**

Few-shot examples are powerful but must be used strategically. Good examples
demonstrate diverse scenarios, edge cases, and expected formats. Poor examples
waste tokens, create confusion, or teach wrong patterns.

### What to Check

- Examples demonstrate diverse scenarios (not repetitive)
- Edge cases are covered
- Format matches expected output
- Examples show reasoning, not just answers
- Number of examples is appropriate (2-5 typically)

### Incorrect Configuration

```typescript
// Too many similar examples - wasteful
const repetitiveExamples = new Agent({
  instructions: `
    Example 1: Q: "What is 2+2?" A: "4"
    Example 2: Q: "What is 3+3?" A: "6"
    Example 3: Q: "What is 4+4?" A: "8"
    Example 4: Q: "What is 5+5?" A: "10"
    Example 5: Q: "What is 6+6?" A: "12"
    // All examples are the same pattern!
  `,
});

// Examples without reasoning - teaches surface patterns
const noReasoningExamples = new Agent({
  instructions: `
    User: "Should I refund this order?"
    Assistant: "Yes, process the refund."

    User: "Customer wants money back"
    Assistant: "No, deny the refund."
    // Why? No reasoning shown!
  `,
});

// Examples don't match actual use case
const mismatchedExamples = new Agent({
  instructions: `
    You are a code review assistant.

    Example:
    User: "What's the weather like?"
    Assistant: "It's sunny and 72°F."
    // This example is for a weather assistant!
  `,
});
```

### Correct Configuration

```typescript
// Diverse examples with reasoning
const effectiveExamples = new Agent({
  id: "refund-agent",
  model: "openai/gpt-4o",
  instructions: `
    You are a refund processing agent. Evaluate requests based on our policies.

    ## Examples

    ### Example 1: Standard Approval
    User: "I want to return the headphones I bought yesterday. They don't fit."

    Thought process:
    - Purchase within return window (14 days) ✓
    - Item is returnable (electronics) ✓
    - Reason is valid (fit issue) ✓

    Response: "I'd be happy to process your return. Since you purchased yesterday
    and headphone fit is a valid return reason, I'll generate a prepaid return
    label. You'll receive your refund within 3-5 business days after we receive
    the item."

    ### Example 2: Policy Exception
    User: "My laptop screen cracked after 45 days. I know it's past the return
    window but I've been a customer for 10 years."

    Thought process:
    - Past return window (14 days) ✗
    - Physical damage not covered by warranty ✗
    - However: Long-term customer (10 years), high value
    - Escalation candidate

    Response: "I understand how frustrating a cracked screen is. While this falls
    outside our standard return policy, I'd like to explore options given your
    loyalty. Let me connect you with a supervisor who has authority to review
    special circumstances."

    ### Example 3: Denial with Alternative
    User: "I want to return this swimsuit but I already wore it to the beach."

    Thought process:
    - Worn items cannot be returned (hygiene policy) ✗
    - No exceptions for worn swimwear
    - Offer alternative

    Response: "I'm sorry, but we can't accept returns on worn swimwear due to
    hygiene policies. I completely understand this is disappointing. As an
    alternative, I can offer you a 20% discount code for your next swimwear
    purchase. Would that help?"
  `,
});
```

### Example Design Principles

```typescript
const wellDesignedExamples = new Agent({
  instructions: `
    ## Example Interactions

    ### Canonical Case (most common)
    [Shows the typical happy path]

    ### Edge Case (uncommon but important)
    [Shows handling of tricky situation]

    ### Error Case (when things go wrong)
    [Shows graceful error handling]

    Each example includes:
    1. User input (realistic, not sanitized)
    2. Agent's reasoning (thought process)
    3. Agent's response (final output)
  `,
});
```

### Format-Demonstrating Examples

```typescript
// When output format matters, examples should demonstrate it
const formatExamples = new Agent({
  instructions: `
    You generate structured analysis reports.

    ## Example

    User: "Analyze the performance of ACME stock last quarter"

    Response:
    \`\`\`json
    {
      "ticker": "ACME",
      "period": "Q3 2024",
      "summary": "Strong performance driven by new product launches",
      "metrics": {
        "price_change": "+15.3%",
        "volume_avg": "2.4M shares/day",
        "pe_ratio": 24.5
      },
      "sentiment": "bullish",
      "key_events": [
        "Product X launch (July)",
        "Earnings beat expectations (August)",
        "New partnership announced (September)"
      ],
      "recommendation": "Hold - already priced in"
    }
    \`\`\`

    Note: The response demonstrates:
    - Exact JSON structure expected
    - Field naming conventions
    - Data types for each field
    - Level of detail expected
  `,
});
```

### Dynamic Examples Based on Context

```typescript
const dynamicExamples = new Agent({
  instructions: ({ requestContext }) => {
    const tier = requestContext?.get("user-tier") || "free";

    const baseInstructions = `You are a data analysis assistant.`;

    // Different examples for different user tiers
    const examples = tier === "enterprise"
      ? `
        ## Example (Enterprise)
        User: "Generate a cohort analysis"
        Assistant: [Uses advanced SQL, multiple data sources, custom visualizations]
      `
      : `
        ## Example (Standard)
        User: "Show me user signups"
        Assistant: [Uses simple queries, standard charts]
      `;

    return baseInstructions + examples;
  },
});
```

### Example Quantity Guidelines

| Complexity | Examples Needed | Why |
|------------|----------------|-----|
| Simple format | 1-2 | Just show the structure |
| Moderate reasoning | 2-3 | Show common variations |
| Complex decisions | 3-5 | Cover edge cases |
| Highly variable | 3-4 diverse | Demonstrate flexibility |

### How to Fix

1. Audit existing examples for diversity
2. Remove repetitive examples that teach same pattern
3. Add examples that demonstrate reasoning process
4. Include at least one edge case example
5. Ensure examples match actual use cases
6. Format examples to match expected output structure
7. Keep total examples to 2-5 (quality over quantity)

### Reference

- [Anthropic: Effective Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Few-Shot Learning Best Practices](https://platform.openai.com/docs/guides/prompt-engineering)
