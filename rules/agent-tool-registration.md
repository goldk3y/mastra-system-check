---
title: Agent Tool Registration
impact: HIGH
impactDescription: Agent cannot use tools, limited functionality
tags: agent, tools, registration, configuration
category: agent
---

## Agent Tool Registration

**Impact: HIGH (Agent cannot use tools, limited functionality)**

Tools must be properly registered with agents for the agent to use them. Tools
defined elsewhere in the codebase but not registered with the agent will not
be available during conversations. Additionally, tool descriptions must help
the LLM understand when and how to use each tool.

### What to Check

- Tools are imported into the agent file
- Tools are registered in the agent's `tools` property
- Tool IDs are unique and descriptive
- Tool descriptions are clear and help LLM understand usage
- Tools mentioned in instructions are actually registered

### Incorrect Configuration

```typescript
// Tools not imported
const agent = new Agent({
  id: "research-agent",
  model: "openai/gpt-4o",
  instructions: "Use the search tool to find information.",
  // tools property missing!
});

// Tools imported but not registered
import { searchTool, analyzeTool } from "./tools";

const agent = new Agent({
  id: "research-agent",
  model: "openai/gpt-4o",
  instructions: "Use search and analyze tools.",
  tools: { searchTool },  // analyzeTool not registered!
});

// Instructions mention non-existent tools
const agent = new Agent({
  id: "research-agent",
  model: "openai/gpt-4o",
  instructions: "Use the email tool to send notifications.",  // No email tool!
  tools: { searchTool },
});
```

**Common Error Messages:**

```
Tool 'analyze' not found in agent tools
Agent has no tools configured
Instructions reference tool that is not registered
```

### Correct Configuration

```typescript
import { Agent } from "@mastra/core/agent";
import { searchTool } from "./tools/search-tool";
import { analyzeTool } from "./tools/analyze-tool";
import { summarizeTool } from "./tools/summarize-tool";

const researchAgent = new Agent({
  id: "research-agent",
  model: "openai/gpt-4o",
  instructions: `
    You are a research assistant with the following tools:

    ## Available Tools
    - search: Find information on any topic
    - analyze: Analyze data and extract insights
    - summarize: Create concise summaries of content

    ## Workflow
    1. Use search to gather relevant information
    2. Use analyze to extract key insights
    3. Use summarize to present findings clearly
  `,
  tools: {
    searchTool,
    analyzeTool,
    summarizeTool,
  },
});
```

### Tool Registration with Mastra Instance

```typescript
// src/mastra/index.ts
import { Mastra } from "@mastra/core";
import { researchAgent } from "./agents/research-agent";
import { searchTool, analyzeTool, summarizeTool } from "./tools";

export const mastra = new Mastra({
  agents: { researchAgent },
  // Tools can also be registered at Mastra level for sharing
  tools: { searchTool, analyzeTool, summarizeTool },
});
```

### Dynamic Tool Registration

```typescript
// Tools can be provided dynamically based on context
const dynamicAgent = new Agent({
  id: "dynamic-agent",
  model: "openai/gpt-4o",
  instructions: ({ requestContext }) => {
    const hasAdminAccess = requestContext?.get("is-admin");
    return hasAdminAccess
      ? "You have admin tools available including user management."
      : "You have standard user tools available.";
  },
  tools: ({ requestContext }) => {
    const hasAdminAccess = requestContext?.get("is-admin");
    const baseTools = { searchTool, viewTool };

    if (hasAdminAccess) {
      return { ...baseTools, adminTool, deleteTool };
    }
    return baseTools;
  },
});
```

### Verification Checklist

| Check | Description |
|-------|-------------|
| Import exists | Tool is imported from correct path |
| Registration | Tool appears in agent's `tools` property |
| Instruction match | Tools in instructions match registered tools |
| Description quality | Tool descriptions help LLM understand usage |
| ID uniqueness | No duplicate tool IDs across agent |

### How to Fix

1. Import all required tools at top of agent file
2. Add tools to the agent's `tools` property
3. Update instructions to accurately describe available tools
4. Remove references to unregistered tools from instructions
5. Consider dynamic tool registration for permission-based access

### Reference

- [Agent Tools](https://mastra.ai/docs/v1/agents/agent-tools)
- [Tool Creation](https://mastra.ai/docs/v1/tools/create-tool)
