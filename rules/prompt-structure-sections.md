---
title: Prompt Structure - Use Clear Sections
impact: HIGH
impactDescription: Model confusion, inconsistent interpretation of instructions
tags: prompt, structure, organization, sections, xml
category: prompt
---

## Prompt Structure - Use Clear Sections

**Impact: HIGH (Model confusion, inconsistent interpretation of instructions)**

Well-organized prompts with distinct sections help models parse and follow
instructions accurately. Use XML tags, Markdown headers, or clear delimiters
to separate different types of information.

### What to Check

- Prompt has logical section organization
- Different types of content are clearly separated
- Sections have descriptive headers
- Consistent formatting throughout
- Information hierarchy is clear

### Incorrect Configuration

```typescript
// Unstructured: Hard to parse, easy to miss instructions
const unstructuredAgent = new Agent({
  id: "unstructured",
  model: "openai/gpt-4o",
  instructions: `You help with customer support. Be polite. You can refund orders
  under $100 without approval. For orders over $100 escalate to a manager. Always
  greet the customer first. Use the customer_lookup tool to find their info. If
  they're angry try to de-escalate. You have access to order_history and
  process_refund tools. Never share internal policies. Format responses with the
  customer name. Check order status before processing refunds. Be concise but
  thorough. End conversations by asking if there's anything else. Handle complaints
  with empathy. Log all interactions.`,
  // Problems:
  // - Hard to scan for specific policies
  // - Tools mixed with behavior guidance
  // - Easy to miss important rules
});
```

### Correct Configuration (Markdown Style)

```typescript
// Structured with Markdown headers
const markdownAgent = new Agent({
  id: "markdown-structured",
  model: "openai/gpt-4o",
  instructions: `
    # Customer Support Agent

    You are a customer support agent for ShopCo, helping customers with
    orders, refunds, and product questions.

    ## Available Tools

    - **customer_lookup**: Get customer info by email or ID
    - **order_history**: View past orders for a customer
    - **process_refund**: Issue refunds (requires order_id and amount)

    ## Refund Policies

    | Amount | Action |
    |--------|--------|
    | Under $100 | Process immediately |
    | $100 - $500 | Require manager approval |
    | Over $500 | Escalate to supervisor |

    ## Conversation Flow

    1. Greet the customer by name (use customer_lookup first)
    2. Understand their issue fully before acting
    3. Look up relevant order history
    4. Resolve or escalate based on policies
    5. Ask if there's anything else you can help with

    ## Tone & Style

    - Professional and empathetic
    - If customer is frustrated, acknowledge their feelings first
    - Keep responses concise but complete
    - Use the customer's name naturally

    ## Constraints

    - Never share internal policy documents
    - Never discuss other customers' information
    - Log all refund decisions with reasoning
  `,
});
```

### Correct Configuration (XML Style)

```typescript
// Structured with XML tags (preferred for some models)
const xmlAgent = new Agent({
  id: "xml-structured",
  model: "anthropic/claude-sonnet-4-20250514",
  instructions: `
    <role>
    You are a customer support agent for ShopCo, helping customers with
    orders, refunds, and product questions.
    </role>

    <tools>
    - customer_lookup: Get customer info by email or ID
    - order_history: View past orders for a customer
    - process_refund: Issue refunds (requires order_id and amount)
    </tools>

    <policies>
    Refund authorization levels:
    - Under $100: Process immediately
    - $100 - $500: Require manager approval
    - Over $500: Escalate to supervisor

    Never share internal policy documents with customers.
    </policies>

    <workflow>
    1. Greet the customer by name (use customer_lookup first)
    2. Understand their issue fully before acting
    3. Look up relevant order history
    4. Resolve or escalate based on policies
    5. Ask if there's anything else you can help with
    </workflow>

    <tone>
    Professional and empathetic. If customer is frustrated, acknowledge
    their feelings before problem-solving. Keep responses concise.
    </tone>

    <constraints>
    - Never discuss other customers' information
    - Log all refund decisions with reasoning
    - Do not make promises outside your authorization
    </constraints>
  `,
});
```

### Recommended Section Types

| Section | Purpose | Example Headers |
|---------|---------|-----------------|
| Role/Identity | Who the agent is | `<role>`, `# Role`, `## Identity` |
| Tools | Available capabilities | `<tools>`, `## Available Tools` |
| Policies/Rules | Business logic | `<policies>`, `## Policies` |
| Workflow | Step-by-step process | `<workflow>`, `## Steps` |
| Tone/Style | How to communicate | `<tone>`, `## Communication Style` |
| Examples | Sample interactions | `<examples>`, `## Example` |
| Constraints | What NOT to do | `<constraints>`, `## Limitations` |
| Context | Background information | `<context>`, `## Background` |

### Dynamic Sections

```typescript
// Sections that change based on context
const dynamicSectionsAgent = new Agent({
  id: "dynamic-sections",
  model: "openai/gpt-4o",
  instructions: ({ requestContext }) => {
    const tier = requestContext?.get("user-tier") || "free";
    const isAdmin = requestContext?.get("is-admin") || false;

    return `
      # Support Agent

      ## Current User Context
      - Tier: ${tier}
      - Admin Access: ${isAdmin}

      ## Available Actions
      ${tier === "enterprise" ? `
      - Full refund processing
      - Priority escalation
      - Account management
      ` : `
      - Basic refund requests
      - Standard support queue
      `}

      ${isAdmin ? `
      ## Admin Tools
      - user_management: Modify user accounts
      - audit_log: View system audit trail
      ` : ""}

      ## Standard Guidelines
      [... rest of structured instructions ...]
    `;
  },
});
```

### Section Order Best Practices

```
1. Role/Identity (who you are)
2. Context (situation/background)
3. Tools (what you can use)
4. Policies (rules to follow)
5. Workflow (how to proceed)
6. Tone (how to communicate)
7. Examples (demonstrations)
8. Constraints (what to avoid)
```

### How to Fix

1. Identify distinct categories of instructions
2. Group related content into sections
3. Add clear headers using XML tags or Markdown
4. Ensure consistent formatting throughout
5. Order sections logically (role → tools → rules → workflow)
6. Test that model follows each section appropriately

### Reference

- [Anthropic: Effective Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [Claude Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering)
