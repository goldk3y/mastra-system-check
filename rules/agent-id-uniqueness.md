---
title: Agent ID Uniqueness
impact: HIGH
impactDescription: Agent conflicts, wrong agent invoked, debugging confusion
tags: agent, id, uniqueness, configuration
category: agent
---

## Agent ID Uniqueness

**Impact: HIGH (Agent conflicts, wrong agent invoked, debugging confusion)**

Every agent must have a unique ID within the Mastra application. Duplicate IDs
cause conflicts when registering agents, may result in the wrong agent being
invoked, and make debugging extremely difficult.

### What to Check

- Every agent has an `id` property
- Agent IDs are unique across the entire project
- IDs follow a consistent naming convention
- IDs are descriptive and meaningful
- No typos creating unintended duplicates

### Incorrect Configuration

```typescript
// Missing ID
const agent = new Agent({
  model: "openai/gpt-4o",
  instructions: "You are a helpful assistant.",
  // No id property!
});

// Duplicate IDs across files
// src/mastra/agents/weather-agent.ts
export const weatherAgent = new Agent({
  id: "assistant",  // Generic ID
  model: "openai/gpt-4o",
});

// src/mastra/agents/support-agent.ts
export const supportAgent = new Agent({
  id: "assistant",  // Same ID! Conflict!
  model: "openai/gpt-4o",
});

// Confusing similar IDs
const agent1 = new Agent({ id: "agent", ... });
const agent2 = new Agent({ id: "agent-1", ... });
const agent3 = new Agent({ id: "agent1", ... });  // Easy to confuse
```

**Common Error Messages:**

```
Error: Duplicate agent ID 'assistant' found
Warning: Agent ID collision detected
Agent 'assistant' already registered
```

### Correct Configuration

```typescript
// Clear, descriptive, unique IDs
// src/mastra/agents/weather-agent.ts
import { Agent } from "@mastra/core/agent";

export const weatherAgent = new Agent({
  id: "weather-agent",  // Unique and descriptive
  model: "openai/gpt-4o",
  instructions: "You are a weather assistant.",
});

// src/mastra/agents/support-agent.ts
export const supportAgent = new Agent({
  id: "customer-support-agent",  // Unique and descriptive
  model: "openai/gpt-4o",
  instructions: "You are a customer support agent.",
});

// src/mastra/agents/research-agent.ts
export const researchAgent = new Agent({
  id: "research-agent",  // Unique and descriptive
  model: "anthropic/claude-sonnet-4-20250514",
  instructions: "You are a research assistant.",
});
```

### Registration in Mastra Instance

```typescript
// src/mastra/index.ts
import { Mastra } from "@mastra/core";
import { weatherAgent } from "./agents/weather-agent";
import { supportAgent } from "./agents/support-agent";
import { researchAgent } from "./agents/research-agent";

export const mastra = new Mastra({
  agents: {
    weatherAgent,      // ID: weather-agent
    supportAgent,      // ID: customer-support-agent
    researchAgent,     // ID: research-agent
  },
});

// Access agents by ID
const weather = mastra.getAgent("weather-agent");
const support = mastra.getAgent("customer-support-agent");
```

### ID Naming Conventions

| Pattern | Example | Use Case |
|---------|---------|----------|
| `{function}-agent` | `weather-agent` | Single-purpose agents |
| `{domain}-{function}-agent` | `sales-support-agent` | Domain-specific agents |
| `{version}-{function}-agent` | `v2-research-agent` | Versioned agents |

### Best Practices

1. **Use kebab-case**: `weather-agent` not `weatherAgent` or `weather_agent`
2. **Be descriptive**: `customer-onboarding-agent` not `agent-1`
3. **Include domain**: `billing-support-agent` not just `support-agent`
4. **Avoid generic names**: Never use `agent`, `assistant`, `helper`
5. **Version if needed**: `v2-research-agent` for breaking changes

### Verification Script

```typescript
// Check for duplicate IDs at startup
import { mastra } from "./mastra";

const agentIds = Object.values(mastra.agents).map(a => a.id);
const duplicates = agentIds.filter((id, index) => agentIds.indexOf(id) !== index);

if (duplicates.length > 0) {
  console.error("Duplicate agent IDs found:", duplicates);
  process.exit(1);
}
```

### How to Fix

1. Add `id` property to all agents
2. Audit all agent files for duplicate IDs
3. Rename duplicates to unique, descriptive names
4. Update any code that references the old IDs
5. Consider adding a startup check for duplicates

### Reference

- [Agent Configuration](https://mastra.ai/reference/v1/agents/agent-class)
- [Project Structure](https://mastra.ai/docs/v1/getting-started/project-structure)
