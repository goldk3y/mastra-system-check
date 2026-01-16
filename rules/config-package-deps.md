---
title: Required Package Dependencies
impact: CRITICAL
impactDescription: Import errors, missing functionality
tags: packages, dependencies, npm, installation
category: config
---

## Required Package Dependencies

**Impact: CRITICAL (Import errors, missing functionality)**

Mastra projects require specific packages to be installed. Missing
dependencies cause import errors and prevent the application from running.

### What to Check

- `@mastra/core` is installed (required)
- `zod` version 4+ is installed (required for schemas)
- Storage package is installed if using memory/workflows
- CLI package `mastra` is installed as dev dependency
- All packages use compatible versions (beta tag)

### Incorrect Configuration

```json
// package.json - MISSING DEPENDENCIES
{
  "dependencies": {
    // Missing @mastra/core!
    // Missing zod!
  }
}
```

```json
// package.json - WRONG ZOD VERSION
{
  "dependencies": {
    "@mastra/core": "^0.1.0",
    "zod": "^3.22.0"  // v3 not compatible, need v4+
  }
}
```

```json
// package.json - VERSION MISMATCH
{
  "dependencies": {
    "@mastra/core": "^0.1.0-alpha.1",
    "@mastra/libsql": "^0.2.0-beta.5"  // Mismatched versions
  }
}
```

### Correct Configuration

```json
// package.json
{
  "type": "module",
  "scripts": {
    "dev": "mastra dev",
    "build": "mastra build"
  },
  "dependencies": {
    "@mastra/core": "beta",
    "@mastra/libsql": "beta",
    "zod": "^4"
  },
  "devDependencies": {
    "mastra": "beta",
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0"
  }
}
```

### Common Packages

| Package | Purpose | Required |
|---------|---------|----------|
| `@mastra/core` | Core framework | Yes |
| `zod` | Schema validation | Yes |
| `mastra` | CLI tools | Yes (dev) |
| `@mastra/libsql` | LibSQL storage | If using storage |
| `@mastra/memory` | Memory features | If using memory |
| `@mastra/evals` | Scorers/evals | If using evals |
| `@mastra/voice-*` | Voice features | If using voice |

### How to Fix

1. Check your package.json for missing packages
2. Install required dependencies:

```bash
# Core dependencies
npm install @mastra/core@beta zod@^4

# Dev dependencies
npm install -D mastra@beta typescript @types/node

# Storage (choose one)
npm install @mastra/libsql@beta

# Optional features
npm install @mastra/memory@beta
npm install @mastra/evals@beta
```

3. Ensure all @mastra packages use the same version tag (beta)
4. Run `npm install` to update lock file
5. Restart development server

### Version Compatibility

Always use the same version tag across all Mastra packages:

```bash
# Good - all beta
npm install @mastra/core@beta @mastra/libsql@beta @mastra/memory@beta

# Bad - mixed versions
npm install @mastra/core@latest @mastra/libsql@beta  # AVOID
```

### Reference

- [Manual Installation](https://mastra.ai/docs/v1/getting-started/manual-install)
- [Package Reference](https://mastra.ai/reference/v1)
