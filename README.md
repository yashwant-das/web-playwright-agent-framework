# Agentic Playwright SDET Framework

[![Playwright](https://img.shields.io/badge/Playwright-1.41.0-2ead34?logo=playwright)](https://playwright.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-3178c6?logo=typescript)](https://www.typescriptlang.org)
[![ESLint](https://img.shields.io/badge/ESLint-8.56.0-4b32c3?logo=eslint)](https://eslint.org)
[![Node](https://img.shields.io/badge/Node-18+-339933?logo=nodedotjs)](https://nodejs.org)

**Protocol:** Smart Playwright Protocol v1.0  
**Architecture:** File-backed task lifecycle for Playwright automation  
**Objective:** Keep human-AI test automation work explicit, reviewable, and repeatable.

This framework helps engineers and AI coding assistants build Playwright tests through small Markdown tasks. It combines Page Object conventions, selector documentation, lint rules, task state, and verification logs into one local workflow.

> [!NOTE]
> Start with this README. Use [docs/TASK_CLI.md](docs/TASK_CLI.md) when you need detailed command behavior, lifecycle rules, dependency handling, or troubleshooting notes.

## Documentation Map

| File | Use It For |
| :--- | :--- |
| [README.md](README.md) | First-time setup, daily workflow, framework rules, and common recovery steps. |
| [docs/TASK_CLI.md](docs/TASK_CLI.md) | Detailed task CLI reference, command behavior, lifecycle transitions, logs, and MCP relationship. |
| [AGENTS.md](AGENTS.md) | Mandatory instructions for AI agents implementing tasks. |
| [tasks/template.md](tasks/template.md) | Starting point for new task files. |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Shipped improvements, known gaps, and planned enhancements. |

> [!TIP]
> Keep both `README.md` and `docs/TASK_CLI.md`. The README should remain the practical onboarding guide. The task CLI doc should remain the deeper reference so the README does not become too long.

## How the Framework Works

The framework uses task files as the source of truth:

```text
tasks/T-###_description-in-kebab-case.md
```

Each task moves through this lifecycle:

```text
TODO -> IN_PROGRESS -> DONE
              |
              v
           BLOCKED
```

The normal loop is:

1. Human creates a task in [tasks/](tasks/).
2. Human activates the task with `npm run task next`.
3. AI reads the task and [AGENTS.md](AGENTS.md), then writes Page Objects and specs.
4. Human verifies the task with `npm run task <TASK_ID>`.
5. If verification fails, AI reads `logs/last_run.log`, fixes the issue, and verification is retried.

> [!IMPORTANT]
> The task runner only reads task files from `tasks/`. New task files must follow the `T-###_description-in-kebab-case.md` naming format.

## Prerequisites

Install these before using the framework:

- Node.js 18 or newer.
- npm.
- Playwright browsers, installed during setup.
- An AI coding environment that can read this repository and follow [AGENTS.md](AGENTS.md).
- Optional but recommended: official [Playwright MCP](https://playwright.dev/docs/getting-started-mcp) for selector exploration.

## Installation

Clone the repository, install dependencies, and install Playwright browsers:

```bash
git clone <repository-url>
cd web-playwright-agent-framework
npm install
npx playwright install
```

Optional: configure the commit message template.

```bash
git config commit.template .gitmessage
```

Run a baseline check:

```bash
npm run lint
npm test
```

> [!WARNING]
> If baseline tests fail immediately after cloning, check your Playwright browser installation and environment before creating new tasks.

## Quick Start: Complete One Task

### 1. Create a Task File

Create a Markdown file in [tasks/](tasks/) using this format:

```text
T-###_description-in-kebab-case.md
```

Example:

```text
tasks/T-011_checkout-tax.md
```

Use [tasks/template.md](tasks/template.md) as the starting point. At minimum, include:

- YAML frontmatter with `status: "TODO"`.
- A clear objective.
- A `Context` section with Page Object, test file, and URL details.
- An implementation plan.
- Acceptance criteria.

Example context block:

```markdown
## Context

- **Page Object:** `pages/CheckoutPage.ts`
- **Test File:** `tests/checkout.spec.ts`
- **Url:** `/checkout-step-one.html`
```

> [!IMPORTANT]
> The runner looks for the `- **Test File:**` line when verifying a task. Keep that line accurate.

### 2. Activate the Task

Run:

```bash
npm run task next
```

The runner selects work in this order:

1. Existing `IN_PROGRESS` task.
2. Existing `BLOCKED` task.
3. Next dependency-ready `TODO` task.

When a `TODO` task is selected, the runner moves it to `IN_PROGRESS` and prints a prompt for your AI assistant.

### 3. Ask the AI Assistant to Implement

Give the printed prompt to your AI assistant. The assistant should:

- Read [AGENTS.md](AGENTS.md).
- Read the active task file.
- Explore selectors, preferably with Playwright MCP.
- Add or update Page Objects in `pages/`.
- Add or update Playwright specs in `tests/`.
- Avoid raw `page.locator()` calls in `.spec.ts` files.
- Keep selectors documented in Page Objects.

### 4. Verify the Task

When implementation is ready, run:

```bash
npm run task T-011
```

The runner executes:

```bash
npm run lint
npm test <task-test-file>
```

If both commands pass, the task moves to `DONE`.

### 5. Fix Blocked Tasks

If verification fails, the task moves to `BLOCKED`. Read the log:

```bash
cat logs/last_run.log
```

Then ask the AI assistant to fix the specific lint or test failure. After the fix, run the task command again:

```bash
npm run task T-011
```

> [!CAUTION]
> Do not guess at selector or test failures from the short terminal output. `logs/last_run.log` contains the command output needed for diagnosis.

## Writing Tests in This Framework

Use a Page Object workflow:

- Put selectors and user actions in `pages/**/*.ts`.
- Put assertions and test scenarios in `tests/**/*.spec.ts`.
- Do not use `page.locator()` in spec files.
- Prefer accessible selector strategies such as `getByRole`, `getByLabel`, and `getByText`.
- Document Page Object selector properties with `@selector`, `@strategy`, and `@verified`.

Example Page Object selector documentation:

```typescript
/**
 * @selector page.getByRole('button', { name: 'Login' })
 * @strategy role
 * @verified 2026-05-28
 */
readonly loginButton = this.page.getByRole('button', { name: 'Login' });
```

> [!WARNING]
> The project protocol requires `@selector`, `@strategy`, and `@verified` on Page Object properties. Current linting checks JSDoc presence and accepted tag names; stricter required-tag and date-format validation is tracked in [docs/ROADMAP.md](docs/ROADMAP.md).

## Best Practices for AI-Assisted Work

Use AI for implementation, selector mapping, and failure repair, but keep the lifecycle explicit:

- Start every change from a task file.
- Keep each task small enough to review.
- Ask the AI assistant to read [AGENTS.md](AGENTS.md) before implementation.
- Use Playwright MCP when selectors are unknown or fragile.
- Run `npm run task <TASK_ID>` instead of manually marking tasks complete.
- When blocked, give the AI assistant `logs/last_run.log` context before asking for fixes.

## Commands

| Command | Purpose |
| :--- | :--- |
| `npm run task` | Open the interactive task menu. |
| `npm run task next` | Activate or resume the next eligible task. |
| `npm run task T-011` | Verify or re-verify a specific task. |
| `npm run lint` | Run code and Markdown lint checks. |
| `npm test` | Run the Playwright test suite. |
| `npm run lint:code` | Run ESLint on Page Objects and specs. |
| `npm run lint:md` | Run markdownlint on Markdown files. |
| `npm run mcp` | Start the custom task lifecycle MCP server. |

Run `npm run task` without arguments to open the interactive menu. See [docs/TASK_CLI.md](docs/TASK_CLI.md) for the menu example and detailed command behavior.

## MCP Setup

This repository includes a custom task lifecycle MCP server in [mcp/server.ts](mcp/server.ts). It is separate from the official Playwright MCP server.

| MCP Server | Purpose |
| :--- | :--- |
| Repository task MCP | Exposes task lifecycle actions such as activating tasks and listing blocked tasks. |
| Official Playwright MCP | Lets agents inspect pages and verify selectors through a browser. |

Example Cursor configuration:

```json
{
  "mcpServers": {
    "task-framework": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/repo/mcp/server.ts"]
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}
```

> [!CAUTION]
> The task MCP server includes a `verifyTask` tool that manually marks a task `DONE`. It bypasses lint and test execution. Prefer `npm run task <TASK_ID>` for normal completion.

## Project Structure

```text
.
├── .husky/                    # Local git hooks
│   ├── commit-msg             # Commit message validation
│   └── pre-commit             # Pre-commit quality checks
├── docs/                      # Framework documentation
│   ├── ROADMAP.md             # Planned improvements tracker
│   └── TASK_CLI.md            # Task CLI reference
├── logs/                      # Runtime logs
│   └── last_run.log           # Latest task execution output
├── mcp/                       # Custom task lifecycle MCP server
│   └── server.ts
├── pages/                     # Page Objects
├── scripts/                   # CLI and selector-check scripts
│   ├── check-selectors.ts
│   └── task.ts
├── tasks/                     # Markdown task files
│   ├── template.md
│   └── T-*.md
├── tests/                     # Playwright specs and fixtures
├── AGENTS.md                  # AI agent protocol
├── eslint.config.ts           # ESLint v9 flat configuration
├── package.json               # Scripts and dependencies
├── playwright.config.ts       # Playwright configuration
└── tsconfig.json              # TypeScript configuration
```

## Common Issues

### Task Does Not Activate

Check:

- The file is in `tasks/`.
- The filename starts with a valid task ID, such as `T-011_`.
- The task has `status: "TODO"` or is already `IN_PROGRESS`/`BLOCKED`.
- Every `dependsOn` task is already `DONE`.

### Verification Fails

Read:

```bash
cat logs/last_run.log
```

Common causes:

- Missing or incorrect `- **Test File:**` line in the task.
- Raw locator usage in a spec.
- Missing Page Object JSDoc.
- Selector drift.
- Playwright browser install issue.

### Lint Fails

Run:

```bash
npm run lint
```

Fix code or Markdown issues before continuing. The framework treats lint as a completion gate.

## Current Scope

The repository currently provides:

- A file-backed task lifecycle runner.
- AI agent instructions.
- Playwright Page Object guardrails.
- ESLint and markdownlint quality gates.
- A selector health check for Page Objects.
- A custom task lifecycle MCP server.
- A task backlog and sample completed login navigation flow.

It does not currently provide a dashboard, CI workflow, automatic selector healing, or complete JSDoc metadata schema validation.
