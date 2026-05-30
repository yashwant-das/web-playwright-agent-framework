# Agentic Playwright SDET Framework

[![Playwright](https://img.shields.io/badge/Playwright-1.41.0-2ead34?logo=playwright)](https://playwright.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-3178c6?logo=typescript)](https://www.typescriptlang.org)
[![ESLint](https://img.shields.io/badge/ESLint-8.56.0-4b32c3?logo=eslint)](https://eslint.org)
[![Node](https://img.shields.io/badge/Node-18+-339933?logo=nodedotjs)](https://nodejs.org)

**Protocol:** Smart Playwright Protocol v1.0
**Architecture:** File-backed task lifecycle for Playwright automation
**Objective:** Keep human-AI test automation work explicit, reviewable, and repeatable.

The Smart Playwright Protocol is the operating model behind the framework. It turns Markdown task files into constrained Playwright test work, gives the human a clear handoff loop, and uses lint/test gates to prevent common automation drift.

It is not a fully autonomous test-generation platform. It is a disciplined framework for managing AI-assisted Playwright implementation with task state, Page Object conventions, selector documentation, logs, and verification gates.

> [!NOTE]
> Start with this README for setup and daily workflow. Use [docs/TASK_CLI.md](docs/TASK_CLI.md) for detailed command behavior, lifecycle rules, dependency handling, and troubleshooting.

## Documentation Map

| File | Use It For |
| :--- | :--- |
| [README.md](README.md) | First-time setup, daily workflow, framework rules, and common recovery steps. |
| [docs/TASK_CLI.md](docs/TASK_CLI.md) | Detailed task CLI reference, command behavior, lifecycle transitions, logs, and MCP relationship. |
| [AGENTS.md](AGENTS.md) | Mandatory instructions for AI agents implementing tasks. |
| [tasks/template.md](tasks/template.md) | Starting point for new task files. |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Shipped improvements, known gaps, and planned enhancements. |

## What This Framework Provides

### File-Based Task State

Each task lives in `tasks/*.md` with frontmatter such as `status`, `title`, `owner`, and `priority`. The task file is the source of truth for the work lifecycle:

```text
TODO -> IN_PROGRESS -> DONE
              |
              v
           BLOCKED
```

The `npm run task` command reads those files, updates task status, runs verification for active work, and writes diagnostic output to `logs/last_run.log`.

### Guardrails for AI-Written Tests

The project is designed around a Page Object workflow:

- Specs in `tests/**/*.spec.ts` are blocked from using raw `page.locator()` calls.
- Page Objects in `pages/**/*.ts` are allowed to own locators.
- Page Object properties must have JSDoc comments.
- Selector metadata tags such as `@selector`, `@strategy`, and `@verified` are part of the project protocol and are recognized by lint rules.

This keeps selectors centralized, documented, and easier to review. The current ESLint setup enforces JSDoc presence on Page Object properties and validates known JSDoc tag names; the protocol requires the selector metadata fields, but it does not yet enforce every required tag or date format as a schema.

### Verification-Driven Lifecycle

For `IN_PROGRESS` and `BLOCKED` tasks, the runner executes:

```bash
npm run lint
npm test <task test file>
```

If verification passes, the task moves to `DONE`. If lint or tests fail, the task is marked or kept as `BLOCKED`, and the next instruction points the AI assistant to `logs/last_run.log`.

### MCP-First Exploration Protocol

The framework expects agents to use the official [Playwright MCP](https://playwright.dev/docs/getting-started-mcp) server to inspect pages and verify selectors before implementation, especially for unknown or external pages. This is an operating rule defined in [AGENTS.md](AGENTS.md).

### Commit-Time Quality Gates

Husky hooks are included for local quality control:

- `pre-commit` runs `npm run lint`.
- `commit-msg` enforces Conventional Commit-style messages with automation-friendly types.
- `.gitmessage` provides an optional commit message template.

### Where It Fits

Use this framework when you want:

- A backlog of small, auditable UI automation tasks.
- A repeatable way for humans and AI agents to hand work back and forth.
- Playwright specs that avoid scattered raw selectors.
- Page Objects with selector documentation.
- A simple local lifecycle runner instead of a heavyweight test management system.
- Fast feedback through lint, targeted Playwright execution, and persistent failure logs.

It is intentionally small. There is no dashboard, no CI pipeline definition, no automatic selector healing, and no built-in browser exploration server. Those can be added, but the current framework focuses on a clear local protocol that is easy to inspect and extend.

## Getting Started

### Prerequisites

Install these before using the framework:

- Node.js 18 or newer.
- npm.
- An AI coding environment that can read this repository and follow [AGENTS.md](AGENTS.md).

### Installation

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

### Configure MCP Servers

> [!IMPORTANT]
> This step is critical. The framework relies on two MCP servers. Without them, your AI assistant cannot explore pages for selectors or manage the task lifecycle through the protocol. Complete this step before starting any task work.

This framework relies on two MCP servers to function correctly. One is provided natively by this repository, and the other is an official external tool:

| MCP Server | Source / Purpose | Required? |
| :--- | :--- | :--- |
| **Official Playwright MCP** | **External (`@playwright/mcp`)** <br> Lets AI agents inspect live pages, explore DOM structure, and verify selectors through a real browser. | **Yes — strongly recommended** |
| **Task Framework MCP** | **Native (`mcp/server.ts`)** <br> Exposes task lifecycle tools (`list_tasks`, `activate_task`, `verify_task`) so agents can manage tasks programmatically. | **Yes — for full workflow** |

#### Option A: Ask Your AI Assistant to Set It Up

Copy and paste the following prompt into your AI assistant's chat window. It will configure both MCP servers for your IDE automatically:

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

#### Option B: Manual Configuration

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
> Without the Playwright MCP server, your AI assistant cannot inspect pages or verify selectors before writing tests. This leads to fragile selectors and avoidable test failures. Do not skip this step.

#### Task Framework MCP Tools

The task framework MCP server exposes these tools to your AI assistant:

| Tool | Purpose |
| :--- | :--- |
| `list_tasks` | Lists all tasks with status and dependency info. Accepts an optional status filter. |
| `activate_task` | Moves a dependency-ready `TODO` task to `IN_PROGRESS`. Enforces dependency checks. |
| `verify_task` | Runs automated quality gates (`npm run lint` + Playwright tests) and marks the task `DONE` on success, or `BLOCKED` on failure. Logs full output to `logs/last_run.log`. |
| `get_unmet_dependencies` | Lists tasks that cannot be activated because they are waiting on unmet dependencies. |

> [!NOTE]
> `verify_task` enforces the same strict quality gates as `npm run task <TASK_ID>`: ESLint linting and Playwright test execution. Both the MCP server and the CLI runner are functionally equivalent for verification.

You can also start the task framework MCP server manually for testing:

```bash
npm run mcp
```

## Daily Workflow

This framework is built around a human-AI handshake loop. Follow these steps for every task.

### 1. Create or Pick a Task

Create a Markdown file in [tasks/](tasks/) using this format:

```text
T-###_description-in-kebab-case.md
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

```bash
npm run task next
```

The runner selects work in this order:

1. Existing `IN_PROGRESS` task.
2. Existing `BLOCKED` task.
3. Next dependency-ready `TODO` task.

When a `TODO` task is selected, the runner moves it to `IN_PROGRESS` and prints a prompt formatted for your AI assistant.

### 3. Hand Off to the AI Assistant

Copy the generated prompt string and paste it to your AI assistant. The assistant should:

- Read [AGENTS.md](AGENTS.md).
- Read the active task file.
- **Explore selectors using Playwright MCP** before writing any Page Object code.
- Add or update Page Objects in `pages/`.
- Add or update Playwright specs in `tests/`.
- Avoid raw `page.locator()` calls in `.spec.ts` files.
- Keep selectors documented in Page Objects with `@selector`, `@strategy`, and `@verified`.

### 4. Verify the Task

When the AI assistant finishes implementation, run:

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

If verification fails, the task moves to `BLOCKED`. The runner will print a new prompt for you to copy and paste to your AI assistant. The assistant will then read the log:

```bash
cat logs/last_run.log
```

The AI assistant will fix the specific lint or test failure. After the fix, the assistant (or you) should run the task command again:

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

## Regulations

These rules are defined in [AGENTS.md](AGENTS.md) and backed by linting where possible.

1. **No raw locators in specs:** Do not use `page.locator()` in `.spec.ts` files.
2. **Page Object selector documentation:** Page Object properties must document selectors with `@selector`, `@strategy`, and `@verified`.
3. **Lint before completion:** `npm run lint` must pass before a task can be marked `DONE`.
4. **MCP-first exploration:** Use Playwright MCP to explore pages and validate selectors when available.
5. **Failure diagnosis:** If verification fails, read `logs/last_run.log` before changing code.

## Lifecycle Rules

| Current Status | Runner Behavior | Success Outcome | Failure Outcome |
| :--- | :--- | :--- | :--- |
| `TODO` | Marks the task `IN_PROGRESS` and prints the AI instruction. | `IN_PROGRESS` | N/A |
| `IN_PROGRESS` | Runs lint and the declared task test. | `DONE` | `BLOCKED` |
| `BLOCKED` | Re-runs lint and the declared task test after fixes. | `DONE` | Remains `BLOCKED` |
| `DONE` | Re-verifies lint and the declared task test if present. | Remains `DONE` | `BLOCKED` |

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

## Task File Convention

Preferred task filenames follow:

```text
T-###_description-in-kebab-case.md
```

Examples:

- `T-001_login-navigation.md`
- `T-007_checkout-step1.md`
- `T-010_external-test.md`

The runner resolves tasks case-insensitively by ID prefix, so existing task files with uppercase words still run. New task files should use lowercase kebab-case descriptions to match the protocol.

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

### MCP Server Does Not Start

Test the task framework MCP server manually:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1"}}}' | npm run mcp
```

If the server responds with a JSON-RPC result containing `serverInfo`, it is working. If your IDE still does not show the MCP tools, restart the IDE session after updating the MCP configuration.

## Current Scope

The repository currently provides:

- A file-backed task lifecycle runner in [scripts/task.ts](scripts/task.ts).
- AI agent instructions in [AGENTS.md](AGENTS.md).
- Playwright Page Object guardrails.
- ESLint and markdownlint quality gates.
- A selector health check for Page Objects.
- A custom task lifecycle MCP server.
- A task backlog and sample completed login navigation flow.
- Playwright configured for Chromium by default, with Firefox and WebKit examples commented in [playwright.config.ts](playwright.config.ts).

This makes the framework useful as a local AI-assisted SDET workflow today, while leaving clear extension points for stricter JSDoc schema checks, CI integration, dashboards, richer task metadata, and cross-browser expansion.
