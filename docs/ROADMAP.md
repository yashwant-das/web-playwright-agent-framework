# Roadmap

SPP prioritizes simplicity, verification-first development, and practical automation workflows. Roadmap items should improve usability and operational maturity without increasing architectural complexity.

## v2.1 — Operational Maturity

Purpose: Improve onboarding, adoption, and automation maturity without changing protocol architecture.

### GitHub Actions Verification Workflow

- **Priority:** High
- **Goal:** Provide a minimal GitHub Actions workflow that executes `npm install`, `npm run lint`, and `npm test` on pull requests and pushes.
- **Notes:** Keep implementation lightweight and maintain SPP simplicity.

### Environment Configuration Support

- **Priority:** High
- **Goal:** Introduce environment-based configuration (e.g., `BASE_URL`).
- **Deliverables:** `.env.example` and README guidance to improve adoption and onboarding.

### Node Runtime Declaration

- **Priority:** Medium
- **Goal:** Declare supported Node.js versions (e.g., `node >=18`).
- **Purpose:** Reduce onboarding friction.

### Dependency Refresh

- **Priority:** Medium
- **Goal:** Review and upgrade Playwright, Clipboardy, and supporting tooling only when justified.
- **Notes:** Avoid dependency churn and preserve framework stability.

## Backlog

### Task Frontmatter Validation

- **Priority:** Medium
- **Goal:** Validate required task metadata before activation.
- **Why it matters:** Prevent confusing task activation behavior due to invalid YAML or missing required fields.

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
