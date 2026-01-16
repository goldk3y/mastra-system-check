---
title: Agent Instructions Must Be Defined
impact: HIGH
impactDescription: Agent has no guidance, unpredictable behavior
tags: agent, instructions, prompt, configuration
category: agent
---

## Agent Instructions Must Be Defined

**Impact: HIGH (Agent has no guidance, unpredictable behavior)**

Every agent should have meaningful instructions that define its role, capabilities,
and behavior guidelines. Agents without instructions or with vague instructions
will produce inconsistent and unpredictable results.

### What to Check

- Agent has `instructions` property defined
- Instructions are not empty strings
- Instructions provide meaningful guidance (not just "be helpful")
- Instructions describe the agent's role and capabilities
- Instructions use function syntax when context-dependent

### Incorrect Configuration

```typescript
// Missing instructions entirely
const agent = new Agent({
  id: "my-agent",
  model: "openai/gpt-4o",
  // No instructions!
});

// Empty instructions
const agent = new Agent({
  id: "my-agent",
  model: "openai/gpt-4o",
  instructions: "",
});

// Vague, unhelpful instructions
const agent = new Agent({
  id: "my-agent",
  model: "openai/gpt-4o",
  instructions: "Be helpful.",  // Too vague!
});

// Instructions that don't match tools
const agent = new Agent({
  id: "weather-agent",
  model: "openai/gpt-4o",
  instructions: "You help with customer support.",  // Mismatch!
  tools: { weatherTool },
});
```

### Correct Configuration

```typescript
import { Agent } from "@mastra/core/agent";

// Well-structured static instructions
const weatherAgent = new Agent({
  id: "weather-agent",
  model: "openai/gpt-4o",
  instructions: `
    You are a weather assistant that helps users get weather information.

    ## Capabilities
    - Get current weather for any location
    - Provide temperature in Celsius or Fahrenheit based on user preference
    - Give brief weather summaries with conditions

    ## Guidelines
    - Always confirm the location before fetching weather
    - Include both temperature and conditions in responses
    - Suggest appropriate clothing or activities based on weather
    - If location is ambiguous, ask for clarification

    ## Tone
    Friendly and conversational. Keep responses concise but informative.
  `,
  tools: { weatherTool },
});

// Dynamic instructions based on context
const supportAgent = new Agent({
  id: "support-agent",
  model: "openai/gpt-4o",
  instructions: ({ requestContext }) => {
    const userTier = requestContext?.get("user-tier") || "free";
    const userName = requestContext?.get("user-name") || "there";

    return `
      You are a customer support agent for our SaaS platform.

      ## Current User
      - Name: ${userName}
      - Tier: ${userTier}

      ## Capabilities
      ${userTier === "enterprise"
        ? "- Full access to all support features\n- Can escalate to engineering team"
        : "- Basic support features\n- Escalate complex issues to documentation"}

      ## Guidelines
      - Be professional and empathetic
      - Verify user identity before discussing account details
      - Document all interactions
    `;
  },
  tools: { lookupAccount, createTicket },
});
```

### Instruction Quality Checklist

| Element | Required | Description |
|---------|----------|-------------|
| Role Definition | Yes | Who is the agent? What is its purpose? |
| Capabilities | Yes | What can the agent do? What tools does it have? |
| Guidelines | Yes | How should the agent behave? |
| Tone/Style | Recommended | How should the agent communicate? |
| Constraints | Recommended | What should the agent NOT do? |
| Examples | Optional | Sample interactions for clarity |

### How to Fix

1. Add `instructions` property to agent configuration
2. Define the agent's role clearly in the first line
3. List capabilities that match registered tools
4. Add behavior guidelines and constraints
5. Specify tone and communication style
6. Use function syntax if instructions depend on request context

### Reference

- [Agent Instructions](https://mastra.ai/docs/v1/agents/instructions)
- [Prompt Engineering Best Practices](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
