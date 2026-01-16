---
name: mastra-system-check
description: >
  Comprehensive system check for Mastra AI agent projects. Use this skill when
  setting up a new Mastra project, debugging configuration issues, reviewing
  code for best practices, or preparing for production deployment. Triggers on
  tasks involving Mastra configuration, agent setup, workflow debugging, memory
  configuration, tool creation, prompt engineering, or deployment preparation.
license: MIT
metadata:
  author: stan
  x: "https://x.com/goldkey"
  version: "1.0.0"
---

# Mastra System Check

This skill performs comprehensive validation of Mastra AI agent projects,
checking for configuration errors, missing best practices, and potential
issues across 10 categories with 66 individual checks.

## How It Works

1. **Analyze Project Structure** - Verify standard Mastra directory layout
2. **Check Configuration** - Validate mastra instance, storage, and environment
3. **Validate Agents** - Review agent configurations, prompts, and tool bindings
4. **Verify Workflows** - Check workflow definitions and step connections
5. **Assess Memory** - Validate memory configuration and storage
6. **Review Context Flow** - Ensure RequestContext propagates correctly
7. **Analyze Prompts** - Check token efficiency and prompt structure
8. **Review Security** - Check for security best practices
9. **Evaluate Observability** - Verify tracing and logging setup
10. **Report Findings** - Provide prioritized list of issues with fixes

## Usage

When reviewing a Mastra project, the agent should:

1. Read the project's `src/mastra/index.ts` entry point
2. Scan for agent, workflow, and tool definitions
3. Analyze agent instructions for prompt engineering issues
4. Check environment variables and configuration
5. Report issues by priority (CRITICAL > HIGH > MEDIUM > LOW)
6. Provide specific code fixes for each issue found

## Output Format

For each issue found, report:

```
[PRIORITY] Check ID: Rule Name
- Issue: Description of the problem
- Location: File path and line number
- Fix: Specific code change to resolve
- Reference: Link to Mastra documentation
```

## Triggering Conditions

This skill activates when:
- Setting up a new Mastra project
- Debugging Mastra configuration errors
- Reviewing Mastra code for best practices
- Preparing a Mastra project for production
- Troubleshooting agent, workflow, or memory issues
- Optimizing prompts for token efficiency
- Analyzing agent instructions for clarity

## Check Categories

| Priority | Category | Rules | Focus |
|----------|----------|-------|-------|
| CRITICAL | Configuration | 6 | Storage, env vars, TypeScript config |
| HIGH | Agents | 6 | Model format, memory, tool registration |
| HIGH | Workflows | 6 | .commit(), schemas, suspend/resume |
| HIGH | Context & Data Flow | 8 | RequestContext typing, propagation |
| HIGH | Prompt Engineering | 10 | Token efficiency, structure, examples |
| MEDIUM-HIGH | Memory | 6 | Storage, threads, vector stores |
| MEDIUM | Tools | 6 | Schemas, descriptions, error handling |
| MEDIUM | Observability* | 6 | Tracing, scorers, exporters |
| MEDIUM | Security | 6 | Auth, CORS, PII detection |
| LOW | Optimization | 6 | Model selection, caching, timeouts |

*\*Observability checks are **conditional** - they only apply if the user has enabled observability/telemetry or is using evals. If these features aren't configured, skip the entire observability section.*

## Handling Conditional Checks

Some rules are conditional and only apply in specific situations:

1. **Observability section** - Only check if `telemetry` or `observability` is configured in Mastra instance, or if evals/scorers are being used
2. If a feature isn't being used, don't flag its absence as an issue
3. Ask the user if you're unsure whether they intend to use a feature

**Example:** If a project has no `telemetry` config and no scorers, don't report "missing observability storage" - the user simply isn't using observability.

## Quick Reference

For the complete guide with all 66 rules, detailed examples, and fixes,
read the `AGENTS.md` file in this skill directory.
