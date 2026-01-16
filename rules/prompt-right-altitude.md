---
title: Prompt Right Altitude - Avoid Over/Under Specification
impact: HIGH
impactDescription: Brittle behavior or vague, unpredictable responses
tags: prompt, instructions, specificity, flexibility
category: prompt
---

## Prompt Right Altitude - Avoid Over/Under Specification

**Impact: HIGH (Brittle behavior or vague, unpredictable responses)**

Prompts should find the "right altitude" - specific enough to guide behavior
but flexible enough to handle varied inputs. Over-specified prompts break on
edge cases; under-specified prompts produce inconsistent results.

### What to Check

- Instructions guide behavior without hardcoding every scenario
- No exhaustive if/then/else logic encoded in prompts
- Clear signals about expected behavior patterns
- Flexibility for model to reason about novel situations
- Balance between guidance and autonomy

### Incorrect Configuration (Over-Specified)

```typescript
// Brittle: Hardcoded logic that breaks on edge cases
const overSpecifiedAgent = new Agent({
  id: "over-specified",
  model: "openai/gpt-4o",
  instructions: `
    If the user asks about weather, call the weather tool.
    If the user asks about stocks, call the stock tool.
    If the user asks about news, call the news tool.
    If the user asks about sports scores, call the sports tool.
    If the user says "hello", respond with "Hello! How can I help you today?"
    If the user says "hi", respond with "Hi there! What can I do for you?"
    If the user says "hey", respond with "Hey! How can I assist?"
    If the user asks anything else, say "I can only help with weather, stocks, news, or sports."
  `,
  // Problems:
  // - "What's the weather like for the game tonight?" needs both tools!
  // - "What's happening in tech?" - is this news or stocks?
  // - New greeting variations not handled
});
```

### Incorrect Configuration (Under-Specified)

```typescript
// Vague: No guidance on how to behave
const underSpecifiedAgent = new Agent({
  id: "under-specified",
  model: "openai/gpt-4o",
  instructions: "You are a helpful assistant.",
  // Problems:
  // - No context about capabilities
  // - No guidance on tone or format
  // - No constraints on behavior
  // - Inconsistent across interactions
});
```

### Correct Configuration

```typescript
// Right altitude: Clear guidance with flexibility
const balancedAgent = new Agent({
  id: "balanced-agent",
  model: "openai/gpt-4o",
  instructions: `
    You are a personal assistant helping users stay informed about weather,
    financial markets, news, and sports.

    ## Capabilities
    You have access to tools for weather, stocks, news, and sports data.
    Choose the appropriate tool(s) based on what the user needs.
    Multiple tools can be used when queries span domains.

    ## Behavior Guidelines
    - Proactively combine information when queries span multiple domains
    - Ask clarifying questions when the request is ambiguous
    - Provide concise summaries with key details highlighted
    - If you cannot help with something, explain what you can do instead

    ## Tone
    Professional but conversational. Prioritize accuracy over speed.
  `,
  tools: { weatherTool, stockTool, newsTool, sportsTool },
});
```

### Altitude Comparison

| Aspect | Under-Specified | Right Altitude | Over-Specified |
|--------|----------------|----------------|----------------|
| Instructions | "Be helpful" | Guidelines + flexibility | Exhaustive rules |
| Novel inputs | Inconsistent | Reasoned response | Fails/confused |
| Edge cases | Unpredictable | Handled gracefully | Not covered |
| Maintenance | None needed | Occasional tuning | Constant updates |
| Model reasoning | Unguided | Guided but free | Constrained |

### Finding Right Altitude for Different Scenarios

```typescript
// Customer Support - Medium altitude
const supportAgent = new Agent({
  instructions: `
    You are a customer support agent for TechCo.

    ## Core Responsibilities
    - Answer product questions using the knowledge base
    - Help troubleshoot common issues
    - Escalate complex issues to human agents

    ## Policies (non-negotiable)
    - Refunds under $50: Approve immediately
    - Refunds $50-200: Require order verification
    - Refunds over $200: Escalate to supervisor

    ## Approach
    - Acknowledge the customer's concern first
    - Gather necessary information before acting
    - Verify identity for account-related requests
    - Offer alternatives when direct resolution isn't possible
  `,
});

// Creative Writing - Lower altitude (more freedom)
const creativeAgent = new Agent({
  instructions: `
    You are a creative writing assistant.

    ## Approach
    - Match the user's requested style and tone
    - Offer suggestions rather than prescriptions
    - Build on the user's ideas, don't replace them
    - Ask about preferences when starting new pieces

    ## Guidelines
    - Avoid clichés unless specifically requested
    - Vary sentence structure for rhythm
    - Show don't tell when possible
  `,
});

// Data Analysis - Higher altitude (more structure)
const analysisAgent = new Agent({
  instructions: `
    You are a data analysis assistant.

    ## Analysis Framework
    1. Clarify the question being answered
    2. Identify relevant data sources
    3. Apply appropriate statistical methods
    4. Present findings with confidence intervals
    5. Note limitations and assumptions

    ## Output Format
    - Lead with key findings
    - Support with specific numbers
    - Visualize when helpful
    - Include methodology notes

    ## Constraints
    - Never extrapolate beyond data bounds
    - Always cite data sources
    - Flag when sample size is insufficient
  `,
});
```

### Signs You Need to Adjust Altitude

| Problem | Symptom | Adjustment |
|---------|---------|------------|
| Too high | Unexpected edge case failures | Lower altitude, add principles |
| Too low | Inconsistent responses | Raise altitude, add guidelines |
| Too high | Robotic, inflexible responses | Lower altitude, add flexibility |
| Too low | Off-topic tangents | Raise altitude, add constraints |

### How to Fix

1. Identify if agent is over or under-specified
2. Remove hardcoded conditional logic from prompts
3. Add clear capability descriptions without exhaustive lists
4. Define behavior principles rather than exact steps
5. Include tone and style guidance
6. Let the model reason about novel situations
7. Test with edge cases and adjust

### Reference

- [Anthropic: Effective Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
