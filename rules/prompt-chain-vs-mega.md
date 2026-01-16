---
title: Chain Prompts vs Mega Prompts
impact: HIGH
impactDescription: Overloaded context, confused behavior, poor performance
tags: prompt, chaining, composition, decomposition
category: prompt
---

## Chain Prompts vs Mega Prompts

**Impact: HIGH (Overloaded context, confused behavior, poor performance)**

A single massive prompt trying to handle everything often performs worse than
decomposed, specialized prompts chained together. Complex tasks benefit from
being broken into focused steps, each with clear purpose and context.

### What to Check

- Prompts are not trying to do too many distinct tasks
- Complex workflows are decomposed into steps
- Each agent/step has a focused purpose
- Handoffs between steps are clear
- Specialized agents handle specialized tasks

### Incorrect Configuration

```typescript
// Mega-prompt trying to do everything
const megaPromptAgent = new Agent({
  id: "mega-agent",
  model: "openai/gpt-4o",
  instructions: `
    You are an all-purpose assistant that handles:

    ## Customer Support
    - Answer product questions
    - Process refunds
    - Handle complaints
    - Manage subscriptions
    [... 2000 tokens of support instructions ...]

    ## Sales
    - Qualify leads
    - Present products
    - Handle objections
    - Close deals
    [... 2000 tokens of sales instructions ...]

    ## Technical Support
    - Debug issues
    - Explain error codes
    - Guide installations
    - Troubleshoot performance
    [... 2000 tokens of tech support instructions ...]

    ## Content Creation
    - Write blog posts
    - Create social media content
    - Draft emails
    - Generate reports
    [... 2000 tokens of content instructions ...]

    Determine what the user needs and respond appropriately.
  `,
  tools: { /* 30 different tools */ },
});
// Problems:
// - 8000+ token prompt
// - Confused about which role to play
// - Tool selection errors
// - Inconsistent behavior
```

### Correct Configuration

```typescript
// Decomposed into specialized agents
const supportAgent = new Agent({
  id: "support-agent",
  model: "openai/gpt-4o",
  instructions: `
    You are a customer support specialist focused on helping customers
    with their accounts, orders, and general inquiries.

    ## Responsibilities
    - Answer product and policy questions
    - Process refunds and returns
    - Handle complaints with empathy
    - Manage subscription changes

    ## Escalation
    - Technical issues → Transfer to tech support
    - Sales inquiries → Transfer to sales team
    - Complex complaints → Escalate to supervisor
  `,
  tools: { searchPolicies, processRefund, manageSubscription },
});

const techSupportAgent = new Agent({
  id: "tech-support-agent",
  model: "openai/gpt-4o",
  instructions: `
    You are a technical support specialist helping users resolve
    technical issues with our products.

    ## Responsibilities
    - Debug error messages
    - Guide through installations
    - Troubleshoot performance issues
    - Explain technical concepts clearly

    ## Escalation
    - Account issues → Transfer to customer support
    - Bug reports → Create engineering ticket
  `,
  tools: { searchDocs, runDiagnostics, createBugReport },
});

// Router to direct to appropriate specialist
const routerAgent = new Agent({
  id: "router-agent",
  model: "openai/gpt-4o-mini",  // Cheaper model for routing
  instructions: `
    You are a routing assistant. Analyze the user's request and determine
    which specialist should handle it:

    - support: Account, billing, refunds, general questions
    - tech: Errors, installation, performance, debugging
    - sales: Pricing, features, purchasing, upgrades
    - content: Writing, marketing, documentation

    Respond with just the department name.
  `,
});
```

### Workflow Decomposition

```typescript
// Instead of one mega-workflow
const megaWorkflow = createWorkflow({
  id: "mega-process",
  // ... tries to do everything
});

// Decompose into focused workflows
const intakeWorkflow = createWorkflow({
  id: "intake",
  inputSchema: z.object({ request: z.string() }),
  outputSchema: z.object({
    category: z.string(),
    priority: z.string(),
    summary: z.string(),
  }),
})
  .then(classifyStep)
  .then(summarizeStep)
  .commit();

const resolutionWorkflow = createWorkflow({
  id: "resolution",
  inputSchema: z.object({
    category: z.string(),
    summary: z.string(),
    context: z.any(),
  }),
  outputSchema: z.object({ resolution: z.string() }),
})
  .then(routeToSpecialist)
  .then(resolveIssue)
  .then(verifyResolution)
  .commit();

const followUpWorkflow = createWorkflow({
  id: "follow-up",
  inputSchema: z.object({
    resolution: z.string(),
    customerId: z.string(),
  }),
  outputSchema: z.object({ completed: z.boolean() }),
})
  .then(notifyCustomer)
  .then(logInteraction)
  .then(scheduleSurvey)
  .commit();
```

### When to Decompose

| Indicator | Action |
|-----------|--------|
| Prompt > 3000 tokens | Consider decomposition |
| > 5 distinct responsibilities | Definitely decompose |
| > 10 tools | Split by function area |
| Inconsistent behavior | Likely overloaded |
| Wrong tool selection | Roles are confused |

### Chaining Strategies

```typescript
// Sequential chain for complex process
async function handleCustomerRequest(request: string) {
  // Step 1: Route to appropriate agent
  const routing = await routerAgent.generate(request);
  const department = routing.text.trim();

  // Step 2: Handle with specialist
  const specialists = {
    support: supportAgent,
    tech: techSupportAgent,
    sales: salesAgent,
  };

  const specialist = specialists[department];
  if (!specialist) {
    return "I'll connect you with a human agent.";
  }

  // Step 3: Get resolution
  const resolution = await specialist.generate(request);

  // Step 4: Quality check
  const quality = await qualityAgent.generate(
    `Review this response for helpfulness: ${resolution.text}`
  );

  return resolution.text;
}
```

### Agent Network Pattern

```typescript
// Agents that can delegate to each other
import { AgentNetwork } from "@mastra/core/network";

const network = new AgentNetwork({
  agents: {
    router: routerAgent,
    support: supportAgent,
    tech: techSupportAgent,
    sales: salesAgent,
  },
  defaultAgent: "router",
  handoffRules: {
    support: ["tech", "sales"],
    tech: ["support"],
    sales: ["support"],
  },
});

// Network handles routing and handoffs
const response = await network.generate(userRequest);
```

### Decomposition Guidelines

| Task Complexity | Approach |
|-----------------|----------|
| Simple, single-purpose | One focused agent |
| Multi-step, single domain | Workflow with steps |
| Multi-domain | Agent network with specialists |
| Complex + dynamic routing | Router + specialist agents |

### How to Fix

1. Identify if current prompt is overloaded (>3000 tokens, >5 roles)
2. List distinct responsibilities in current prompt
3. Group related responsibilities into specialist agents
4. Create router agent for directing requests
5. Define clear handoff criteria between specialists
6. Test that decomposed system handles edge cases

### Reference

- [Agent Networks](https://mastra.ai/docs/v1/agents/agent-network)
- [Workflows](https://mastra.ai/docs/v1/workflows/overview)
- [Anthropic: Effective Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
