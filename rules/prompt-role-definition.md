---
title: Clear Role Definition Required
impact: HIGH
impactDescription: Confused identity, inconsistent behavior, scope creep
tags: prompt, role, identity, persona
category: prompt
---

## Clear Role Definition Required

**Impact: HIGH (Confused identity, inconsistent behavior, scope creep)**

Every agent should have a clearly defined role that establishes its identity,
purpose, and boundaries. Without a clear role, agents may behave inconsistently,
take on inappropriate tasks, or fail to understand their scope.

### What to Check

- Agent has explicit role/identity statement
- Purpose is clearly articulated
- Boundaries are defined (what it does NOT do)
- Role matches registered tools
- Identity is consistent throughout instructions

### Incorrect Configuration

```typescript
// No role definition
const noRoleAgent = new Agent({
  id: "no-role",
  model: "openai/gpt-4o",
  instructions: `
    Help users with their requests.
    Be polite and helpful.
  `,
  // Who is this agent? What's its specialty?
});

// Vague role
const vagueRoleAgent = new Agent({
  id: "vague-role",
  model: "openai/gpt-4o",
  instructions: `
    You are an assistant that helps with stuff.
  `,
});

// Conflicting identity
const conflictingAgent = new Agent({
  id: "conflicting",
  model: "openai/gpt-4o",
  instructions: `
    You are a professional legal advisor.
    ...
    Remember, you're a casual friend helping out.
    ...
    As a medical expert...
  `,
  // Which one is it?
});
```

### Correct Configuration

```typescript
// Clear, specific role definition
const clearRoleAgent = new Agent({
  id: "finance-advisor",
  model: "openai/gpt-4o",
  instructions: `
    # Role: Personal Finance Assistant

    You are a personal finance assistant for BudgetApp, helping users
    understand and manage their finances.

    ## Your Identity
    - Name: FinBot
    - Expertise: Budgeting, savings, spending analysis
    - Tone: Friendly but professional, encouraging without being preachy

    ## What You Do
    - Analyze spending patterns and provide insights
    - Help create and adjust budgets
    - Suggest savings strategies
    - Explain financial concepts in simple terms
    - Track progress toward financial goals

    ## What You Don't Do
    - Provide investment advice (suggest consulting a financial advisor)
    - Make predictions about markets or specific stocks
    - Access or share data from other users
    - Make transactions or move money
    - Provide tax or legal advice

    ## Your Tools
    - get_spending_summary: View user's spending by category
    - get_budget: View current budget allocations
    - update_budget: Modify budget categories
    - set_goal: Create or update savings goals
  `,
  tools: { getSpendingSummary, getBudget, updateBudget, setGoal },
});
```

### Role Definition Components

```typescript
const wellDefinedRole = new Agent({
  instructions: `
    # Role Definition

    ## Identity Statement
    You are [Name], a [type] assistant specializing in [domain].

    ## Core Purpose
    Your primary purpose is to help users [main goal].

    ## Expertise Areas
    - [Area 1]: [What you know/can do]
    - [Area 2]: [What you know/can do]
    - [Area 3]: [What you know/can do]

    ## Personality & Tone
    - [Trait 1]: [How it manifests]
    - [Trait 2]: [How it manifests]
    - Communication style: [Description]

    ## Boundaries
    You do NOT:
    - [Limitation 1]
    - [Limitation 2]
    - [Limitation 3]

    When asked about topics outside your expertise:
    [How to handle gracefully]

    ## Authority Level
    You can:
    - [Action within authority]
    - [Action within authority]

    You cannot (must escalate):
    - [Action requiring escalation]
    - [Action requiring escalation]
  `,
});
```

### Context-Aware Role Definition

```typescript
// Role that adapts to context while maintaining identity
const contextAwareRole = new Agent({
  id: "adaptive-support",
  model: "openai/gpt-4o",
  instructions: ({ requestContext }) => {
    const tier = requestContext?.get("user-tier") || "free";
    const department = requestContext?.get("user-department");

    const baseRole = `
      # Role: Technical Support Specialist

      You are Alex, a technical support specialist for DevTools Inc.
      Your expertise is helping developers troubleshoot our SDK.
    `;

    // Adjust capabilities based on user context
    const capabilities = tier === "enterprise"
      ? `
        ## Your Authority (Enterprise Support)
        - Provide direct access to engineering team
        - Offer custom solutions and workarounds
        - Access detailed system logs
        - Arrange dedicated support calls
      `
      : `
        ## Your Authority (Standard Support)
        - Guide through documentation and tutorials
        - Troubleshoot common issues
        - Escalate complex issues to tier 2
      `;

    const boundaries = `
      ## Boundaries
      - Do not make changes to customer's codebase
      - Do not share other customers' solutions without permission
      - Do not promise specific fix timelines
    `;

    return baseRole + capabilities + boundaries;
  },
});
```

### Role vs Tool Alignment

```typescript
// Good: Role matches tools
const alignedAgent = new Agent({
  id: "weather-assistant",
  instructions: `
    You are WeatherBot, a weather information assistant.
    You help users get weather data for trip planning.
  `,
  tools: {
    getCurrentWeather,
    getForecast,
    getHistoricalWeather,
  },
});

// Bad: Role doesn't match tools
const misalignedAgent = new Agent({
  id: "misaligned",
  instructions: `
    You are a comprehensive life coach helping with all aspects
    of personal development, relationships, and career growth.
  `,
  tools: {
    getCurrentWeather,  // What? Life coach with weather tools?
  },
});
```

### Role Definition Checklist

| Element | Question | Example |
|---------|----------|---------|
| Identity | Who is this agent? | "You are Maya, a product expert" |
| Purpose | Why does it exist? | "To help users choose the right plan" |
| Expertise | What does it know? | "Pricing, features, integrations" |
| Tone | How does it communicate? | "Consultative, not pushy" |
| Boundaries | What won't it do? | "Won't discuss competitors" |
| Authority | What can it decide? | "Can offer 10% discount" |
| Escalation | When to hand off? | "Complex billing issues" |

### How to Fix

1. Add explicit role statement at the beginning of instructions
2. Define expertise areas that match registered tools
3. Specify what the agent does NOT do
4. Set clear authority levels and escalation criteria
5. Ensure consistent identity throughout the prompt
6. Align personality with brand voice guidelines
7. Test that agent stays within defined boundaries

### Reference

- [Agent Configuration](https://mastra.ai/docs/v1/agents/overview)
- [Anthropic: Effective Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
