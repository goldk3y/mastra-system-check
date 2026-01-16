---
title: Set Observability Service Name
impact: MEDIUM
impactDescription: Traces unnamed, hard to filter in monitoring tools
tags: observability, service, naming, identification
category: observability
conditional: true
appliesWhen: telemetry/observability is configured in Mastra instance
---

## Set Observability Service Name

**Impact: MEDIUM (Traces unnamed, hard to filter in monitoring tools)**

**This check only applies if you have enabled observability/telemetry.** If you're not using observability features, this check can be skipped.

When observability is enabled, the `serviceName` identifies your application in observability data. Without it, traces appear under a generic name, making it difficult to filter and analyze.

### When This Check Applies

- You have `telemetry` or `observability` configured in Mastra
- Skip this check if you're not using observability

### What to Check

- serviceName is explicitly set
- Name uniquely identifies the service
- Name is consistent across deployments
- Name follows organizational naming conventions

### Incorrect Configuration

```typescript
// Missing service name
export const mastra = new Mastra({
  observability: {
    enabled: true,
    // No serviceName! Will use default "unknown-service"
  },
});

// Generic/unhelpful names
export const mastra = new Mastra({
  observability: {
    enabled: true,
    serviceName: "app",        // Too generic
    // or
    serviceName: "service-1",  // Not descriptive
    // or
    serviceName: "test",       // Used in production!
  },
});

// Inconsistent naming
// Server 1: serviceName: "mastra-app"
// Server 2: serviceName: "mastra_app"
// Server 3: serviceName: "MastraApp"
// All appear as different services!
```

### Correct Configuration

```typescript
import { Mastra } from "@mastra/core";

// Clear, descriptive service name
export const mastra = new Mastra({
  observability: {
    enabled: true,
    serviceName: "customer-support-bot",  // Descriptive and unique
  },
});

// Environment-aware naming
export const mastra = new Mastra({
  observability: {
    enabled: true,
    serviceName: `mastra-${process.env.SERVICE_NAME || "default"}`,
    // Results in: "mastra-customer-support" etc.
  },
});

// With environment suffix for separation
export const mastra = new Mastra({
  observability: {
    enabled: true,
    serviceName: process.env.NODE_ENV === "production"
      ? "customer-support-bot"
      : `customer-support-bot-${process.env.NODE_ENV}`,
    // Production: "customer-support-bot"
    // Staging: "customer-support-bot-staging"
    // Dev: "customer-support-bot-development"
  },
});
```

### Service Naming Conventions

```typescript
// Pattern: {team}-{domain}-{function}
// Examples:
"platform-auth-api"
"platform-auth-worker"
"ecommerce-orders-api"
"ecommerce-orders-processor"
"support-chat-bot"
"support-ticket-classifier"

// Pattern: {product}-{component}
"myapp-web-api"
"myapp-background-jobs"
"myapp-ai-agents"

// Pattern: {environment}-{service} (if needed in name)
"prod-customer-bot"
"staging-customer-bot"
```

### Additional Service Attributes

```typescript
export const mastra = new Mastra({
  observability: {
    enabled: true,
    serviceName: "customer-support-bot",

    // Additional attributes for filtering
    attributes: {
      "service.version": process.env.APP_VERSION || "unknown",
      "service.environment": process.env.NODE_ENV || "development",
      "service.team": "platform",
      "deployment.region": process.env.AWS_REGION || "unknown",
    },
  },
});
```

### Microservices Architecture

```typescript
// When you have multiple Mastra services

// Service 1: Customer Support Bot
export const supportMastra = new Mastra({
  observability: {
    enabled: true,
    serviceName: "support-bot",
    attributes: {
      "service.type": "agent",
      "service.domain": "customer-support",
    },
  },
});

// Service 2: Sales Assistant
export const salesMastra = new Mastra({
  observability: {
    enabled: true,
    serviceName: "sales-assistant",
    attributes: {
      "service.type": "agent",
      "service.domain": "sales",
    },
  },
});

// Service 3: Data Processing Workflows
export const dataMastra = new Mastra({
  observability: {
    enabled: true,
    serviceName: "data-processor",
    attributes: {
      "service.type": "workflow",
      "service.domain": "analytics",
    },
  },
});
```

### Querying by Service Name

```typescript
// In your monitoring tool, filter by service name
// Example: Grafana/Tempo query
// {service.name="customer-support-bot"}

// Example: Datadog search
// service:customer-support-bot

// Example: programmatic query
const traces = await mastra.observability.getTraces({
  filters: {
    serviceName: "customer-support-bot",
    startTime: Date.now() - 3600000,  // Last hour
  },
});
```

### How to Fix

1. Set `serviceName` in observability config
2. Choose descriptive, unique name for your service
3. Follow organizational naming conventions
4. Keep naming consistent across all instances
5. Add additional attributes for better filtering
6. Document the naming convention for team

### Reference

- [Observability Configuration](https://mastra.ai/docs/v1/observability/overview)
- [OpenTelemetry Resource Conventions](https://opentelemetry.io/docs/specs/semconv/resource/)
