---
title: Tool Context Access Pattern
impact: HIGH
impactDescription: Tools cannot access user data, generic behavior
tags: context, tool, access, execute
category: context
---

## Tool Context Access Pattern

**Impact: HIGH (Tools cannot access user data, generic behavior)**

Tools access RequestContext through the `context` parameter in the execute
function. This enables tools to personalize behavior based on the calling
user's identity, permissions, or preferences.

### What to Check

- Tool execute function accepts context parameter
- Context is accessed via `context?.mastra?.requestContext`
- Optional chaining is used throughout
- Context values have appropriate fallbacks

### Incorrect Configuration

```typescript
// Missing context parameter
const brokenTool = createTool({
  id: "broken-tool",
  description: "A tool that needs user context",
  inputSchema: z.object({ query: z.string() }),
  outputSchema: z.object({ result: z.string() }),
  execute: async ({ query }) => {  // Missing context!
    // How do I know who the user is?
    return { result: "generic response" };
  },
});

// Wrong context access pattern
const wrongAccessTool = createTool({
  id: "wrong-access",
  description: "Tool with wrong access",
  inputSchema: z.object({ query: z.string() }),
  outputSchema: z.object({ result: z.string() }),
  execute: async (input, context) => {
    const userId = context.requestContext.get("user-id");  // Wrong path!
    return { result: input.query };
  },
});
```

**Common Error Messages:**

```
TypeError: Cannot read properties of undefined (reading 'requestContext')
context.requestContext is undefined
Cannot access user context in tool
```

### Correct Configuration

```typescript
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Tool with proper context access
const userAwareTool = createTool({
  id: "user-search",
  description: "Search with user preferences",
  inputSchema: z.object({
    query: z.string().describe("Search query"),
  }),
  outputSchema: z.object({
    results: z.array(z.string()),
    searchedBy: z.string(),
  }),
  execute: async ({ query }, context) => {
    // Access RequestContext through context.mastra
    const requestContext = context?.mastra?.requestContext;

    // Safe access with optional chaining
    const userId = requestContext?.get("user-id") || "anonymous";
    const userTier = requestContext?.get("user-tier") || "free";

    // Customize behavior based on context
    const maxResults = userTier === "enterprise" ? 100 : 10;

    const results = await performSearch(query, {
      limit: maxResults,
      userId: userId,
    });

    return {
      results,
      searchedBy: userId,
    };
  },
});
```

### Permission-Based Tool Behavior

```typescript
const permissionAwareTool = createTool({
  id: "data-export",
  description: "Export data with permission checks",
  inputSchema: z.object({
    format: z.enum(["csv", "json", "xlsx"]),
    dataType: z.string(),
  }),
  outputSchema: z.object({
    downloadUrl: z.string().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ format, dataType }, context) => {
    const requestContext = context?.mastra?.requestContext;
    const userTier = requestContext?.get("user-tier") || "free";
    const isAdmin = requestContext?.get("is-admin") || false;

    // Check permissions
    if (format === "xlsx" && userTier === "free") {
      return {
        error: "Excel export requires Pro or Enterprise subscription",
      };
    }

    if (dataType === "sensitive" && !isAdmin) {
      return {
        error: "Sensitive data export requires admin privileges",
      };
    }

    const downloadUrl = await generateExport(format, dataType);
    return { downloadUrl };
  },
});
```

### Accessing User Preferences

```typescript
const preferenceAwareTool = createTool({
  id: "weather-lookup",
  description: "Get weather in user's preferred units",
  inputSchema: z.object({
    location: z.string().describe("City or location name"),
  }),
  outputSchema: z.object({
    temperature: z.number(),
    unit: z.string(),
    conditions: z.string(),
  }),
  execute: async ({ location }, context) => {
    const requestContext = context?.mastra?.requestContext;

    // Get user preferences from context
    const unit = requestContext?.get("temperature-unit") || "fahrenheit";
    const locale = requestContext?.get("locale") || "en-US";

    const weather = await fetchWeather(location);

    // Convert temperature based on preference
    const temperature = unit === "celsius"
      ? weather.tempCelsius
      : weather.tempFahrenheit;

    return {
      temperature,
      unit,
      conditions: weather.conditions,
    };
  },
});
```

### Tool with Mastra Service Access

```typescript
const agentDelegatingTool = createTool({
  id: "delegate-to-expert",
  description: "Delegate question to specialized agent",
  inputSchema: z.object({
    question: z.string(),
    expertType: z.enum(["legal", "technical", "financial"]),
  }),
  outputSchema: z.object({
    expertResponse: z.string(),
    expertId: z.string(),
  }),
  execute: async ({ question, expertType }, context) => {
    // Access mastra instance to get agents
    const mastra = context?.mastra;
    const requestContext = mastra?.requestContext;

    const agentId = `${expertType}-expert-agent`;
    const agent = mastra?.getAgent(agentId);

    if (!agent) {
      throw new Error(`Expert agent '${agentId}' not found`);
    }

    // Pass context through to agent call
    const response = await agent.generate(question, {
      memory: {
        thread: requestContext?.get("user-id") || "anonymous",
        resource: "tool-delegation",
      },
    });

    return {
      expertResponse: response.text || "",
      expertId: agentId,
    };
  },
});
```

### Context Access Path

```
context (tool execute second parameter)
  └── mastra (Mastra instance)
        ├── requestContext (RequestContext instance)
        │     └── .get("key") → value
        ├── getAgent(id) → Agent
        └── getWorkflow(id) → Workflow
```

### How to Fix

1. Add `context` as second parameter to execute function
2. Access context via `context?.mastra?.requestContext`
3. Use optional chaining throughout the access chain
4. Provide sensible default values for missing context
5. Document context requirements in tool description

### Reference

- [Tool Creation](https://mastra.ai/docs/v1/tools/create-tool)
- [Request Context](https://mastra.ai/docs/v1/server/request-context)
