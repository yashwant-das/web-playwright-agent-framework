# Agentic Playwright Task CLI

`scripts/task.ts` is the local CLI that moves Markdown task files through the framework lifecycle. Use this document when you need exact command behavior, status transitions, dependency rules, verification details, and failure recovery guidance.

> [!NOTE]
> For first-time setup, MCP server configuration, and the end-to-end user workflow, start with [README.md](../README.md). This file is the deeper task runner reference.

## What the Runner Owns

The runner is responsible for:

- Reading task files from `tasks/*.md`.
- Activating eligible tasks.
- Running lint and targeted Playwright verification.
- Moving task status between `TODO`, `IN_PROGRESS`, `BLOCKED`, and `DONE`.
- Writing command output to `logs/last_run.log`.
- Printing handoff prompts for AI-assisted implementation or repair.

The runner does not write Page Objects, generate tests, inspect web pages, or replace human review. Those responsibilities stay with the human and AI assistant workflow.

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

## Task Selection Order

`npm run task next` selects work in this order, evaluated alphabetically by filename:

1. Existing `IN_PROGRESS` task.
2. Existing `BLOCKED` task.
3. Next dependency-ready `TODO` task.

*Note: YAML frontmatter fields like `priority` are ignored by the runner.*

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
>
> The runner overwrites `logs/last_run.log` on every verification run. Agents can safely read the entire file to diagnose the immediate failure without parsing historical runs.

## Blocked Task Repair Flow

Use this loop when verification fails:

1. Open `logs/last_run.log`.
2. Identify whether the failure is lint, Markdown, selector, test, environment, or missing task metadata.
3. Ask the AI assistant to fix the specific failure.
4. Re-run `npm run task <TASK_ID>`.
5. Repeat until the task moves to `DONE`.

If the failure is selector-related, prefer Playwright MCP exploration before changing Page Object selectors.

## AI Handoff Prompts

When a task is activated or blocked, the runner prints a concise prompt for the AI assistant. This prompt is designed for you to copy and paste directly into your AI assistant's chat window.

Example blocked prompt:

```text
Copy and paste this prompt to your AI assistant:
"Task T-011 is now BLOCKED. Verification failed.

First, read AGENTS.md — it defines the full lifecycle protocol you must follow.
Then check logs/last_run.log to diagnose the failure.
Fix the issue and retry: npm run task T-011"
```

The prompt contains the exact context (task ID and current state) the AI needs. Pair it with:

- the task file in `tasks/`,
- [../AGENTS.md](../AGENTS.md) (the AI will read the MCP pre-flight check before proceeding),
- `logs/last_run.log` when blocked.

> [!NOTE]
> This manual copy-pasting applies to the CLI runner. The MCP tools communicate directly with the AI and provide context without requiring human intervention.

## MCP Relationship

The repository includes two MCP servers, each serving a distinct purpose.

### Official Playwright MCP

The official [Playwright MCP](https://playwright.dev/docs/getting-started-mcp) server lets AI agents inspect live browser pages, explore DOM structure, and verify selectors. It is the recommended tool for selector discovery before writing or updating Page Objects.

> [!IMPORTANT]
> The framework protocol requires MCP-first exploration. AI agents should use Playwright MCP to verify selectors before implementation, especially for unknown or external pages. See [AGENTS.md](../AGENTS.md) for the full rule set.

### Task Framework MCP

The custom task framework MCP server in `mcp/server.ts` exposes task lifecycle tools:

| Tool | Purpose |
| :--- | :--- |
| `list_tasks` | Lists all tasks with status and dependency info. Accepts an optional status filter. |
| `activate_task` | Moves a dependency-ready `TODO` task to `IN_PROGRESS`. Enforces dependency checks. |
| `verify_task` | Runs automated quality gates (`npm run lint` + Playwright tests) and marks the task `DONE` on success, or `BLOCKED` on failure. Logs full output to `logs/last_run.log`. |
| `get_unmet_dependencies` | Lists tasks that cannot be activated because they are waiting on unmet dependencies. |

> [!NOTE]
> `verify_task` enforces the same strict quality gates as `npm run task <TASK_ID>`: ESLint linting and Playwright test execution. Both the MCP server and the CLI runner are functionally equivalent for verification.

### Automated Setup Prompt

If you want the AI assistant to configure both MCP servers for you automatically, copy and paste the following prompt into your AI assistant's chat window:

```text
Please register the following MCP servers in my IDE's MCP configuration file:

1. **Official Playwright MCP** (for browser exploration and selector verification):
   "command": "npx",
   "args": ["-y", "@playwright/mcp@latest"]

2. **Task Framework MCP** (for task lifecycle management):
   - Determine the absolute path to `mcp/server.ts` in the current workspace.
   "command": "npx",
   "args": ["tsx", "<ABSOLUTE_PATH_TO_mcp/server.ts>"],
   "env": { "NODE_OPTIONS": "--disable-warning=DEP0205" }

For Antigravity IDE, the config file is at `~/.gemini/antigravity-ide/mcp_config.json`.
For Cursor, the config file is at `.cursor/mcp.json` in the project root.

Read the existing config if it exists, or initialize a new one. Write the updated config and confirm once completed.
```

### Manual Configuration

Add both servers to your IDE's MCP configuration file:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    },
    "task-framework": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/repo/mcp/server.ts"],
      "env": {
        "NODE_OPTIONS": "--disable-warning=DEP0205"
      }
    }
  }
}
```

Replace `/absolute/path/to/repo/` with the actual path to your cloned repository.

> [!CAUTION]
> Without the Playwright MCP server, your AI assistant cannot inspect pages or verify selectors before writing tests. This leads to fragile selectors and avoidable test failures. Do not skip this configuration.

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

### MCP Server Does Not Start

Test the task framework MCP server manually:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1"}}}' | npm run mcp
```

If the server responds with a JSON-RPC result containing `serverInfo`, it is working. If your IDE still does not show the MCP tools, restart the IDE session after updating the MCP configuration.

## Related Files

| File | Purpose |
| :--- | :--- |
| [../README.md](../README.md) | End-user setup, MCP configuration, and workflow guide. |
| [../AGENTS.md](../AGENTS.md) | AI implementation rules and completion format. |
| [../tasks/template.md](../tasks/template.md) | Template for new tasks. |
| [../scripts/task.ts](../scripts/task.ts) | Task runner implementation. |
| [../scripts/check-selectors.ts](../scripts/check-selectors.ts) | Page Object selector health check. |
| [../mcp/server.ts](../mcp/server.ts) | Custom task lifecycle MCP server. |
