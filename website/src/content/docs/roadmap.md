---
title: Roadmap
description: Future enhancements and planned improvements for SPP.
---


SPP prioritizes simplicity, verification-first development, and practical automation workflows. Roadmap items should improve usability and operational maturity without increasing architectural complexity.

## v2.1 — Operational Maturity & Stability (Completed)

Purpose: Improve onboarding, stability, and AI agent experience without changing protocol architecture.

### Task Frontmatter Validation

- **Status:** COMPLETED
- **Goal:** Validate required task metadata (ID, title, status) before processing.
- **Why it matters:** Prevents undefined task states and crashes due to malformed YAML.

### Improved AI Diagnostics

- **Status:** COMPLETED
- **Goal:** Include log excerpts directly in MCP verification failure responses.
- **Why it matters:** Reduces AI tool-call overhead and improves recovery speed.

### CLI & Protocol Hardening

- **Status:** COMPLETED
- **Goal:** Implement graceful YAML parsing, clipboard failure fallback, and synchronized commit conventions.

### GitHub Actions Verification Workflow

- **Status:** COMPLETED
- **Goal:** Provide a minimal GitHub Actions workflow that executes `npm install`, `npm run lint`, and `npm test` on pull requests and pushes.

### Environment Configuration Support

- **Status:** COMPLETED
- **Goal:** Introduce environment-based configuration (e.g., `BASE_URL`).
- **Deliverables:** `.env.example` and README guidance to improve adoption and onboarding.

### Node Runtime Declaration

- **Status:** COMPLETED
- **Goal:** Declare supported Node.js versions (e.g., `node >=18`).
- **Purpose:** Reduce onboarding friction.

### Dependency Refresh

- **Status:** COMPLETED
- **Goal:** Review and upgrade Playwright, Clipboardy, and supporting tooling only when justified.
- **Notes:** Avoid dependency churn and preserve framework stability.

## Backlog

### Configurable Quality Gates

- **Priority:** Low
- **Goal:** Allow teams to enable or disable selected verification gates.
- **Notes:** Maintain current defaults.

### Priority-Aware Task Selection

- **Priority:** Low
- **Goal:** Allow optional priority-based task ordering.
- **Notes:** SPP should continue to prefer simple next-task execution by default.

## Non-Goals

The following are intentionally outside the scope of SPP:

- Multi-agent systems
- Autonomous planning
- Vector databases
- Self-healing architectures
- Distributed task orchestration
- Database-backed task storage
- Cloud task management
- AI memory systems
