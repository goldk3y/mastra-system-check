# Mastra System Check

A comprehensive Claude Code skill for validating Mastra AI agent projects. This skill performs 66 checks across 10 categories to identify configuration issues, missing best practices, and potential problems before they cause runtime errors.

## Installation

### Option 1: One-line install (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/goldk3y/mastra-system-check/main/install.sh | bash
```

### Option 2: npx (after npm publish)

```bash
npx mastra-system-check
```

### Option 3: Git clone

```bash
git clone https://github.com/goldk3y/mastra-system-check.git ~/.claude/skills/mastra-system-check
```

### Option 4: Manual

Download and copy this directory to:
```bash
~/.claude/skills/mastra-system-check/
```

### Verification

The skill will automatically activate when working with Mastra projects. You can verify installation by asking Claude Code to perform a system check on your Mastra project.

## What It Checks

### Priority Levels

| Level | Categories | Description |
|-------|------------|-------------|
| **CRITICAL** | Configuration | System won't function without fixes |
| **HIGH** | Agents, Workflows, Context, Prompts | Major functionality issues |
| **MEDIUM** | Memory, Tools, Observability, Security | Quality and maintainability |
| **LOW** | Optimization | Performance and cost improvements |

### Check Categories

1. **Configuration & Setup (6 checks)** - Storage, env vars, TypeScript, entry points
2. **Agent Configuration (6 checks)** - Model format, instructions, tools, memory
3. **Workflow Configuration (6 checks)** - Commit, schemas, steps, error handling
4. **Context & Data Flow (8 checks)** - Type safety, middleware, propagation
5. **Prompt Engineering (10 checks)** - Structure, token efficiency, examples
6. **Memory Configuration (6 checks)** - Storage, threads, vector stores
7. **Tool Configuration (6 checks)** - Schemas, descriptions, error handling
8. **Observability & Evals (6 checks)** - Tracing, exporters, scorers
9. **Security & Guardrails (6 checks)** - Auth, CORS, PII, prompt injection
10. **Performance & Optimization (6 checks)** - Model selection, caching, batching

## Usage

### Automatic Activation

The skill activates when:
- Setting up a new Mastra project
- Debugging Mastra configuration errors
- Reviewing Mastra code for best practices
- Preparing a Mastra project for production
- Troubleshooting agent, workflow, or memory issues

### Manual Activation

Ask Claude Code to run a system check:

```
Run a Mastra system check on this project
```

Or check specific categories:

```
Check my Mastra agent configurations
Validate my workflow setup
Review my memory configuration
```

### Output Format

For each issue found:

```
[PRIORITY] Check ID: Rule Name
- Issue: Description of the problem
- Location: File path and line number
- Fix: Specific code change to resolve
- Reference: Link to Mastra documentation
```

## File Structure

```
mastra-system-check/
├── SKILL.md          # Skill metadata and triggers
├── AGENTS.md         # Compiled comprehensive guide
├── metadata.json     # Version and organization info
├── README.md         # This file
└── rules/
    ├── _sections.md  # Category hierarchy
    ├── _template.md  # Template for new rules
    ├── config-*.md   # Configuration checks (CRITICAL)
    ├── agent-*.md    # Agent checks (HIGH)
    ├── workflow-*.md # Workflow checks (HIGH)
    ├── context-*.md  # Context checks (HIGH)
    ├── prompt-*.md   # Prompt checks (HIGH)
    ├── memory-*.md   # Memory checks (MEDIUM)
    ├── tool-*.md     # Tool checks (MEDIUM)
    ├── observability-*.md  # Observability checks (MEDIUM)
    ├── security-*.md       # Security checks (MEDIUM)
    └── optimization-*.md   # Optimization checks (LOW)
```

## Most Common Issues

These are the issues most frequently caught by the system check:

1. **Missing storage provider** - Memory and workflows won't persist
2. **Missing API keys** - Agent calls fail at runtime
3. **Wrong model format** - Should be `provider/model-name`
4. **No thread/resource in memory calls** - Messages aren't tracked
5. **Untyped RequestContext** - No type safety across components
6. **Security processors not first** - PII stored before redaction
7. **Missing .commit() on workflows** - Workflow won't execute

## Quick Fixes

### Essential Setup

```typescript
// src/mastra/index.ts
import { Mastra } from "@mastra/core";
import { LibSQLStore } from "@mastra/libsql";

export const mastra = new Mastra({
  storage: new LibSQLStore({
    id: "mastra-storage",
    url: process.env.DATABASE_URL || "file:./mastra.db",
  }),
  agents: { /* your agents */ },
});
```

### Environment Variables

```bash
# .env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=file:./mastra.db
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true
  }
}
```

## Contributing

To add new rules:

1. Copy `rules/_template.md` to a new file with the appropriate prefix
2. Fill in the frontmatter (title, impact, tags, category)
3. Write clear "What to Check", "Incorrect", "Correct", and "How to Fix" sections
4. Update `rules/_sections.md` if adding a new category

## References

- [Mastra Documentation](https://mastra.ai/docs)
- [Mastra GitHub](https://github.com/mastra-ai/mastra)
- [AI SDK Documentation](https://sdk.vercel.ai/docs)
- [Anthropic Prompt Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)

## License

MIT
