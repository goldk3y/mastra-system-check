---
title: Configure Observability Exporters
impact: MEDIUM
impactDescription: No external monitoring, missing production visibility
tags: observability, exporters, monitoring, production
category: observability
conditional: true
appliesWhen: telemetry/observability is enabled and you want external monitoring
---

## Configure Observability Exporters

**Impact: MEDIUM (No external monitoring, missing production visibility)**

**This check only applies if you're using observability and want external monitoring.** If you're not using observability features, or local storage is sufficient, this check can be skipped.

For production systems with observability enabled, data should be exported to external monitoring services for alerting, dashboards, and long-term retention.

### When This Check Applies

- You have observability/telemetry enabled
- You want to send traces to external services (Datadog, Grafana, etc.)
- Skip this check if you're not using observability or only need local traces

### What to Check

- At least one exporter is configured for production
- Exporter endpoint is reachable
- Authentication is properly configured
- Export frequency is appropriate
- Errors in export are handled/logged

### Incorrect Configuration

```typescript
// Production with no exporters - limited visibility
export const mastra = new Mastra({
  storage: new LibSQLStore({ /* ... */ }),
  observability: {
    enabled: true,
    serviceName: "production-app",
    // No exporters! Data only in local storage
  },
});

// Exporter with wrong credentials
export const mastra = new Mastra({
  observability: {
    enabled: true,
    exporters: [
      new OTLPExporter({
        endpoint: "https://otel.example.com",
        // Missing or wrong auth - will fail silently
      }),
    ],
  },
});
```

### Correct Configuration

```typescript
import { Mastra } from "@mastra/core";
import {
  OTLPExporter,
  ConsoleExporter,
} from "@mastra/core/observability";

// Development configuration
const devObservability = {
  enabled: true,
  serviceName: "my-app-dev",
  exporters: [
    // Console for local debugging
    new ConsoleExporter({ pretty: true }),
  ],
};

// Production configuration
const prodObservability = {
  enabled: true,
  serviceName: process.env.SERVICE_NAME || "my-app-prod",
  exporters: [
    // OTLP exporter for external services
    new OTLPExporter({
      endpoint: process.env.OTLP_ENDPOINT,
      headers: {
        Authorization: `Bearer ${process.env.OTLP_API_KEY}`,
      },
    }),
  ],
  sampling: {
    rate: 0.1,  // 10% sampling in production
  },
};

export const mastra = new Mastra({
  storage: new LibSQLStore({ /* ... */ }),
  observability: process.env.NODE_ENV === "production"
    ? prodObservability
    : devObservability,
});
```

### Common Exporter Configurations

```typescript
// OpenTelemetry Protocol (OTLP) - Generic
new OTLPExporter({
  endpoint: "https://otel-collector.example.com:4318",
  headers: { "api-key": process.env.OTEL_API_KEY },
  protocol: "http/protobuf",  // or "grpc"
});

// Datadog
new OTLPExporter({
  endpoint: "https://trace.agent.datadoghq.com",
  headers: {
    "DD-API-KEY": process.env.DD_API_KEY,
  },
});

// New Relic
new OTLPExporter({
  endpoint: "https://otlp.nr-data.net:4317",
  headers: {
    "api-key": process.env.NEW_RELIC_LICENSE_KEY,
  },
});

// Honeycomb
new OTLPExporter({
  endpoint: "https://api.honeycomb.io",
  headers: {
    "x-honeycomb-team": process.env.HONEYCOMB_API_KEY,
  },
});

// Grafana Cloud
new OTLPExporter({
  endpoint: process.env.GRAFANA_OTLP_ENDPOINT,
  headers: {
    Authorization: `Basic ${Buffer.from(
      `${process.env.GRAFANA_INSTANCE_ID}:${process.env.GRAFANA_API_KEY}`
    ).toString("base64")}`,
  },
});
```

### Multiple Exporters

```typescript
// Export to multiple destinations
export const mastra = new Mastra({
  observability: {
    enabled: true,
    serviceName: "my-app",
    exporters: [
      // Primary: Send to monitoring service
      new OTLPExporter({
        endpoint: process.env.PRIMARY_OTLP_ENDPOINT,
        headers: { "api-key": process.env.PRIMARY_API_KEY },
      }),

      // Backup: Send to secondary for redundancy
      new OTLPExporter({
        endpoint: process.env.BACKUP_OTLP_ENDPOINT,
        headers: { "api-key": process.env.BACKUP_API_KEY },
      }),

      // Debug: Console output in staging
      ...(process.env.NODE_ENV === "staging"
        ? [new ConsoleExporter({ pretty: true })]
        : []),
    ],
  },
});
```

### Exporter Error Handling

```typescript
// Custom exporter with error handling
class ResilientExporter {
  private exporter: OTLPExporter;
  private failureCount = 0;
  private maxFailures = 5;

  constructor(config: OTLPConfig) {
    this.exporter = new OTLPExporter(config);
  }

  async export(spans: Span[]) {
    try {
      await this.exporter.export(spans);
      this.failureCount = 0;  // Reset on success
    } catch (error) {
      this.failureCount++;
      console.error(`Export failed (${this.failureCount}/${this.maxFailures}):`, error);

      if (this.failureCount >= this.maxFailures) {
        console.error("Exporter circuit breaker triggered");
        // Implement fallback: local storage, queue, etc.
      }
    }
  }
}
```

### Verifying Exporter Works

```typescript
// Test exporter connectivity
async function verifyExporter() {
  const testSpan = {
    traceId: crypto.randomUUID(),
    spanId: crypto.randomUUID(),
    name: "test-span",
    startTime: Date.now(),
    endTime: Date.now() + 100,
    attributes: { test: true },
  };

  try {
    await exporter.export([testSpan]);
    console.log("Exporter test: SUCCESS");
    return true;
  } catch (error) {
    console.error("Exporter test: FAILED", error);
    return false;
  }
}

// Run on startup
verifyExporter().then(ok => {
  if (!ok) {
    console.warn("Observability exporter may not be working!");
  }
});
```

### How to Fix

1. Choose an observability backend (Datadog, New Relic, Grafana, etc.)
2. Configure appropriate exporter with endpoint and auth
3. Set environment variables for credentials
4. Test exporter connectivity in staging
5. Add error handling/alerting for export failures
6. Consider multiple exporters for redundancy

### Reference

- [Observability Exporters](https://mastra.ai/docs/v1/observability/exporters)
- [OpenTelemetry Protocol](https://opentelemetry.io/docs/specs/otlp/)
