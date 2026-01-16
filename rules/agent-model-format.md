---
title: Agent Model Format Validation
impact: HIGH
impactDescription: Agent fails to initialize, model not found errors
tags: agent, model, provider, format, configuration
category: agent
---

## Agent Model Format Validation

**Impact: HIGH (Agent fails to initialize, model not found errors)**

Mastra uses a specific format for model identifiers: `provider/model-name`. Using
incorrect formats or invalid provider/model combinations will cause runtime errors
when the agent tries to make LLM calls.

### What to Check

- Model string follows `provider/model-name` format
- Provider is valid (openai, anthropic, google, groq, etc.)
- Model name is valid for the specified provider
- No typos in provider or model names

### Incorrect Configuration

```typescript
// Missing provider prefix
const agent = new Agent({
  model: "gpt-4o",  // Wrong! Missing "openai/" prefix
});

// Invalid provider
const agent = new Agent({
  model: "openAI/gpt-4o",  // Wrong! Provider is case-sensitive
});

// Typo in model name
const agent = new Agent({
  model: "anthropic/claude-sonnet",  // Wrong! Missing version suffix
});

// Non-existent model
const agent = new Agent({
  model: "openai/gpt-5-turbo",  // Wrong! Model doesn't exist
});
```

**Common Error Messages:**

```
Error: Model provider 'gpt-4o' not found
Error: Invalid model identifier format
Error: Model 'openai/gpt-5-turbo' is not available
```

### Correct Configuration

```typescript
import { Agent } from "@mastra/core/agent";

// OpenAI models
const openaiAgent = new Agent({
  id: "openai-agent",
  model: "openai/gpt-4o",  // Correct format
  instructions: "You are a helpful assistant.",
});

// Anthropic models
const anthropicAgent = new Agent({
  id: "anthropic-agent",
  model: "anthropic/claude-sonnet-4-20250514",  // Correct with version
  instructions: "You are a helpful assistant.",
});

// Google models
const googleAgent = new Agent({
  id: "google-agent",
  model: "google/gemini-2.0-flash",
  instructions: "You are a helpful assistant.",
});

// Dynamic model selection based on context
const dynamicAgent = new Agent({
  id: "dynamic-agent",
  model: ({ requestContext }) => {
    const tier = requestContext?.get("user-tier");
    return tier === "premium"
      ? "anthropic/claude-sonnet-4-20250514"
      : "openai/gpt-4o-mini";
  },
  instructions: "You are a helpful assistant.",
});
```

### Valid Provider/Model Combinations

| Provider | Example Models |
|----------|---------------|
| `openai/` | gpt-4o, gpt-4o-mini, gpt-4-turbo, o1, o1-mini |
| `anthropic/` | claude-sonnet-4-20250514, claude-opus-4-20250514, claude-haiku-3-20240307 |
| `google/` | gemini-2.0-flash, gemini-1.5-pro, gemini-1.5-flash |
| `groq/` | llama-3.3-70b-versatile, mixtral-8x7b-32768 |
| `openrouter/` | Various models via OpenRouter |

### How to Fix

1. Ensure model string includes provider prefix: `provider/model-name`
2. Verify provider name is lowercase and valid
3. Check model name matches exactly (including version suffixes)
4. Verify corresponding API key is set in environment variables
5. Test with a simple agent.generate() call to confirm

### Reference

- [Model Configuration](https://mastra.ai/docs/v1/agents/model-providers)
- [Agent Reference](https://mastra.ai/reference/v1/agents/agent-class)
