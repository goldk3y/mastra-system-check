---
title: Mastra Entry Point Configuration
impact: CRITICAL
impactDescription: Mastra server won't start, agents not registered
tags: entry, index, mastra, configuration, export
category: config
---

## Mastra Entry Point Configuration

**Impact: CRITICAL (Mastra server won't start, agents not registered)**

Mastra requires a properly configured entry point file that exports a Mastra
instance. The CLI and Studio look for this file to discover and run your
agents, workflows, and tools.

### What to Check

- Entry file exists at `src/mastra/index.ts`
- File exports a `Mastra` instance (named `mastra`)
- All agents, workflows, and tools are registered
- Export is named (not default export)

### Incorrect Configuration

```typescript
// src/mastra/index.ts - MISSING EXPORT
import { Mastra } from "@mastra/core";

const mastra = new Mastra({
  agents: { myAgent },
});

// Missing export! Mastra CLI can't find the instance
```

```typescript
// src/mastra/index.ts - DEFAULT EXPORT (not recommended)
import { Mastra } from "@mastra/core";

export default new Mastra({
  agents: { myAgent },
});

// Default export may cause issues with some tooling
```

```typescript
// src/index.ts - WRONG LOCATION
// Mastra CLI expects src/mastra/index.ts, not src/index.ts
```

### Correct Configuration

```typescript
// src/mastra/index.ts
import { Mastra } from "@mastra/core";
import { LibSQLStore } from "@mastra/libsql";
import { weatherAgent } from "./agents/weather-agent";
import { dataWorkflow } from "./workflows/data-workflow";
import { searchTool } from "./tools/search-tool";

export const mastra = new Mastra({
  storage: new LibSQLStore({
    id: "mastra-storage",
    url: process.env.DATABASE_URL || "file:./mastra.db",
  }),
  agents: { weatherAgent },
  workflows: { dataWorkflow },
  tools: { searchTool },
});
```

### Project Structure

```
src/
└── mastra/
    ├── index.ts          <- Entry point (exports mastra)
    ├── agents/
    │   └── weather-agent.ts
    ├── workflows/
    │   └── data-workflow.ts
    └── tools/
        └── search-tool.ts
```

### How to Fix

1. Create `src/mastra/index.ts` if it doesn't exist
2. Import and instantiate `Mastra` from `@mastra/core`
3. Register all agents, workflows, and tools
4. Add named export: `export const mastra = new Mastra({...})`
5. Run `npm run dev` to verify Studio loads correctly

### Verification

```bash
# Start development server
npm run dev

# Should see output like:
# Mastra Studio running at http://localhost:4111
# Registered agents: weatherAgent
# Registered workflows: dataWorkflow
```

### Reference

- [Project Structure](https://mastra.ai/docs/v1/getting-started/project-structure)
- [Configuration Reference](https://mastra.ai/reference/v1/configuration)
