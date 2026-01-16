---
title: Rule Title Here
impact: CRITICAL | HIGH | MEDIUM-HIGH | MEDIUM | LOW
impactDescription: Brief description of impact when violated
tags: tag1, tag2, tag3
category: config | agent | workflow | context | prompt | memory | tool | observability | security | optimization
---

## Rule Title Here

**Impact: LEVEL (impact description)**

Brief explanation of why this check matters and what problems it prevents.

### What to Check

Description of what the system check should verify:
- Specific condition 1
- Specific condition 2
- Specific condition 3

### Incorrect Configuration

```typescript
// Bad example with explanation of why it's wrong
import { Mastra } from "@mastra/core";

// Problem: Description of the issue
const example = new Mastra({
  // Problematic configuration here
});
```

### Correct Configuration

```typescript
// Good example with explanation of why it's correct
import { Mastra } from "@mastra/core";
import { LibSQLStore } from "@mastra/libsql";

// Solution: Description of the fix
const example = new Mastra({
  // Correct configuration here
});
```

### How to Fix

1. Step-by-step remediation instruction
2. Second step if needed
3. Third step if needed
4. Verification step

### Reference

- [Mastra Documentation Link](https://mastra.ai/docs/v1/...)
- [Additional Reference](https://...)
