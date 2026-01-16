---
title: Appropriate Sampling Rates
impact: MEDIUM
impactDescription: Missing critical data or excessive costs
tags: observability, sampling, rate, cost, production
category: observability
conditional: true
appliesWhen: observability or evals are configured with sampling
---

## Appropriate Sampling Rates

**Impact: MEDIUM (Missing critical data or excessive costs)**

**This check only applies if you're using observability or evals with sampling.** If you're not using these features, this check can be skipped.

Sampling rates control how much observability data is collected. Too high increases costs and storage; too low misses important events.

### When This Check Applies

- You have observability/telemetry with sampling configured
- You have evals with sampling configured
- Skip this check if you're not using observability or evals

### What to Check

- Sampling rates are environment-appropriate
- Error cases are always sampled (rate = 1.0)
- Eval sampling considers model costs
- Trace sampling balances visibility and cost

### Incorrect Configuration

```typescript
// 100% sampling in production - expensive!
export const mastra = new Mastra({
  observability: {
    enabled: true,
    sampling: {
      rate: 1.0,  // Every request! Costly at scale
    },
  },
});

// Too low in production - missing critical data
export const mastra = new Mastra({
  observability: {
    enabled: true,
    sampling: {
      rate: 0.001,  // Only 0.1% - likely missing errors
    },
  },
});

// High eval sampling with expensive judge - very costly
const agent = new Agent({
  evals: {
    scorers: [
      new AnswerRelevancyScorer({ model: "openai/gpt-4o" }),
      new HallucinationScorer({ model: "openai/gpt-4o" }),
      new FaithfulnessScorer({ model: "openai/gpt-4o" }),
    ],
    sampling: 0.5,  // 50% with 3 GPT-4o calls each!
  },
});
```

### Correct Configuration

```typescript
import { Mastra } from "@mastra/core";

// Development - full sampling for debugging
const devObservability = {
  enabled: true,
  sampling: { rate: 1.0 },  // 100% in dev
};

// Staging - moderate sampling
const stagingObservability = {
  enabled: true,
  sampling: { rate: 0.5 },  // 50% in staging
};

// Production - cost-conscious with important cases always sampled
const prodObservability = {
  enabled: true,
  sampling: {
    // Base rate for normal requests
    rate: 0.1,  // 10% baseline

    // Rules for always sampling certain cases
    rules: [
      // Always sample errors
      { match: { status: "error" }, rate: 1.0 },

      // Always sample slow requests
      { match: { duration: { gt: 5000 } }, rate: 1.0 },

      // Higher rate for specific agents
      { match: { agentId: "critical-agent" }, rate: 0.5 },

      // Default
      { match: {}, rate: 0.1 },
    ],
  },
};

export const mastra = new Mastra({
  observability: process.env.NODE_ENV === "production"
    ? prodObservability
    : process.env.NODE_ENV === "staging"
      ? stagingObservability
      : devObservability,
});
```

### Eval Sampling Guidelines

```typescript
// Cost-conscious eval configuration
const agent = new Agent({
  model: "openai/gpt-4o",
  evals: {
    scorers: [
      // Cheap automated scorers - can sample more
      new ToxicityScorer(),
      new BiasScorer(),

      // Expensive model-graded scorers - sample less
      new AnswerRelevancyScorer({
        model: "openai/gpt-4o-mini",  // Use cheaper model
      }),
    ],
    sampling: 0.1,  // 10% for production
  },
});

// Different sampling by environment
const evalConfig = {
  scorers: [
    new ToxicityScorer(),
    new AnswerRelevancyScorer({ model: "openai/gpt-4o-mini" }),
  ],
  sampling: process.env.NODE_ENV === "production"
    ? 0.05   // 5% in production
    : process.env.NODE_ENV === "staging"
      ? 0.2  // 20% in staging
      : 1.0, // 100% in development
};
```

### Sampling Rate Reference

| Environment | Traces | Evals | Notes |
|-------------|--------|-------|-------|
| Development | 1.0 (100%) | 1.0 (100%) | Full visibility for debugging |
| Staging | 0.5 (50%) | 0.2 (20%) | Good coverage, moderate cost |
| Production | 0.05-0.1 | 0.05-0.1 | Cost-conscious |
| Production (errors) | 1.0 (100%) | 1.0 (100%) | Always capture failures |

### Cost Calculation

```typescript
// Calculate observability costs
function calculateMonthlyCosts(config: {
  dailyRequests: number;
  traceSamplingRate: number;
  evalSamplingRate: number;
  modelGradedScorers: number;
  judgeModel: "gpt-4o" | "gpt-4o-mini";
}) {
  const {
    dailyRequests,
    traceSamplingRate,
    evalSamplingRate,
    modelGradedScorers,
    judgeModel,
  } = config;

  // Trace storage costs (example: $0.10 per GB)
  const tracesPerDay = dailyRequests * traceSamplingRate;
  const bytesPerTrace = 2000;
  const traceStorageGB = (tracesPerDay * bytesPerTrace * 30) / (1024 ** 3);
  const traceStorageCost = traceStorageGB * 0.10;

  // Eval costs
  const evalsPerDay = dailyRequests * evalSamplingRate;
  const tokensPerEval = 500;
  const costPerToken = judgeModel === "gpt-4o" ? 0.00003 : 0.000003;
  const evalCost = evalsPerDay * modelGradedScorers * tokensPerEval * costPerToken * 30;

  return {
    traceStorageCost,
    evalCost,
    totalMonthlyCost: traceStorageCost + evalCost,
  };
}

// Example
const costs = calculateMonthlyCosts({
  dailyRequests: 50000,
  traceSamplingRate: 0.1,
  evalSamplingRate: 0.05,
  modelGradedScorers: 2,
  judgeModel: "gpt-4o-mini",
});
console.log(`Monthly cost: $${costs.totalMonthlyCost.toFixed(2)}`);
```

### Adaptive Sampling

```typescript
// Adaptive sampling based on current load
let currentSamplingRate = 0.1;

function adaptSamplingRate(metrics: { errorRate: number; requestsPerSecond: number }) {
  // Increase sampling when errors are high
  if (metrics.errorRate > 0.05) {
    currentSamplingRate = Math.min(1.0, currentSamplingRate * 2);
  }

  // Decrease sampling when load is high
  if (metrics.requestsPerSecond > 1000) {
    currentSamplingRate = Math.max(0.01, currentSamplingRate * 0.5);
  }

  return currentSamplingRate;
}
```

### How to Fix

1. Set environment-appropriate base sampling rates
2. Always sample errors at 100%
3. Use rules to increase sampling for important cases
4. Calculate expected costs before deployment
5. Use cheaper judge models for evals when possible
6. Monitor sampling rate effectiveness

### Reference

- [Observability Sampling](https://mastra.ai/docs/v1/observability/sampling)
- [Eval Configuration](https://mastra.ai/docs/v1/evals/configuration)
