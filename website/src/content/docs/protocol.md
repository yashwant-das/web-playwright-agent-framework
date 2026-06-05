---
title: Protocol
description: The architectural source of truth for the Smart Playwright Protocol.
---

# Architecture & Design Principles

## Vision

Smart Playwright Protocol (SPP) is a lightweight, protocol-driven workflow for AI-assisted Playwright automation.

The goal is not autonomous testing.

The goal is to create a repeatable, reviewable, and verifiable workflow that allows humans and AI assistants to collaborate on test automation with predictable outcomes.

SPP prioritizes:

- Simplicity
- Correctness
- Verification
- Traceability
- Human review

SPP intentionally avoids complex orchestration, multi-agent systems, autonomous execution loops, and heavy infrastructure.

---

## Core Philosophy

The protocol is the product.

Everything else exists to support the protocol.

The framework is built around a single workflow:

```text
Select
  ↓
Understand
  ↓
Explore
  ↓
Plan
  ↓
Implement
  ↓
Verify
  ├─ PASS → DONE
  └─ FAIL → BLOCKED → Recover → Verify
```

This mirrors how experienced SDETs approach automation work.

---

## Architecture

### Core Components

#### 1. Protocol

The protocol defines how work is performed.

Responsibilities:

- Define workflow
- Define task states
- Define quality expectations
- Define recovery process

The protocol remains stable over time.

---

#### 2. Task Files

Task files are Markdown documents stored in:

```text
tasks/ 
```

Task files are the source of truth for work.

Responsibilities:

- Define objective
- Define context
- Define acceptance criteria
- Track status

Tasks are intentionally file-based.

Benefits:

- Human readable
- AI readable
- Git friendly
- No database required

---

#### 3. CLI

The CLI is the operational interface.

Responsibilities:

- Create tasks
- Activate tasks
- Verify tasks
- Display task board
- Generate AI handoff prompts
- Generate recovery prompts

The CLI owns workflow execution.

---

#### 4. Verification Layer

Verification determines task completion.

Responsibilities:

- Lint validation
- Test execution
- Failure reporting
- Log generation

Verification is the final authority.

A task is never considered complete without successful verification.

---

#### 5. Browser Exploration Layer

Playwright MCP is the recommended mechanism for browser exploration and selector validation when selector discovery, UI investigation, or application exploration is required.
The protocol requires validation against reality, not a specific tool.

---

#### 6. Lifecycle Management Layer (Optional)

The SPP Lifecycle MCP (located in mcp/server.ts) is optional and experimental.
It provides programmatic task activation and verification for AI-enabled IDEs.
Most users will interact directly with task files and the CLI.

---

## Workflow

### Phase 1 — Select

Choose the next eligible task.

```text
TODO → IN_PROGRESS 
```

Requirements:

- Dependencies satisfied
- No active task already in progress

---

### Phase 2 — Understand

Before implementation begins, you MUST complete the "Understanding" section in the task file.

Understand:

- Feature
- Expected behavior
- Business outcome
- Risk

Required output:

```markdown
Feature:
Expected Behavior:
Business Outcome:
Risk:
```

Implementation should never begin before this section is populated.

**Note:** Explicit user approval of the Understanding phase is not required to move to Phase 3 (Explore) unless specifically requested.

---

### Phase 3 — Explore

Validate assumptions.

Examples:

- Review page structure
- Verify selectors
- Inspect application behavior
- Review existing Page Objects

Recommended tool:

Playwright MCP

Goal:

Understand the application before modifying code.

---

### Phase 4 — Plan

Create a lightweight implementation plan.

Example:

```markdown
Implementation Plan
1. Create CheckoutPage
2. Add tax selectors
3. Add assertions
4. Verify acceptance criteria
```

The plan should remain concise.

The purpose is clarity, not documentation.

---

### Phase 5 — Implement

Create or modify:

- Page Objects
- Playwright tests
- Supporting utilities

Requirements:

- **Page Objects**: Own all selectors and user actions.
- **Tests**: Focus on behavior and business outcomes.
- **AAA Structure**: Tests should follow Arrange → Act → Assert.
- **Readable**: Code remains maintainable and reviewable.

---

### Phase 6 — Verify

Execute verification.

Minimum requirements:

```bash
npm run lint
npm run task <TASK_ID> 
```

Verification validates:

