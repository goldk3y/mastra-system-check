---
title: Tool ID Format and Naming
impact: MEDIUM
impactDescription: Tool conflicts, confusing LLM, poor maintainability
tags: tool, id, naming, conventions
category: tool
---

## Tool ID Format and Naming

**Impact: MEDIUM (Tool conflicts, confusing LLM, poor maintainability)**

Tool IDs should be unique, descriptive, and follow consistent naming
conventions. Poor IDs cause conflicts, confuse the LLM about tool purpose,
and make the codebase harder to maintain.

### What to Check

- Tool IDs are unique across the entire project
- IDs are descriptive of tool function
- Consistent naming convention is used
- IDs don't use reserved/confusing names
- IDs match the tool's file name (for discoverability)

### Incorrect Configuration

```typescript
// Generic/confusing IDs
const tool1 = createTool({ id: "tool1", ... });
const tool2 = createTool({ id: "do-thing", ... });
const helper = createTool({ id: "helper", ... });

// Duplicate IDs
// file1.ts
const searchTool = createTool({ id: "search", ... });
// file2.ts
const anotherSearch = createTool({ id: "search", ... });  // Conflict!

// Inconsistent naming
const mixedNaming = createTool({ id: "getUserInfo", ... });      // camelCase
const mixedNaming2 = createTool({ id: "get-user-info", ... });   // kebab-case
const mixedNaming3 = createTool({ id: "get_user_info", ... });   // snake_case

// Reserved/confusing names
const reserved = createTool({ id: "function", ... });  // JS keyword
const confusing = createTool({ id: "async", ... });    // JS keyword
```

### Correct Configuration

```typescript
// Clear, descriptive, consistent kebab-case IDs
const searchProducts = createTool({
  id: "search-products",
  description: "Search the product catalog",
  // ...
});

const getOrderStatus = createTool({
  id: "get-order-status",
  description: "Get the current status of an order",
  // ...
});

const sendNotification = createTool({
  id: "send-notification",
  description: "Send a notification to a user",
  // ...
});

const calculateShipping = createTool({
  id: "calculate-shipping",
  description: "Calculate shipping costs for an order",
  // ...
});
```

### Naming Convention Patterns

```typescript
// Pattern: action-resource
"search-products"    // action: search, resource: products
"get-user"           // action: get, resource: user
"create-order"       // action: create, resource: order
"update-profile"     // action: update, resource: profile
"delete-item"        // action: delete, resource: item
"send-email"         // action: send, resource: email
"calculate-tax"      // action: calculate, resource: tax
"validate-address"   // action: validate, resource: address

// Pattern: action-resource-qualifier (for specificity)
"search-products-by-category"
"get-user-by-email"
"send-email-notification"
"calculate-shipping-estimate"
```

### Domain-Prefixed IDs

```typescript
// For larger projects, prefix with domain
const paymentTools = {
  processPayment: createTool({ id: "payment-process", ... }),
  refundPayment: createTool({ id: "payment-refund", ... }),
  checkStatus: createTool({ id: "payment-check-status", ... }),
};

const inventoryTools = {
  checkStock: createTool({ id: "inventory-check-stock", ... }),
  reserveItems: createTool({ id: "inventory-reserve", ... }),
  releaseReservation: createTool({ id: "inventory-release", ... }),
};

const userTools = {
  getProfile: createTool({ id: "user-get-profile", ... }),
  updatePreferences: createTool({ id: "user-update-preferences", ... }),
  listOrders: createTool({ id: "user-list-orders", ... }),
};
```

### File/ID Alignment

```typescript
// src/mastra/tools/search-products.ts
export const searchProducts = createTool({
  id: "search-products",  // Matches file name!
  // ...
});

// src/mastra/tools/get-order-status.ts
export const getOrderStatus = createTool({
  id: "get-order-status",  // Matches file name!
  // ...
});
```

### ID Validation

```typescript
// Utility to validate tool IDs
function validateToolId(id: string): boolean {
  // Must be kebab-case
  const kebabCase = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

  if (!kebabCase.test(id)) {
    console.error(`Tool ID '${id}' must be kebab-case`);
    return false;
  }

  // Must not exceed length limit
  if (id.length > 64) {
    console.error(`Tool ID '${id}' exceeds 64 characters`);
    return false;
  }

  // Must not use reserved words
  const reserved = ["function", "async", "await", "class", "tool"];
  if (reserved.includes(id)) {
    console.error(`Tool ID '${id}' is a reserved word`);
    return false;
  }

  return true;
}
```

### Checking for Duplicates

```typescript
// At registration time, check for duplicates
import { mastra } from "./index";

const allTools = Object.values(mastra.tools);
const ids = allTools.map(t => t.id);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

if (duplicates.length > 0) {
  throw new Error(`Duplicate tool IDs found: ${duplicates.join(", ")}`);
}
```

### ID Best Practices

| Do | Don't |
|----|-------|
| `search-products` | `searchProducts`, `tool1` |
| `get-user-profile` | `getUserProfile`, `user` |
| `send-email-notification` | `sendEmail`, `email` |
| `calculate-shipping-cost` | `calcShip`, `shipping` |

### How to Fix

1. Choose a naming convention (recommend kebab-case)
2. Use action-resource pattern for clarity
3. Add domain prefix for large projects
4. Align file names with tool IDs
5. Check for duplicate IDs at registration
6. Rename tools to follow convention

### Reference

- [Tool Creation](https://mastra.ai/docs/v1/tools/create-tool)
- [Project Structure](https://mastra.ai/docs/v1/getting-started/project-structure)
