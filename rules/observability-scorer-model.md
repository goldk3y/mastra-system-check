---
title: Scorer Judge Model Configuration
impact: MEDIUM
impactDescription: Model-graded scorers fail, evals don't run
tags: observability, scorer, evals, model, judge
category: observability
conditional: true
appliesWhen: using model-graded scorers (AnswerRelevancy, Hallucination, etc.)
---

## Scorer Judge Model Configuration

**Impact: MEDIUM (Model-graded scorers fail, evals don't run)**

**This check only applies if you're using model-graded scorers for evals.** If you're not using evals or only using automated scorers, this check can be skipped.

Model-graded scorers (like AnswerRelevancy, Hallucination) use an LLM as a judge to evaluate responses. These scorers need a model configuration to function.

### When This Check Applies

- You're using model-graded scorers (AnswerRelevancy, Hallucination, etc.)
- Skip this check if you're not using evals
- Skip this check if you only use automated scorers (Toxicity, Bias, etc.)

### What to Check

- Model-graded scorers have `model` configured
- Judge model API key is available
- Judge model is appropriate for evaluation task
- Judge model cost is acceptable at sampling rate

### Incorrect Configuration

```typescript
// Model-graded scorer without model
import { AnswerRelevancyScorer } from "@mastra/evals";

const agent = new Agent({
  model: "openai/gpt-4o-mini",
  evals: {
    scorers: [
      new AnswerRelevancyScorer(),  // Needs model for judging!
    ],
    sampling: 0.1,
  },
});
// Error: No judge model configured

// Missing API key for judge model
const agent = new Agent({
  model: "openai/gpt-4o-mini",
  evals: {
    scorers: [
      new AnswerRelevancyScorer({
        model: "anthropic/claude-sonnet-4-20250514",  // Needs ANTHROPIC_API_KEY
      }),
    ],
  },
});
// Error if ANTHROPIC_API_KEY not set
```

### Correct Configuration

```typescript
import { Agent } from "@mastra/core/agent";
import {
  AnswerRelevancyScorer,
  HallucinationScorer,
  ToxicityScorer,
} from "@mastra/evals";

const evaluatedAgent = new Agent({
  id: "evaluated-agent",
  model: "openai/gpt-4o",
  instructions: "You are a helpful assistant.",

  evals: {
    scorers: [
      // Model-graded scorer with explicit model
      new AnswerRelevancyScorer({
        model: "openai/gpt-4o",  // Judge model
        // Model will evaluate: "Is the answer relevant to the question?"
      }),

      // Another model-graded scorer
      new HallucinationScorer({
        model: "openai/gpt-4o",
        // Model will evaluate: "Does the answer contain hallucinations?"
      }),

      // Automated scorer - no model needed
      new ToxicityScorer(),
      // Uses rules/patterns, not a judge model
    ],
    sampling: 0.2,  // Evaluate 20% of responses
  },
});
```

### Choosing Judge Models

```typescript
// Cost-effective judging setup
const costEffectiveScorers = [
  new AnswerRelevancyScorer({
    // Use cheaper model for routine evals
    model: "openai/gpt-4o-mini",
  }),
];

// High-quality judging setup
const highQualityScorers = [
  new AnswerRelevancyScorer({
    // Use stronger model for critical evals
    model: "anthropic/claude-sonnet-4-20250514",
  }),
  new HallucinationScorer({
    model: "anthropic/claude-sonnet-4-20250514",
  }),
];

// Same model as agent (consistency)
const consistentScorers = [
  new AnswerRelevancyScorer({
    model: "openai/gpt-4o",  // Same as agent model
  }),
];

// Different model for unbiased judging
const unbiasedScorers = [
  new AnswerRelevancyScorer({
    // Different provider from agent for objectivity
    model: "anthropic/claude-sonnet-4-20250514",
  }),
];
```

### Scorer Types Reference

| Scorer | Type | Model Required? | Cost |
|--------|------|-----------------|------|
| ToxicityScorer | Automated | No | Low |
| BiasScorer | Automated | No | Low |
| ContentSimilarityScorer | Automated | No | Low |
| AnswerRelevancyScorer | Model-graded | Yes | Medium |
| HallucinationScorer | Model-graded | Yes | Medium |
| FaithfulnessScorer | Model-graded | Yes | Medium |
| CustomScorer | Depends | Depends | Varies |

### Cost Calculation

```typescript
// Estimate scoring costs
const agentRequestsPerDay = 10000;
const samplingRate = 0.1;  // 10%
const modelGradedScorers = 2;
const avgTokensPerEval = 500;
const costPerToken = 0.00003;  // GPT-4o

const evalsPerDay = agentRequestsPerDay * samplingRate;
const tokensPerDay = evalsPerDay * modelGradedScorers * avgTokensPerEval;
const dailyCost = tokensPerDay * costPerToken;

console.log(`Daily eval cost: $${dailyCost.toFixed(2)}`);
// 10000 * 0.1 * 2 * 500 * 0.00003 = $30/day
```

### Custom Model-Graded Scorer

```typescript
import { Scorer } from "@mastra/evals";

const customModelScorer = new Scorer({
  id: "format-compliance-scorer",
  description: "Checks if response follows required format",
  model: "openai/gpt-4o",  // Required for model-graded

  // Custom evaluation prompt
  prompt: `
    Evaluate if the assistant's response follows the required JSON format.

    Required format:
    {
      "answer": string,
      "confidence": number,
      "sources": string[]
    }

    Response to evaluate:
    {{response}}

    Score 1 if format is correct, 0 if not.
    Provide brief reasoning.
  `,

  // Parse model's evaluation
  parse: (modelOutput: string) => {
    const score = modelOutput.includes("Score: 1") ? 1 : 0;
    return { score, reason: modelOutput };
  },
});
```

### How to Fix

1. Add `model` configuration to model-graded scorers
2. Ensure judge model API key is set in environment
3. Choose judge model based on quality/cost tradeoff
4. Consider using automated scorers where possible
5. Calculate estimated eval costs before deployment
6. Monitor eval costs in production

### Reference

- [Evals & Scorers](https://mastra.ai/docs/v1/evals/overview)
- [Scorer Reference](https://mastra.ai/reference/v1/evals/scorers)
