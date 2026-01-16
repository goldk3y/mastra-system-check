---
title: Observability Storage Required
impact: MEDIUM
impactDescription: Traces not persisted, no historical debugging, lost metrics
tags: observability, storage, traces, persistence
category: observability
conditional: true
appliesWhen: telemetry or observability is configured in Mastra instance
---

## Observability Storage Required

**Impact: MEDIUM (Traces not persisted, no historical debugging, lost metrics)**

**This check only applies if you have enabled observability/telemetry.** If you're not using observability features, this check can be skipped - observability is entirely optional.

When observability is enabled, traces require storage to persist data for debugging and analysis. Without storage, observability data is lost when the process ends.

### When This Check Applies

- You have `telemetry` or `observability` configured in Mastra
- You want to persist traces for debugging
- Skip this check if you don't need observability

### What to Check

- Storage is configured when observability is enabled
- Traces are being saved to storage
- Storage has adequate capacity for trace volume
- Old traces are properly archived/deleted

### Incorrect Configuration

```typescript
// Observability enabled but no storage
export const mastra = new Mastra({
  agents: { myAgent },
  // No storage configured!
  // Traces exist only in memory
});

// Storage for memory but observability disabled
export const mastra = new Mastra({
  storage: new LibSQLStore({ id: "storage", url: "file:./data.db" }),
  agents: { myAgent },
  observability: {
    enabled: false,  // Disabled, no traces at all
  },
});
```

### Correct Configuration

```typescript
import { Mastra } from "@mastra/core";
import { LibSQLStore } from "@mastra/libsql";

export const mastra = new Mastra({
  // Storage for all Mastra features including observability
  storage: new LibSQLStore({
    id: "mastra-storage",
    url: process.env.DATABASE_URL || "file:./mastra.db",
  }),

  agents: { myAgent },

  // Observability configuration
  observability: {
    enabled: true,
    serviceName: "my-mastra-app",

    // Traces will be stored in the configured storage
    sampling: {
      rate: 1.0,  // Sample 100% in development
    },
  },
});
```

### Production Configuration

```typescript
export const mastra = new Mastra({
  storage: new LibSQLStore({
    id: "production-storage",
    url: process.env.TURSO_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  }),

  observability: {
    enabled: true,
    serviceName: process.env.SERVICE_NAME || "mastra-prod",

    // Lower sampling rate for production
    sampling: {
      rate: 0.1,  // Sample 10% of traces
      // Or use adaptive sampling
      // rules: [
      //   { match: { error: true }, rate: 1.0 },  // Always sample errors
      //   { match: { duration: { gt: 5000 } }, rate: 1.0 },  // Slow requests
      //   { match: {}, rate: 0.05 },  // 5% for normal requests
      // ],
    },

    // Export to external services for long-term storage
    exporters: [
      new OTLPExporter({
        endpoint: process.env.OTLP_ENDPOINT,
      }),
    ],
  },
});
```

### Verifying Traces Are Stored

```typescript
// After running some operations
const agent = mastra.getAgent("my-agent");
await agent.generate("Test message");

// Query stored traces
const traces = await mastra.observability.getTraces({
  serviceName: "my-mastra-app",
  limit: 10,
});

console.log(`Found ${traces.length} traces`);
traces.forEach(trace => {
  console.log(`- ${trace.traceId}: ${trace.spans.length} spans`);
});
```

### Storage Capacity Planning

```typescript
// Estimate storage needs
const estimatedDailyRequests = 10000;
const avgSpansPerRequest = 5;
const avgBytesPerSpan = 500;

const dailyStorageBytes = estimatedDailyRequests * avgSpansPerRequest * avgBytesPerSpan;
const monthlyStorageMB = (dailyStorageBytes * 30) / (1024 * 1024);

console.log(`Estimated monthly storage: ${monthlyStorageMB.toFixed(2)} MB`);

// Configure retention
export const mastra = new Mastra({
  storage: new LibSQLStore({ /* ... */ }),
  observability: {
    enabled: true,
    retention: {
      maxAgeDays: 30,      // Delete traces older than 30 days
      maxSizeGB: 10,       // Cap total storage at 10GB
    },
  },
});
```

### How to Fix

1. Add storage configuration to Mastra instance
2. Enable observability with `enabled: true`
3. Set appropriate sampling rate for your environment
4. Configure retention policies to manage storage size
5. Consider external exporters for production long-term storage
6. Verify traces are being stored with test queries

### Reference

- [Observability Overview](https://mastra.ai/docs/v1/observability/overview)
- [Storage Configuration](https://mastra.ai/docs/v1/memory/storage)
