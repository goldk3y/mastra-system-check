---
title: Agent Context Access Pattern
impact: HIGH
impactDescription: Agents cannot access request data, static behavior
tags: context, agent, access, dynamic
category: context
---

## Agent Context Access Pattern

**Impact: HIGH (Agents cannot access request data, static behavior)**

Agents access RequestContext through function-style configuration for
instructions, model selection, and tools. Static configuration cannot
access per-request context, resulting in the same behavior for all users
regardless of their context.

### What to Check

- Agent uses function syntax for context-dependent config
- `instructions` uses function if it needs context
- `model` uses function if selection is context-dependent
- `tools` uses function if tool access varies by context
- Context is accessed via the function parameter

### Incorrect Configuration

```typescript
// Static configuration - no context access
const staticAgent = new Agent({
  id: "static-agent",
  model: "openai/gpt-4o",  // Same model for everyone
  instructions: "You are a helpful assistant.",  // Same for everyone
  tools: { searchTool, adminTool },  // Same tools for everyone (security risk!)
});

// Trying to access context outside function
const userId = requestContext.get("user-id");  // Error! Not in scope
const brokenAgent = new Agent({
  id: "broken-agent",
  model: "openai/gpt-4o",
  instructions: `You are helping user ${userId}`,  // userId is undefined!
});
```

**Common Error Messages:**

```
ReferenceError: requestContext is not defined
Cannot read properties of undefined (reading 'get')
```

### Correct Configuration

```typescript
import { Agent } from "@mastra/core/agent";
import type { AppContext } from "../types/context";

// Dynamic instructions based on context
const contextAwareAgent = new Agent({
  id: "context-agent",
  model: "openai/gpt-4o",
  instructions: ({ requestContext }) => {
    const userName = requestContext?.get("user-name") || "there";
    const userTier = requestContext?.get("user-tier") || "free";

    return `
      You are a helpful assistant for ${userName}.

      ## User Context
      - Tier: ${userTier}
      - Access Level: ${userTier === "enterprise" ? "Full" : "Standard"}

      ## Guidelines
      ${userTier === "enterprise"
        ? "Provide detailed, comprehensive responses."
        : "Provide concise responses. Suggest upgrade for advanced features."}
    `;
  },
});

// Dynamic model based on context
const dynamicModelAgent = new Agent({
  id: "dynamic-model-agent",
  model: ({ requestContext }) => {
    const tier = requestContext?.get("user-tier");

    // Premium users get better model
    if (tier === "enterprise") {
      return "anthropic/claude-sonnet-4-20250514";
    }
    if (tier === "pro") {
      return "openai/gpt-4o";
    }
    return "openai/gpt-4o-mini";
  },
  instructions: "You are a helpful assistant.",
});

// Dynamic tools based on context
const dynamicToolsAgent = new Agent({
  id: "dynamic-tools-agent",
  model: "openai/gpt-4o",
  instructions: ({ requestContext }) => {
    const isAdmin = requestContext?.get("is-admin");
    return isAdmin
      ? "You have admin access. Use admin tools responsibly."
      : "You have standard user access.";
  },
  tools: ({ requestContext }) => {
    const isAdmin = requestContext?.get("is-admin");

    // Base tools for everyone
    const tools = {
      searchTool,
      viewTool,
    };

    // Admin-only tools
    if (isAdmin) {
      return {
        ...tools,
        deleteTool,
        configTool,
      };
    }

    return tools;
  },
});
```

### Complete Dynamic Agent

```typescript
const fullyDynamicAgent = new Agent({
  id: "fully-dynamic-agent",

  // Dynamic model selection
  model: ({ requestContext }) => {
    const tier = requestContext?.get("user-tier") || "free";
    const models = {
      enterprise: "anthropic/claude-sonnet-4-20250514",
      pro: "openai/gpt-4o",
      free: "openai/gpt-4o-mini",
    };
    return models[tier];
  },

  // Dynamic instructions
  instructions: ({ requestContext }) => {
    const tier = requestContext?.get("user-tier") || "free";
    const locale = requestContext?.get("locale") || "en-US";
    const name = requestContext?.get("user-name") || "User";

    return `
      You are assisting ${name} (${tier} tier).
      Respond in the user's preferred language based on locale: ${locale}.
      ${tier === "free" ? "Mention upgrade options when relevant." : ""}
    `;
  },

  // Dynamic tool access
  tools: ({ requestContext }) => {
    const tier = requestContext?.get("user-tier") || "free";

    const baseTools = { searchTool };

    if (tier === "pro" || tier === "enterprise") {
      return { ...baseTools, advancedSearchTool, exportTool };
    }

    return baseTools;
  },
});
```

### Function Parameter Shape

```typescript
// The function receives this object
type ConfigFunctionParam = {
  requestContext: RequestContext<AppContext> | undefined;
};

// Access pattern
instructions: ({ requestContext }) => {
  // requestContext may be undefined if not set
  const value = requestContext?.get("key");
  // Always provide fallbacks
  return `Instructions for ${value || "default"}`;
};
```

### When to Use Static vs Dynamic

| Config | Use Static | Use Dynamic |
|--------|-----------|-------------|
| instructions | Same for all users | User-specific, role-based |
| model | Fixed model | Tier-based, cost optimization |
| tools | Same capabilities | Permission-based access |

### How to Fix

1. Identify which agent configurations need context
2. Convert static strings/objects to functions
3. Destructure `requestContext` from function parameter
4. Use optional chaining (`?.`) for safe access
5. Provide fallback values for missing context
6. Test with different context values

### Reference

- [Agent Configuration](https://mastra.ai/docs/v1/agents/overview)
- [Request Context](https://mastra.ai/docs/v1/server/request-context)
