---
title: Required Environment Variables
impact: CRITICAL
impactDescription: API calls fail, agents cannot generate responses
tags: environment, api-keys, configuration, secrets
category: config
---

## Required Environment Variables

**Impact: CRITICAL (API calls fail, agents cannot generate responses)**

Mastra's model router auto-detects environment variables for LLM providers.
Without the correct API keys set, agents cannot make model calls and will
throw authentication errors at runtime.

### What to Check

- .env file exists in project root
- Required API keys are set for configured models
- Keys are not empty strings or placeholder values
- .env is in .gitignore (not committed to version control)
- .env.example exists with placeholder values for documentation

### Incorrect Configuration

```bash
# .env file missing or empty
# No API keys configured

# OR hardcoded in source (NEVER DO THIS)
```

```typescript
// Hardcoded API key - SECURITY RISK
const agent = new Agent({
  model: "openai/gpt-4o",
  // API key exposed in source code!
});
```

### Correct Configuration

```bash
# .env
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=...

# Database
DATABASE_URL=file:./mastra.db
```

```bash
# .env.example (safe to commit)
OPENAI_API_KEY=your-openai-key-here
ANTHROPIC_API_KEY=your-anthropic-key-here
DATABASE_URL=file:./mastra.db
```

```gitignore
# .gitignore
.env
.env.local
.env.*.local
```

### Required Keys by Provider

| Provider | Environment Variable | Model Prefix |
|----------|---------------------|--------------|
| OpenAI | `OPENAI_API_KEY` | `openai/` |
| Anthropic | `ANTHROPIC_API_KEY` | `anthropic/` |
| Google | `GOOGLE_GENERATIVE_AI_API_KEY` | `google/` |
| Groq | `GROQ_API_KEY` | `groq/` |
| OpenRouter | `OPENROUTER_API_KEY` | `openrouter/` |
| Azure OpenAI | `AZURE_OPENAI_API_KEY` | `azure/` |

### How to Fix

1. Create a `.env` file in your project root
2. Add required API keys for your configured models
3. Ensure `.env` is in `.gitignore`
4. Create `.env.example` with placeholder values for team reference
5. Restart your development server after adding keys

### Verification

```bash
# Check if environment variable is set
echo $OPENAI_API_KEY

# Should not be empty or "undefined"
```

### Reference

- [Model Configuration](https://mastra.ai/models/v1)
- [Getting Started Guide](https://mastra.ai/docs/v1/getting-started/start)
