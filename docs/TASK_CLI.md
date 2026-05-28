# Agentic Playwright Task CLI

`scripts/task.ts` is the local CLI that moves Markdown task files through the framework lifecycle. Use this document when you need exact command behavior, status transitions, dependency rules, verification details, and failure recovery guidance.

> [!NOTE]
> For first-time setup and the end-to-end user workflow, start with [README.md](../README.md). This file is the deeper task runner reference.

## What the Runner Owns

The runner is responsible for:

- Reading task files from `tasks/*.md`.
- Activating eligible tasks.
- Running lint and targeted Playwright verification.
- Moving task status between `TODO`, `IN_PROGRESS`, `BLOCKED`, and `DONE`.
- Writing command output to `logs/last_run.log`.
- Printing handoff prompts for AI-assisted implementation or repair.

The runner does not write Page Objects, generate tests, inspect web pages, or replace human review. Those responsibilities stay with the human and AI assistant workflow.

## Required Task File Shape

Task files must live in [../tasks](../tasks) and follow this filename format:

```text
T-###_description-in-kebab-case.md
```

Example:

```text
tasks/T-011_checkout-tax.md
```

The runner derives the task ID from the filename prefix, such as `T-011`.

Required frontmatter for normal use:

```yaml
---
id: "T-011"
title: "Verify Checkout Tax"
status: "TODO"
owner: "AI"
priority: "High"
dependsOn: []
---
```

For verification, the task body should include a context line for the test file:

```markdown
- **Test File:** `tests/checkout.spec.ts`
```

> [!WARNING]
> If the `- **Test File:**` line is missing, the runner cannot verify an active task and will mark it `BLOCKED`.

## Commands

| Command | Purpose |
| :--- | :--- |
| `npm run task` | Open the interactive task menu. |
| `npm run task next` | Activate or resume the next eligible task. |
| `npm run task T-011` | Activate, verify, or re-verify one task. |

## Interactive Menu

Run:

```bash
npm run task
```

The terminal opens an interactive menu similar to:

```text
┌  Agentic Playwright Task CLI
│
◆  What would you like to do?
│  ● Activate or resume next task
│  ○ Verify current active task
│  ○ Show task board
│  ○ Show blocked tasks
└
```

Available menu actions:

| Action | Behavior |
| :--- | :--- |
| `Activate or resume next task` | Selects the current active task first, then the next dependency-ready `TODO` task. |
| `Verify current active task` | Runs verification for the current active task. |
| `Show task board` | Prints all task IDs, titles, and statuses. |
| `Show blocked tasks` | Lists tasks currently marked `BLOCKED`. |

## Task Selection Order

`npm run task next` selects work in this order:

1. First `IN_PROGRESS` task.
2. First `BLOCKED` task.
3. First `TODO` task whose dependencies are complete.

This order keeps unfinished work ahead of new work.

> [!IMPORTANT]
> If a task has unmet dependencies, `next` skips it. If you target that task directly, the runner exits with an unmet dependency message.

## Lifecycle Transitions

| Current Status | Runner Behavior | Success Outcome | Failure Outcome |
| :--- | :--- | :--- | :--- |
| `TODO` | Updates status and prints an AI handoff prompt. | `IN_PROGRESS` | Not applicable |
| `IN_PROGRESS` | Runs lint and the declared task test. | `DONE` | `BLOCKED` |
| `BLOCKED` | Re-runs lint and the declared task test after fixes. | `DONE` | `BLOCKED` |
| `DONE` | Re-runs lint and the declared task test if present. | `DONE` | `BLOCKED` |

On successful verification, the runner also changes unchecked checklist items from `- [ ]` to `- [x]`.

## Verification Gates

For `IN_PROGRESS` and `BLOCKED` tasks, the runner runs:

```bash
npm run lint
npm test <declared-test-file>
```

`npm run lint` runs:

```bash
npm run lint:code
npm run lint:md
```

`lint:code` applies ESLint v9 flat config to Page Objects and specs. It includes:

- `playwright/no-raw-locators` for `.spec.ts` files.
- `playwright/prefer-web-first-assertions`.
- JSDoc checks for Page Object properties.

`lint:md` runs markdownlint across Markdown files.

## Dependency Rules

A task can declare dependencies in frontmatter:

```yaml
dependsOn: ["T-007"]
```

Rules:

- Every dependency must already be `DONE` before the task can activate.
- `dependsOn: []` means the task can run independently.
- `npm run task next` skips dependency-blocked `TODO` tasks.
- `npm run task <TASK_ID>` fails fast if that task has unmet dependencies.

## Logs and Failure Diagnosis

The runner writes command output to:

```text
logs/last_run.log
```

The log includes:

- the command that ran,
- stdout,
- stderr,
- lint failures,
- Playwright failures,
- missing task metadata errors.

> [!CAUTION]
> When a task becomes `BLOCKED`, read `logs/last_run.log` before changing code. The terminal intentionally shows a short summary; the log has the useful details.

## Blocked Task Repair Flow

Use this loop when verification fails:

1. Open `logs/last_run.log`.
2. Identify whether the failure is lint, Markdown, selector, test, environment, or missing task metadata.
3. Ask the AI assistant to fix the specific failure.
4. Re-run `npm run task <TASK_ID>`.
5. Repeat until the task moves to `DONE`.

If the failure is selector-related, prefer Playwright MCP exploration before changing Page Object selectors.

## AI Handoff Prompts

When a task is activated or blocked, the runner prints a concise prompt for the AI assistant.

Example blocked prompt:

```text
Task T-011 is BLOCKED.
Ask your AI Assistant to read logs/last_run.log and fix the issues.
```

The prompt is intentionally short. Pair it with:

- the task file in `tasks/`,
- [../AGENTS.md](../AGENTS.md),
- `logs/last_run.log` when blocked.

## MCP Relationship

The repository includes a task lifecycle MCP server in `mcp/server.ts`.

| Tool | Purpose |
| :--- | :--- |
| `activateTask` | Moves a dependency-ready task to `IN_PROGRESS`. |
| `verifyTask` | Marks a task `DONE` manually. |
| `getBlockedTasks` | Lists tasks blocked by unmet dependencies. |

> [!WARNING]
> `verifyTask` bypasses automated lint and Playwright verification. Use `npm run task <TASK_ID>` for normal completion.

The official Playwright MCP server has a different purpose: browser exploration and selector verification. It should be used by AI agents before writing or changing selectors when page structure is unknown.

## Common Runner Problems

### `Task <ID> not found`

Check that:

- the task file is in `tasks/`,
- the filename starts with the task ID,
- the ID uses the `T-###` format.

### `No Test File found`

Add or correct this line in the task body:

```markdown
- **Test File:** `tests/example.spec.ts`
```

### Task Remains `BLOCKED`

Read `logs/last_run.log`. Do not rely on the short terminal output.

### `next` Does Not Pick the Task You Expected

Check for:

- another task already marked `IN_PROGRESS`,
- another task marked `BLOCKED`,
- unmet `dependsOn` entries,
- filename ordering among eligible `TODO` tasks.

## Related Files

| File | Purpose |
| :--- | :--- |
| [../README.md](../README.md) | End-user setup and workflow guide. |
| [../AGENTS.md](../AGENTS.md) | AI implementation rules and completion format. |
| [../tasks/template.md](../tasks/template.md) | Template for new tasks. |
| [../scripts/task.ts](../scripts/task.ts) | Task runner implementation. |
| [../scripts/check-selectors.ts](../scripts/check-selectors.ts) | Page Object selector health check. |
| [../mcp/server.ts](../mcp/server.ts) | Custom task lifecycle MCP server. |
