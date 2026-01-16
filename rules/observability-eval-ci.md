---
title: CI/CD Eval Configuration
impact: MEDIUM
impactDescription: No regression detection, breaking changes reach production
tags: observability, evals, ci, cd, testing
category: observability
conditional: true
appliesWhen: you want automated quality regression testing for agents
---

## CI/CD Eval Configuration

**Impact: MEDIUM (No regression detection, breaking changes reach production)**

**This check only applies if you want automated quality testing in CI/CD.** If you're not ready for evals yet or have simple agents that don't need regression testing, this check can be skipped.

Running evals in CI/CD catches regressions before they reach production. Without CI evals, changes to prompts, tools, or agent configurations may degrade quality without detection.

### When This Check Applies

- You have agents in production that need quality guarantees
- You want to catch regressions before deployment
- Skip this check if you're in early development or prototyping
- Skip this check if evals aren't relevant to your use case

### What to Check

- Eval suite exists for critical agents/workflows
- Evals run on pull requests
- Baseline scores are established and tracked
- Regressions fail the build
- Test datasets are version controlled

### Incorrect Configuration

```typescript
// No CI evals - changes ship without quality checks
// package.json
{
  "scripts": {
    "test": "vitest",
    "build": "tsc"
    // No eval script!
  }
}

// Agent without testable eval configuration
const agent = new Agent({
  model: "openai/gpt-4o",
  instructions: "You are helpful.",
  // No structured way to test this
});
```

### Correct Configuration

```typescript
// src/mastra/evals/agent-evals.ts
import { runEvals, EvalDataset } from "@mastra/evals";
import {
  AnswerRelevancyScorer,
  ToxicityScorer,
  ContentSimilarityScorer,
} from "@mastra/evals";
import { supportAgent } from "../agents/support-agent";

// Test dataset
const testCases: EvalDataset = [
  {
    input: "How do I reset my password?",
    expected: "password reset",
    context: { topic: "account" },
  },
  {
    input: "I want to cancel my subscription",
    expected: "cancellation process",
    context: { topic: "billing" },
  },
  {
    input: "Your product is terrible!",
    expected: "empathetic response",
    context: { topic: "complaint" },
  },
  // More test cases...
];

// Eval configuration
export const supportAgentEvals = {
  agent: supportAgent,
  dataset: testCases,
  scorers: [
    new AnswerRelevancyScorer({ model: "openai/gpt-4o-mini" }),
    new ToxicityScorer(),
    new ContentSimilarityScorer(),
  ],
  thresholds: {
    answerRelevancy: 0.8,  // Min 80% relevancy
    toxicity: 0.1,         // Max 10% toxicity
    contentSimilarity: 0.7, // Min 70% similarity to expected
  },
};
```

### CI Script

```typescript
// scripts/run-evals.ts
import { runEvals } from "@mastra/evals";
import { supportAgentEvals } from "../src/mastra/evals/agent-evals";

async function main() {
  console.log("Running agent evals...\n");

  const results = await runEvals({
    ...supportAgentEvals,
    parallel: 5,  // Run 5 evals concurrently
    verbose: true,
  });

  // Check against thresholds
  const failures: string[] = [];

  for (const [scorer, score] of Object.entries(results.aggregates)) {
    const threshold = supportAgentEvals.thresholds[scorer];
    if (threshold !== undefined) {
      if (scorer === "toxicity" && score > threshold) {
        failures.push(`${scorer}: ${score.toFixed(2)} > ${threshold} (threshold)`);
      } else if (scorer !== "toxicity" && score < threshold) {
        failures.push(`${scorer}: ${score.toFixed(2)} < ${threshold} (threshold)`);
      }
    }
  }

  // Report results
  console.log("\n=== Eval Results ===");
  console.log(`Total cases: ${results.total}`);
  console.log(`Pass rate: ${(results.passRate * 100).toFixed(1)}%`);

  for (const [scorer, score] of Object.entries(results.aggregates)) {
    console.log(`${scorer}: ${score.toFixed(2)}`);
  }

  if (failures.length > 0) {
    console.error("\n=== FAILURES ===");
    failures.forEach(f => console.error(`  - ${f}`));
    process.exit(1);  // Fail the build
  }

  console.log("\n✓ All evals passed!");
}

main().catch(error => {
  console.error("Eval error:", error);
  process.exit(1);
});
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:evals": "tsx scripts/run-evals.ts",
    "test:all": "npm run test && npm run test:evals",
    "build": "tsc",
    "ci": "npm run test:all && npm run build"
  }
}
```

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm test

      - name: Run agent evals
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: npm run test:evals

      - name: Upload eval results
        uses: actions/upload-artifact@v4
        with:
          name: eval-results
          path: eval-results.json
        if: always()

      - name: Build
        run: npm run build
```

### Baseline Tracking

```typescript
// scripts/update-baseline.ts
import { runEvals } from "@mastra/evals";
import { supportAgentEvals } from "../src/mastra/evals/agent-evals";
import fs from "fs";

async function updateBaseline() {
  const results = await runEvals(supportAgentEvals);

  const baseline = {
    timestamp: new Date().toISOString(),
    commit: process.env.GITHUB_SHA || "local",
    scores: results.aggregates,
  };

  fs.writeFileSync(
    "eval-baseline.json",
    JSON.stringify(baseline, null, 2)
  );

  console.log("Baseline updated:", baseline);
}

// scripts/compare-baseline.ts
async function compareToBaseline() {
  const baseline = JSON.parse(fs.readFileSync("eval-baseline.json", "utf-8"));
  const current = await runEvals(supportAgentEvals);

  const regressions: string[] = [];
  const improvements: string[] = [];

  for (const [scorer, currentScore] of Object.entries(current.aggregates)) {
    const baselineScore = baseline.scores[scorer];
    if (baselineScore === undefined) continue;

    const delta = currentScore - baselineScore;
    const threshold = 0.05;  // 5% threshold

    if (scorer === "toxicity") {
      if (delta > threshold) {
        regressions.push(`${scorer}: +${(delta * 100).toFixed(1)}%`);
      }
    } else {
      if (delta < -threshold) {
        regressions.push(`${scorer}: ${(delta * 100).toFixed(1)}%`);
      } else if (delta > threshold) {
        improvements.push(`${scorer}: +${(delta * 100).toFixed(1)}%`);
      }
    }
  }

  if (regressions.length > 0) {
    console.error("Regressions detected:", regressions);
    process.exit(1);
  }

  if (improvements.length > 0) {
    console.log("Improvements:", improvements);
  }
}
```

### How to Fix

1. Create eval dataset with representative test cases
2. Define scorers and thresholds for each agent
3. Add `npm run test:evals` script
4. Configure CI to run evals on PRs
5. Set up baseline tracking for regression detection
6. Store test datasets in version control

### Reference

- [Running Evals](https://mastra.ai/docs/v1/evals/running)
- [CI/CD Integration](https://mastra.ai/docs/v1/evals/ci-cd)
