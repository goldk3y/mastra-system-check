---
title: Agent Scorer Configuration
impact: HIGH
impactDescription: Evals not running, incorrect sampling, missing metrics
tags: agent, scorer, evals, sampling, configuration
category: agent
---

## Agent Scorer Configuration

**Impact: HIGH (Evals not running, incorrect sampling, missing metrics)**

Scorers (evaluators) can be attached to agents to automatically evaluate
response quality. Proper configuration includes valid sampling rates,
appropriate scorer selection, and storage for persisting eval results.

### What to Check

- Scorers are valid scorer instances
- Sampling rate is between 0 and 1
- Storage is configured for eval persistence
- Judge model is configured if using model-graded scorers
- Scorer combination makes sense for use case

### Incorrect Configuration

```typescript
// Invalid sampling rate
const agent = new Agent({
  id: "my-agent",
  model: "openai/gpt-4o",
  evals: {
    scorers: [toxicityScorer],
    sampling: 1.5,  // Invalid! Must be 0-1
  },
});

// Missing storage for evals
const agent = new Agent({
  id: "my-agent",
  model: "openai/gpt-4o",
  evals: {
    scorers: [toxicityScorer],
    // No storage configured - evals won't persist!
  },
});

// Model-graded scorer without judge model
const agent = new Agent({
  id: "my-agent",
  model: "openai/gpt-4o-mini",
  evals: {
    scorers: [
      new AnswerRelevancyScorer(),  // Needs judge model!
    ],
  },
});
```

**Common Error Messages:**

```
Error: Sampling rate must be between 0 and 1
Error: Storage required for eval persistence
Error: Judge model not configured for scorer
```

### Correct Configuration

```typescript
import { Agent } from "@mastra/core/agent";
import {
  ToxicityScorer,
  AnswerRelevancyScorer,
  HallucinationScorer
} from "@mastra/evals";

// Basic scorer configuration
const agentWithEvals = new Agent({
  id: "evaluated-agent",
  model: "openai/gpt-4o",
  instructions: "You are a helpful assistant.",
  evals: {
    scorers: [
      new ToxicityScorer(),
    ],
    sampling: 0.1,  // Evaluate 10% of responses
  },
});

// Model-graded scorers with judge model
const agentWithJudge = new Agent({
  id: "quality-agent",
  model: "openai/gpt-4o",
  instructions: "You are a helpful assistant.",
  evals: {
    scorers: [
      new AnswerRelevancyScorer({
        model: "openai/gpt-4o",  // Judge model for evaluation
      }),
      new HallucinationScorer({
        model: "openai/gpt-4o",
      }),
    ],
    sampling: 0.2,  // Evaluate 20% of responses
  },
});

// Mastra instance with storage for eval persistence
export const mastra = new Mastra({
  storage: new LibSQLStore({
    id: "mastra-storage",
    url: process.env.DATABASE_URL || "file:./mastra.db",
  }),
  agents: { agentWithEvals, agentWithJudge },
});
```

### Sampling Rate Guidelines

| Rate | Use Case | Notes |
|------|----------|-------|
| 0.0 | Disabled | No evaluations run |
| 0.01-0.05 | Production | Low overhead, statistical sampling |
| 0.1-0.2 | Staging | More coverage, moderate cost |
| 0.5-1.0 | Development | High coverage, higher cost |
| 1.0 | Testing | Every response evaluated |

### Available Scorers

| Scorer | Type | Description |
|--------|------|-------------|
| `ToxicityScorer` | Automated | Detects toxic/harmful content |
| `BiasScorer` | Automated | Detects biased responses |
| `AnswerRelevancyScorer` | Model-graded | Checks answer relevance to question |
| `HallucinationScorer` | Model-graded | Detects factual hallucinations |
| `FaithfulnessScorer` | Model-graded | Checks faithfulness to context |
| `ContentSimilarityScorer` | Automated | Compares output to expected |

### Custom Scorer

```typescript
import { Scorer } from "@mastra/evals";

const customScorer = new Scorer({
  id: "custom-format-scorer",
  description: "Checks if response follows format guidelines",
  score: async ({ output }) => {
    const hasGreeting = output.startsWith("Hello");
    const hasSignoff = output.includes("Best regards");

    return {
      score: hasGreeting && hasSignoff ? 1 : 0,
      reason: hasGreeting && hasSignoff
        ? "Proper format"
        : "Missing greeting or signoff",
    };
  },
});
```

### How to Fix

1. Ensure sampling rate is between 0 and 1
2. Configure storage on Mastra instance for eval persistence
3. Add judge model to model-graded scorers
4. Choose scorers appropriate for your use case
5. Start with low sampling rate in production (0.05-0.1)

### Reference

- [Evals & Scorers](https://mastra.ai/docs/v1/evals/overview)
- [Scorer Reference](https://mastra.ai/reference/v1/evals/scorers)
- [Custom Scorers](https://mastra.ai/docs/v1/evals/custom-scorers)
