---
title: Output Format Expectations
impact: HIGH
impactDescription: Unparseable responses, inconsistent format, integration failures
tags: prompt, output, format, structure, parsing
category: prompt
---

## Output Format Expectations

**Impact: HIGH (Unparseable responses, inconsistent format, integration failures)**

When agents need to produce structured output for downstream processing,
the expected format must be clearly specified. Vague format expectations
lead to inconsistent outputs that break integrations and require manual
parsing.

### What to Check

- Output format is explicitly specified when needed
- Examples demonstrate exact format expected
- Structured outputs use consistent schema
- Format matches downstream processing needs
- Edge cases (empty results, errors) have defined format

### Incorrect Configuration

```typescript
// No format specification
const noFormatAgent = new Agent({
  id: "no-format",
  model: "openai/gpt-4o",
  instructions: `
    Analyze customer feedback and provide insights.
  `,
  // How should insights be formatted?
  // Downstream code can't parse output reliably
});

// Vague format
const vagueFormatAgent = new Agent({
  id: "vague-format",
  model: "openai/gpt-4o",
  instructions: `
    Analyze feedback and return the results in a structured way.
  `,
  // "Structured way" means different things to different people
});

// Format specified but no example
const noExampleAgent = new Agent({
  id: "no-example",
  model: "openai/gpt-4o",
  instructions: `
    Return analysis as JSON with sentiment, themes, and action items.
  `,
  // What are the exact field names? Types? Nesting?
});
```

### Correct Configuration

```typescript
// Clear format specification with example
const clearFormatAgent = new Agent({
  id: "feedback-analyzer",
  model: "openai/gpt-4o",
  instructions: `
    Analyze customer feedback and return structured insights.

    ## Output Format
    Respond with a JSON object following this exact structure:

    \`\`\`json
    {
      "sentiment": "positive" | "negative" | "neutral" | "mixed",
      "sentiment_score": <number between -1 and 1>,
      "themes": [
        {
          "name": "<theme name>",
          "mentions": <count>,
          "sentiment": "positive" | "negative" | "neutral"
        }
      ],
      "action_items": [
        {
          "priority": "high" | "medium" | "low",
          "description": "<actionable recommendation>",
          "theme": "<related theme name>"
        }
      ],
      "summary": "<2-3 sentence summary>"
    }
    \`\`\`

    ## Example

    Input: "Love the new dashboard! Though the export feature is slow and
    sometimes crashes. Would be great to have dark mode too."

    Output:
    \`\`\`json
    {
      "sentiment": "mixed",
      "sentiment_score": 0.3,
      "themes": [
        { "name": "Dashboard UX", "mentions": 1, "sentiment": "positive" },
        { "name": "Export Feature", "mentions": 1, "sentiment": "negative" },
        { "name": "Feature Request", "mentions": 1, "sentiment": "neutral" }
      ],
      "action_items": [
        {
          "priority": "high",
          "description": "Investigate and fix export crashes",
          "theme": "Export Feature"
        },
        {
          "priority": "medium",
          "description": "Optimize export performance",
          "theme": "Export Feature"
        },
        {
          "priority": "low",
          "description": "Consider adding dark mode option",
          "theme": "Feature Request"
        }
      ],
      "summary": "User appreciates the new dashboard but experiences issues with the export feature. They've also requested dark mode."
    }
    \`\`\`

    ## Edge Cases

    If no feedback is provided:
    \`\`\`json
    {
      "sentiment": "neutral",
      "sentiment_score": 0,
      "themes": [],
      "action_items": [],
      "summary": "No feedback provided for analysis."
    }
    \`\`\`
  `,
});
```

### Format Specification Methods

```typescript
// Method 1: JSON Schema in instructions
const jsonSchemaAgent = new Agent({
  instructions: `
    ## Output Schema
    {
      "type": "object",
      "properties": {
        "status": { "type": "string", "enum": ["success", "error"] },
        "data": { "type": "object" },
        "message": { "type": "string" }
      },
      "required": ["status"]
    }
  `,
});

// Method 2: TypeScript interface style
const typescriptStyleAgent = new Agent({
  instructions: `
    ## Output Format
    interface Response {
      status: "success" | "error";
      data?: {
        items: Array<{ id: string; name: string; }>;
        total: number;
      };
      error?: {
        code: string;
        message: string;
      };
    }
  `,
});

// Method 3: Table format
const tableFormatAgent = new Agent({
  instructions: `
    ## Output Fields

    | Field | Type | Required | Description |
    |-------|------|----------|-------------|
    | status | string | yes | "success" or "error" |
    | items | array | if success | List of results |
    | error | string | if error | Error message |
  `,
});
```

### Using Mastra's Structured Output

```typescript
import { Agent } from "@mastra/core/agent";
import { z } from "zod";

// Define output schema with Zod
const analysisSchema = z.object({
  sentiment: z.enum(["positive", "negative", "neutral", "mixed"]),
  score: z.number().min(-1).max(1),
  themes: z.array(z.object({
    name: z.string(),
    count: z.number(),
  })),
  summary: z.string(),
});

const structuredAgent = new Agent({
  id: "structured-output",
  model: "openai/gpt-4o",
  instructions: `
    Analyze feedback and provide structured insights.
    Your response will be validated against a schema.
  `,
});

// Generate with structured output
const result = await structuredAgent.generate(feedback, {
  output: analysisSchema,
});
// result.object is typed and validated
```

### Format for Different Use Cases

| Use Case | Recommended Format | Why |
|----------|-------------------|-----|
| API response | JSON | Machine parseable |
| User-facing | Markdown | Readable, formatted |
| Data pipeline | JSON/CSV | Structured processing |
| Report | Markdown with JSON | Readable + extractable |
| Code generation | Fenced code blocks | Syntax highlighted |

### Handling Format Errors

```typescript
const robustFormatAgent = new Agent({
  instructions: `
    ## Output Format
    Always respond with valid JSON.

    ## Error Handling
    If you cannot complete the analysis, return:
    \`\`\`json
    {
      "status": "error",
      "error_code": "ANALYSIS_FAILED",
      "error_message": "<description of what went wrong>",
      "partial_results": null
    }
    \`\`\`

    If input is malformed or unclear:
    \`\`\`json
    {
      "status": "error",
      "error_code": "INVALID_INPUT",
      "error_message": "Could not parse input: <reason>",
      "partial_results": null
    }
    \`\`\`

    ## Important
    - Never include text outside the JSON object
    - Always use double quotes for strings
    - Escape special characters properly
    - Do not include comments in JSON
  `,
});
```

### Validating Output Format

```typescript
// Downstream validation
async function analyzeWithValidation(feedback: string) {
  const response = await feedbackAgent.generate(feedback);

  try {
    const parsed = JSON.parse(response.text);

    // Validate required fields
    if (!parsed.sentiment || !parsed.themes) {
      throw new Error("Missing required fields");
    }

    return parsed;
  } catch (error) {
    console.error("Format validation failed:", error);
    // Handle gracefully or retry
  }
}
```

### How to Fix

1. Determine how output will be consumed (API, UI, pipeline)
2. Define exact format with field names and types
3. Provide at least one complete example
4. Specify format for edge cases (empty, error states)
5. Consider using Mastra's structured output feature
6. Add downstream validation for critical integrations

### Reference

- [Structured Output](https://mastra.ai/docs/v1/agents/structured-output)
- [Agent Response Handling](https://mastra.ai/docs/v1/agents/overview)
