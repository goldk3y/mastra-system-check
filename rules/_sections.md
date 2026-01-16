---
title: Section Definitions
description: Defines the hierarchy and metadata for all check categories
---

# Section Definitions

## 1. Configuration & Setup (config-)

- **Impact Level:** CRITICAL
- **Prefix:** `config-`
- **Description:** Core configuration checks that prevent system failures
- **Rule Count:** 6

## 2. Agent Configuration (agent-)

- **Impact Level:** HIGH
- **Prefix:** `agent-`
- **Description:** Agent setup and configuration validation
- **Rule Count:** 6

## 3. Workflow Configuration (workflow-)

- **Impact Level:** HIGH
- **Prefix:** `workflow-`
- **Description:** Workflow definition and connection checks
- **Rule Count:** 6

## 4. Context & Data Flow (context-)

- **Impact Level:** HIGH
- **Prefix:** `context-`
- **Description:** RequestContext typing and propagation validation
- **Rule Count:** 8

## 5. Prompt Engineering & Token Efficiency (prompt-)

- **Impact Level:** HIGH
- **Prefix:** `prompt-`
- **Description:** Prompt structure, clarity, and token optimization
- **Rule Count:** 10

## 6. Memory Configuration (memory-)

- **Impact Level:** MEDIUM-HIGH
- **Prefix:** `memory-`
- **Description:** Memory setup, storage, and recall configuration
- **Rule Count:** 6

## 7. Tool Configuration (tool-)

- **Impact Level:** MEDIUM
- **Prefix:** `tool-`
- **Description:** Tool definitions, schemas, and error handling
- **Rule Count:** 6

## 8. Observability & Evals (observability-) - CONDITIONAL

- **Impact Level:** MEDIUM
- **Prefix:** `observability-`
- **Description:** Tracing, logging, and scorer configuration
- **Rule Count:** 6
- **Conditional:** All rules in this section only apply if observability/telemetry or evals are configured. Skip this section if not using these features.

## 9. Security & Guardrails (security-)

- **Impact Level:** MEDIUM
- **Prefix:** `security-`
- **Description:** Authentication, CORS, and content safety
- **Rule Count:** 6

## 10. Performance & Optimization (optimization-)

- **Impact Level:** LOW
- **Prefix:** `optimization-`
- **Description:** Performance tuning and cost optimization
- **Rule Count:** 6
