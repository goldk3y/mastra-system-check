---
title: Avoid Laundry Lists of Edge Cases
impact: HIGH
impactDescription: Prompt bloat, incomplete coverage, brittle behavior
tags: prompt, edge-cases, patterns, principles
category: prompt
---

## Avoid Laundry Lists of Edge Cases

**Impact: HIGH (Prompt bloat, incomplete coverage, brittle behavior)**

Exhaustively listing every possible edge case is ineffective. Lists are
never complete, consume excessive tokens, and teach pattern matching
instead of reasoning. Instead, teach principles that the model can apply
to novel situations.

### What to Check

- Prompts don't enumerate every possible scenario
- Edge case handling is principle-based
- Similar cases are grouped under general rules
- Novel situations can be handled by extrapolation

### Incorrect Configuration

```typescript
// Exhaustive edge case list - incomplete and bloated
const laundryListAgent = new Agent({
  id: "edge-case-list",
  model: "openai/gpt-4o",
  instructions: `
    Handle these customer situations:

    - If customer says "I want a refund", ask for order number
    - If customer says "refund please", ask for order number
    - If customer says "money back", ask for order number
    - If customer says "return", ask if they want refund or exchange
    - If customer says "send it back", ask if they want refund or exchange
    - If customer types in all caps, they're probably upset
    - If customer uses exclamation marks, they might be upset
    - If customer says "This is unacceptable", apologize first
    - If customer says "I've been waiting", apologize for the wait
    - If customer says "This is ridiculous", apologize sincerely
    - If customer mentions "lawyer", escalate immediately
    - If customer mentions "BBB", escalate immediately
    - If customer mentions "social media", escalate immediately
    - If order is 1 day old, full refund
    - If order is 2 days old, full refund
    - If order is 3 days old, full refund
    ...
    - If order is 14 days old, full refund
    - If order is 15 days old, partial refund maybe
    // 200 more rules...
  `,
});
```

### Correct Configuration

```typescript
// Principle-based handling
const principleBasedAgent = new Agent({
  id: "principle-based",
  model: "openai/gpt-4o",
  instructions: `
    You are a customer support agent. Handle requests using these principles:

    ## Intent Recognition
    Understand the customer's underlying need, not just their exact words.
    Common intents: refund request, exchange, complaint, question, feedback.

    ## Emotional Intelligence
    Recognize emotional signals (caps, punctuation, word choice) and respond
    with appropriate empathy. Upset customers need acknowledgment before
    problem-solving.

    ## Escalation Triggers
    Escalate when:
    - Legal action is mentioned or implied
    - Customer explicitly requests supervisor
    - Situation involves potential PR risk
    - Issue is outside your authorization

    ## Refund Policy
    - Within 14 days: Full refund, no questions
    - 15-30 days: Full refund with reason
    - 31-60 days: Case-by-case, supervisor approval needed
    - 60+ days: Typically denied, offer alternatives

    ## General Approach
    1. Acknowledge the customer's situation
    2. Clarify what they need (don't assume)
    3. Take action within your authority
    4. Set clear expectations for next steps
  `,
});
```

### Pattern vs Principle Comparison

| Situation | Pattern Matching (Bad) | Principle (Good) |
|-----------|----------------------|------------------|
| Angry customer | "If caps/exclamations..." | "Recognize emotional signals" |
| Refund timing | List every day 1-60 | "Policy tiers: 14/30/60 days" |
| Complaints | List exact phrases | "Identify complaint intent" |
| Escalation | List trigger words | "Escalate when X criteria met" |

### Teaching Reasoning Over Rules

```typescript
const reasoningAgent = new Agent({
  instructions: `
    ## Decision Framework

    When evaluating any request, consider:

    1. **Customer Impact**: How does this affect the customer?
       - Financial impact (small/medium/large)
       - Emotional impact (frustrated/inconvenienced/angry)
       - Time investment (quick fix/extended issue)

    2. **Business Impact**: What are the implications?
       - Cost of resolution
       - Precedent being set
       - Relationship value

    3. **Policy Alignment**: Does this fit our guidelines?
       - Clear policy match → Apply policy
       - Ambiguous → Favor customer within reason
       - Policy conflict → Escalate

    4. **Resolution Options**: What can I offer?
       - Within authority → Act directly
       - Borderline → Offer and note exception
       - Outside authority → Escalate with recommendation

    Apply this framework to novel situations rather than looking for
    exact matches to previous cases.
  `,
});
```

### Grouping Related Edge Cases

```typescript
// Instead of listing every payment issue...
const badPayment = `
  - If card declined, ask for new card
  - If card expired, ask for new card
  - If CVV wrong, ask to re-enter
  - If insufficient funds, ask for different card
  - If card stolen, ask for different card
  // ... 20 more
`;

// Group under categories
const goodPayment = `
  ## Payment Issues

  **Card Validation Failures** (declined, expired, wrong CVV):
  Ask customer to verify card details or try a different payment method.

  **Processing Failures** (timeout, gateway error):
  Apologize for technical difficulty, offer to retry or use alternative.

  **Fraud Flags** (stolen card, unusual activity):
  Do not process. Escalate to fraud team. Do not accuse customer.
`;
```

### Handling Truly Novel Situations

```typescript
const adaptiveAgent = new Agent({
  instructions: `
    ## When You Encounter Something New

    If a situation doesn't clearly match any guideline:

    1. **Identify the core issue**: What does the customer actually need?

    2. **Find the closest principle**: Which of our guidelines is most relevant?

    3. **Reason by analogy**: How would we handle a similar situation?

    4. **Err toward customer benefit**: When genuinely ambiguous, favor the customer
       within reasonable limits.

    5. **Document for learning**: Note novel situations for policy review.

    You don't need an exact rule for every situation. Use judgment based on
    our principles and values.
  `,
});
```

### Refactoring Laundry Lists

| Original List | Refactored Principle |
|---------------|---------------------|
| 50 greeting variations | "Respond warmly to greetings" |
| 30 refund phrasings | "Recognize refund intent" |
| 20 escalation triggers | "Escalate when [criteria]" |
| 100 error responses | "Acknowledge, explain, resolve" |

### How to Fix

1. Identify laundry lists in current prompts
2. Group similar items into categories
3. Extract underlying principle for each category
4. Write principle-based guidelines
5. Include framework for novel situations
6. Test with edge cases not explicitly covered
7. Reduce token count while maintaining effectiveness

### Reference

- [Anthropic: Effective Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