- Code quality
- Test execution
- Acceptance criteria coverage

Outcome:

```text
IN_PROGRESS → DONE 
```

or

```text
IN_PROGRESS → BLOCKED 
```

---

### Phase 7 — Recover

When verification fails:

1. Read logs.
2. Identify the root cause.
3. Confirm the root cause using available evidence.
4. Apply the smallest possible fix.
5. Re-run verification.

Repeat until verification succeeds.

Evidence always precedes fixes.

---

## Task States

Only four task states exist.

### TODO

Task has not started.

---

### IN_PROGRESS

Task is actively being implemented.

---

### BLOCKED

Task cannot continue or verification failed.

A block reason should be recorded.

#### Block Reason Definitions

| Block Reason | Meaning |
|---|---|
| `dependency` | Waiting on another task to be completed. |
| `requirement` | Missing clarification or business requirement. |
| `selector` | UI locator issue preventing progress. |
| `verification` | Linting or test verification failure. |
| `environment` | Tooling, infrastructure, browser, or setup issue. |

Example:

```yaml
status: BLOCKED
blockReason: verification 
```

---

### DONE

Verification completed successfully.

All acceptance criteria satisfied.

---

## Task Structure

Standard task format:

```markdown
---
id: T-011
title: Verify Checkout Tax
status: TODO
dependsOn: []
---

# Understanding

Feature:
Expected Behavior:
Business Outcome:
Risk:

# Context

- **Page Object:**
- **Test File:**
- **URL:**

# Implementation Plan

1.
2.
3.

# Acceptance Criteria

- [ ]
- [ ]
```

---

## Quality Gates

### Pre-Commit

Fast, local validation to prevent common mistakes.

Required:

- **lint-staged**: Runs project-specific linting on changed files.
- **Selector Health Check**: Validates ARIA-first strategies in Page Objects.
- **Focused Test Protection**: Blocks `test.only()` and `describe.only()`.
- **Hard Wait Protection**: Blocks `page.waitForTimeout()`.
- **Skipped Test Detection**: Warns on `test.skip()`.

### Verification Gates

Required:

```bash
npm run lint
npm run task <TASK_ID> 
```

---

### Required Rules

#### No Raw Locators in Specs

Selectors belong in Page Objects.

---

#### No Hard Waits

Disallow:

```typescript
page.waitForTimeout(...) 
```

Use proper synchronization mechanisms.

---

#### No Accidental Test Isolation

Disallow:

```typescript
test.only(...) describe.only(...) 
```

---

#### No Committed Skipped Tests

Skipped tests generate warnings and should be documented when intentionally committed.

---

#### Business Assertions Required

Every test must validate at least one business outcome from the task acceptance criteria.

Assertions should validate outcomes rather than merely element visibility.

**Weak Assertion:**

```typescript
await expect(button).toBeVisible();
```

**Strong Business Assertions:**

```typescript
await expect(total).toHaveText("$54.99");
await expect(cartCount).toHaveText("3");
await expect(orderStatus).toContainText("Completed");
```

Passing tests without meaningful business validation are considered low quality.

---

## Agent Completion Protocol

The verification step is the final authority in SPP.

AI assistants must not claim a task is complete unless verification has successfully passed.

### 1. Ready for Verification

Use this response when implementation is finished but verification has not yet been executed.

```text
Task <TASK_ID> Ready for Verification
Summary:
✅ Created <PageObject> with JSDoc
✅ Created <TestFile> verifying <Requirement>
✅ No raw locators used

Next Step:
Run:
npm run task <TASK_ID>
```

### 2. Complete Response

Use this response only when verification has successfully passed.

```text
Task <TASK_ID> Complete ✓
Summary:
✅ Created <PageObject> with JSDoc
✅ Created <TestFile> verifying <Requirement>
✅ No raw locators used
✅ lint passed
✅ tests passed
All acceptance criteria met.
Recommended Next Step:
Review the generated changes and commit if satisfied.
```

### 3. Blocked Response

Use this response when implementation cannot proceed or verification fails.

```text
Task <TASK_ID> Blocked
Summary:
- <What was attempted>
- <What failed or remains incomplete>
- <Relevant command that failed>

Recovery Required:
1. Review logs/last_run.log
2. Identify the root cause
3. Apply the smallest possible fix
4. Retry:
npm run task <TASK_ID>
```
