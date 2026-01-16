---
title: PII Detection for Sensitive Applications
impact: MEDIUM
impactDescription: Personal data exposed, compliance violations
tags: security, pii, privacy, compliance
category: security
---

## PII Detection for Sensitive Applications

**Impact: MEDIUM (Personal data exposed, compliance violations)**

Applications handling personal data should detect and protect PII
(Personally Identifiable Information) to comply with privacy regulations
(GDPR, CCPA) and protect users. Without PII detection, sensitive data
may be stored, logged, or exposed inappropriately.

### What to Check

- PII detection is enabled for applications handling user data
- Detected PII is redacted or handled appropriately
- PII is not stored in plain text in logs or memory
- Compliance requirements are met for your jurisdiction

### Incorrect Configuration

```typescript
// No PII handling - stores everything as-is
const unsafeMemory = new Memory({
  storage: new LibSQLStore({ id: "storage", url: "file:./memory.db" }),
  options: { lastMessages: 50 },
  // Stores SSNs, credit cards, etc. in plain text!
});

// Logging PII
const unsafeTool = createTool({
  id: "user-lookup",
  execute: async ({ email }) => {
    console.log(`Looking up user: ${email}`);  // PII in logs!
    const user = await db.users.findByEmail(email);
    console.log(`Found user: ${JSON.stringify(user)}`);  // Full user data in logs!
    return user;
  },
});
```

### Correct Configuration

```typescript
import { Memory, MemoryProcessor } from "@mastra/memory";

// Comprehensive PII detection patterns
const piiPatterns = [
  // Personal identifiers
  { type: "SSN", pattern: /\b\d{3}-\d{2}-\d{4}\b/g },
  { type: "SSN_NO_DASH", pattern: /\b\d{9}\b/g },

  // Contact information
  { type: "EMAIL", pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g },
  { type: "PHONE_US", pattern: /\b(\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g },
  { type: "PHONE_INTL", pattern: /\+\d{1,3}[-.\s]?\d{1,14}/g },

  // Financial
  { type: "CREDIT_CARD", pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g },
  { type: "BANK_ACCOUNT", pattern: /\b\d{8,17}\b/g },

  // Government IDs
  { type: "PASSPORT", pattern: /\b[A-Z]{1,2}\d{6,9}\b/g },
  { type: "DRIVERS_LICENSE", pattern: /\b[A-Z]{1,2}\d{5,8}\b/g },

  // Health
  { type: "HEALTH_ID", pattern: /\b\d{3}-\d{2}-\d{4}[A-Z]?\b/g },

  // Addresses (simplified)
  { type: "ZIP_CODE", pattern: /\b\d{5}(-\d{4})?\b/g },
];

// PII detection and redaction
function detectAndRedactPII(text: string): {
  redacted: string;
  detected: Array<{ type: string; count: number }>;
} {
  let redacted = text;
  const detected: Array<{ type: string; count: number }> = [];

  for (const { type, pattern } of piiPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      detected.push({ type, count: matches.length });
      redacted = redacted.replace(pattern, `[${type}]`);
    }
  }

  return { redacted, detected };
}

// PII processor for memory
const piiProcessor: MemoryProcessor = {
  id: "pii-detection",
  processMessages: async (messages) => {
    return messages.map(msg => {
      const { redacted, detected } = detectAndRedactPII(msg.content);

      if (detected.length > 0) {
        console.log(`PII detected in message: ${detected.map(d => `${d.type}(${d.count})`).join(", ")}`);
      }

      return {
        ...msg,
        content: redacted,
        metadata: {
          ...msg.metadata,
          piiDetected: detected.length > 0,
          piiTypes: detected.map(d => d.type),
        },
      };
    });
  },
};

// Memory with PII protection
const protectedMemory = new Memory({
  storage: new LibSQLStore({ id: "storage", url: "file:./memory.db" }),
  processors: [
    piiProcessor,  // First! Before any other processing
    // ... other processors
  ],
  options: { lastMessages: 50 },
});
```

### Safe Logging Practices

```typescript
// Utility for safe logging
function safeLog(message: string, data: any) {
  const sanitized = sanitizeForLogging(data);
  console.log(message, sanitized);
}

function sanitizeForLogging(obj: any): any {
  if (typeof obj === "string") {
    return detectAndRedactPII(obj).redacted;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeForLogging);
  }

  if (typeof obj === "object" && obj !== null) {
    const sanitized: any = {};
    const sensitiveKeys = ["email", "phone", "ssn", "password", "token", "secret"];

    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = sanitizeForLogging(value);
      }
    }
    return sanitized;
  }

  return obj;
}

// Usage
safeLog("User lookup result:", user);
// Output: User lookup result: { name: "John", email: "[REDACTED]", ... }
```

### Agent with PII Awareness

```typescript
const piiAwareAgent = new Agent({
  id: "pii-aware-agent",
  model: "openai/gpt-4o",
  memory: protectedMemory,
  instructions: `
    You are a helpful assistant.

    ## Privacy Guidelines
    - Never ask users for sensitive information like SSN, credit card numbers, or passwords
    - If a user shares sensitive information, acknowledge it but don't repeat it
    - Remind users not to share sensitive personal information in chat
    - If you need to reference previously shared information, use generic terms

    ## Example
    User: "My SSN is 123-45-6789"
    You: "I've noted that information. For security, please avoid sharing sensitive
    details like Social Security numbers in chat. How can I help you today?"
  `,
});
```

### Compliance Considerations

| Regulation | Requirements | Implementation |
|------------|--------------|----------------|
| GDPR | Data minimization, right to erasure | PII detection, deletion API |
| CCPA | Disclosure, opt-out | PII inventory, preference center |
| HIPAA | PHI protection | Health data detection, encryption |
| PCI DSS | Card data protection | Card number masking, no storage |

### PII Inventory Tracking

```typescript
// Track what PII is being processed
interface PIIInventory {
  messageId: string;
  timestamp: Date;
  piiTypes: string[];
  redacted: boolean;
}

const piiInventory: PIIInventory[] = [];

const inventoryProcessor: MemoryProcessor = {
  id: "pii-inventory",
  processMessages: async (messages) => {
    for (const msg of messages) {
      const { detected } = detectAndRedactPII(msg.content);

      if (detected.length > 0) {
        piiInventory.push({
          messageId: msg.id,
          timestamp: new Date(),
          piiTypes: detected.map(d => d.type),
          redacted: true,
        });
      }
    }
    return messages;
  },
};

// Report generation for compliance
function generatePIIReport(): string {
  const summary = piiInventory.reduce((acc, item) => {
    for (const type of item.piiTypes) {
      acc[type] = (acc[type] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return JSON.stringify({
    totalMessages: piiInventory.length,
    byType: summary,
    reportDate: new Date().toISOString(),
  }, null, 2);
}
```

### How to Fix

1. Implement PII detection patterns for your data types
2. Add PII processor as first processor in memory
3. Replace logging with safe logging utilities
4. Add privacy guidelines to agent instructions
5. Track PII for compliance reporting
6. Provide data deletion capability for right-to-erasure

### Reference

- [GDPR Article 5](https://gdpr-info.eu/art-5-gdpr/)
- [OWASP Data Privacy](https://owasp.org/www-project-top-10-privacy-risks/)
