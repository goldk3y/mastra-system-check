---
title: Model Selection for Use Case
impact: LOW
impactDescription: Higher costs, slower responses, overkill for simple tasks
tags: optimization, model, cost, performance
category: optimization
---

## Model Selection for Use Case

**Impact: LOW (Higher costs, slower responses, overkill for simple tasks)**

Different tasks require different model capabilities. Using GPT-4 for simple
classification or Claude Opus for basic extraction wastes money and adds
latency. Match model capability to task complexity.

### What to Check

- Simple tasks use smaller/faster models
- Complex reasoning uses capable models
- Cost-sensitive operations use economical models
- Latency-sensitive paths use fast models
- Model selection is intentional, not default

### Incorrect Configuration

```typescript
// Overkill: Using most expensive model for everything
const classificationAgent = new Agent({
  id: "classifier",
  model: "anthropic/claude-sonnet-4-20250514",  // Overkill for classification
  instructions: "Classify the following text as positive, negative, or neutral.",
});

const extractionAgent = new Agent({
  id: "extractor",
  model: "openai/gpt-4o",  // Expensive for simple extraction
  instructions: "Extract the email address from the text.",
});

const summarizer = new Agent({
  id: "summarizer",
  model: "anthropic/claude-sonnet-4-20250514",  // 100x more expensive than needed
  instructions: "Summarize this text in one sentence.",
});
```

### Correct Configuration

```typescript
// Right-sized: Match model to task complexity
const classificationAgent = new Agent({
  id: "classifier",
  model: "openai/gpt-4o-mini",  // Fast, cheap, good at classification
  instructions: "Classify the following text as positive, negative, or neutral.",
});

const extractionAgent = new Agent({
  id: "extractor",
  model: "openai/gpt-4o-mini",  // Simple extraction doesn't need GPT-4
  instructions: "Extract the email address from the text.",
});

const summarizer = new Agent({
  id: "summarizer",
  model: "openai/gpt-4o-mini",  // Summarization works well with smaller models
  instructions: "Summarize this text in one sentence.",
});

// Complex reasoning DOES need a capable model
const reasoningAgent = new Agent({
  id: "analyst",
  model: "anthropic/claude-sonnet-4-20250514",  // Worth it for complex analysis
  instructions: `
    You are a financial analyst. Analyze market trends, consider multiple
    factors, and provide nuanced investment recommendations with reasoning.
  `,
});

// Dynamic model selection based on context
const adaptiveAgent = new Agent({
  id: "adaptive",
  model: ({ requestContext }) => {
    const tier = requestContext.get("user-tier");
    const complexity = requestContext.get("task-complexity");

    if (tier === "enterprise" || complexity === "high") {
      return "anthropic/claude-sonnet-4-20250514";
    }
    return "openai/gpt-4o-mini";
  },
  instructions: "Help the user with their request.",
});
```

### Model Selection Guide

| Task Type | Recommended Models | Reasoning |
|-----------|-------------------|-----------|
| Classification | gpt-4o-mini, claude-haiku | Fast, cheap, high accuracy |
| Simple extraction | gpt-4o-mini, claude-haiku | Pattern matching, no reasoning |
| Summarization | gpt-4o-mini, claude-haiku | Well-understood task |
| Translation | gpt-4o-mini | Good multilingual support |
| Code generation | gpt-4o, claude-sonnet | Needs reasoning |
| Complex analysis | claude-sonnet, gpt-4o | Multi-step reasoning |
| Creative writing | claude-sonnet, gpt-4o | Nuance and style |
| Tool orchestration | claude-sonnet, gpt-4o | Planning and execution |

### Cost Comparison (Approximate)

```typescript
// Relative costs per 1M tokens (input/output combined average)
const modelCosts = {
  "openai/gpt-4o-mini": 0.15,      // Baseline
  "anthropic/claude-haiku": 0.25,
  "openai/gpt-4o": 2.50,           // ~17x mini
  "anthropic/claude-sonnet-4-20250514": 3.00,  // ~20x mini
  "anthropic/claude-opus": 15.00,  // ~100x mini
};

// For 1M classification requests:
// gpt-4o-mini: ~$150
// claude-sonnet: ~$3,000
// Savings: $2,850 per million requests
```

### How to Fix

1. Audit each agent's model selection
2. Identify tasks that don't require complex reasoning
3. Switch simple tasks to smaller models (gpt-4o-mini, claude-haiku)
4. Reserve capable models for complex analysis and reasoning
5. Consider dynamic model selection based on task complexity
6. Monitor costs and quality to find the right balance

### Reference

- [OpenAI Model Pricing](https://openai.com/pricing)
- [Anthropic Model Pricing](https://www.anthropic.com/pricing)
- [Model Selection Guide](https://mastra.ai/docs/v1/agents/model-providers)
