# Smart Playwright Protocol (SPP) v2.0

## Architecture & Design Principles

---

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
Select ↓ Understand ↓ Explore ↓ Plan ↓ Implement ↓ Verify ↓ Recover 
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

Playwright MCP is the **recommended** mechanism for browser exploration and selector validation. The protocol requires validation against reality, not a specific tool.

---

#### 6. Lifecycle Management Layer (Optional)

The **Task Framework MCP** (located in `mcp/server.ts`) is an **optional and experimental** component. It provides tools for programmatic task activation and verification within AI-assisted IDEs. Most users will interact directly with task files and the CLI.

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

Before implementation begins:

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

Implementation should never begin before understanding exists.

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
2. Diagnose root cause.
3. Apply smallest possible fix.
4. Re-run verification.

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

## CLI Responsibilities

The CLI owns execution.

Supported operations:

```text
Create Task
Activate Task
Verify Task
Show Board
Show Blocked Tasks 
```

Future enhancements:

- Clipboard support
- AI handoff prompt generation
- Recovery prompt generation

---

## Commit Conventions

The repository enforces a structured commit message format to ensure history remains readable and compatible with automated tooling.

### Format

```text
<type>(<optional-scope>): <subject>
```

### Supported Types

- **feat**: New feature or capability.
- **fix**: Bug fix or correction.
- **refactor**: Code change that neither fixes a bug nor adds a feature.
- **test**: Adding or updating tests.
- **docs**: Documentation changes.
- **chore**: Maintenance tasks, small cleanups.
- **build**: Dependencies, tooling, package, or infrastructure updates.
- **arch**: Architectural changes or protocol updates.
- **heal**: Selector repair or automation healing.

### Examples

- `feat(cli): add task generator`
- `fix(tasks): handle blocked task parsing`
- `build(deps): upgrade playwright`
- `heal(selectors): repair checkout locator`

---

## SPP v2 Scope

### Included

- **Smart Playwright Protocol**: The structured workflow (Understand -> Explore -> Plan -> Implement -> Verify -> Recover).
- **Markdown Tasks**: File-backed units of work with metadata and status.
- **Task CLI**: Operative tool for task management and verification.
- **Quality Gates**: Automated enforcement of Playwright best practices.
- **Playwright Integration**: Native support for Page Objects and spec verification.

### Excluded

- **Multi-Agent Systems**: SPP is designed for single-actor (Human or AI) task execution.
- **Database Storage**: All state is stored in the filesystem.
- **Autonomous Loops**: Verification and recovery require explicit actor triggers.
- **Complex Integrations**: No native Jira, Slack, or CI dashboarding.

---

## Documentation Structure

The framework maintains five primary documents.

```text
README.md PROTOCOL.md CLI.md ROADMAP.md AGENTS.md 
```

Purpose:

README.md

- onboarding
- quick start
- installation

PROTOCOL.md

- architectural source of truth
- workflow
- states
- rules
- quality gates

CLI.md

- commands
- troubleshooting
- operational behavior

ROADMAP.md

- future enhancements
- planned improvements

AGENTS.md

- lightweight instructions for AI assistants
- references protocol

---

## Non-Goals

SPP intentionally excludes:

- Multi-agent orchestration
- Autonomous execution loops
- Memory systems
- Vector databases
- Knowledge graphs
- Self-healing selectors
- Jira integration
- Complex workflow engines
- Custom task databases

The protocol favors simplicity over automation complexity.

---

## Success Criteria

A task may move to DONE only when:

- Understanding completed
- Exploration completed
- Implementation completed
- Acceptance criteria satisfied
- Lint passes
- Tests pass
- Verification succeeds

Verification remains the final authority.

Code written without successful verification is not considered complete.

---

## Agent Completion Protocol

AI assistants must use the following format when reporting task completion or blocks. This format is recognized by the protocol.

### 1. Success Response

Use this format only when all verification gates pass:

```text
Task <TASK_ID> Complete ✓
Summary:
✅ Created <PageObject> with JSDoc
✅ Created <TestFile> verifying <Requirement>
✅ No raw locators used
✅ lint passed
✅ tests passed
All acceptance criteria met.

👉 Next Step: Run `npm run task <TASK_ID>`
```

### 2. Blocked Response

Use this format when verification fails or the task cannot proceed:

```text
Task <TASK_ID> Blocked
Summary:
- <What was attempted>
- <What failed or remains incomplete>
- <Relevant command that failed>

Required next step:
Read `logs/last_run.log`, fix the issue, and retry `npm run task <TASK_ID>`.
```
