# Agentic Playwright SDET Framework

[![Playwright](https://img.shields.io/badge/Playwright-1.41.0-2ead34?logo=playwright)](https://playwright.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-3178c6?logo=typescript)](https://www.typescriptlang.org)
[![ESLint](https://img.shields.io/badge/ESLint-8.56.0-4b32c3?logo=eslint)](https://eslint.org)
[![Node](https://img.shields.io/badge/Node-18+-339933?logo=nodedotjs)](https://nodejs.org)

**Protocol:** Smart Playwright Protocol v1.0  
**Architecture:** File-backed task lifecycle for Playwright automation  
**Objective:** Keep human-AI test automation work explicit, reviewable, and repeatable.

A task-driven framework for AI-assisted Playwright automation with Page Object guardrails, lifecycle state, and verification gates.

The Smart Playwright Protocol is the operating model behind the framework. It turns Markdown task files into constrained Playwright test work, gives the human a clear handoff loop, and uses lint/test gates to prevent common automation drift.

It is not a fully autonomous test-generation platform. It is a disciplined framework for managing AI-assisted Playwright implementation with task state, Page Object conventions, selector documentation, logs, and verification gates.

---

## Quick Start

```bash
# 1. Install dependencies
npm install && npx playwright install

# 2. Activate the next available task
npm run task next

# 3. Give the printed instruction to your AI assistant

# 4. Verify the implementation when the AI is finished
npm run task T-001
```

> **First time?** Read [The Handshake](#the-handshake-how-you-work) to understand the human-AI loop.

---

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

* Specs in `tests/**/*.spec.ts` are blocked from using raw `page.locator()` calls.
* Page Objects in `pages/**/*.ts` are allowed to own locators.
* Page Object properties must have JSDoc comments.
* Selector metadata tags such as `@selector`, `@strategy`, and `@verified` are part of the project protocol and are recognized by lint rules.

This keeps selectors centralized, documented, and easier to review. The current ESLint setup enforces JSDoc presence on Page Object properties and validates known JSDoc tag names; the protocol requires the selector metadata fields, but it does not yet enforce every required tag or date format as a schema.

### Verification-Driven Lifecycle

For `IN_PROGRESS` and `BLOCKED` tasks, the runner executes:

```bash
npm run lint
npm test <task test file>
```

If verification passes, the task moves to `DONE`. If lint or tests fail, the task is marked or kept as `BLOCKED`, and the next instruction points the AI assistant to `logs/last_run.log`.

### MCP-First Exploration Protocol

The framework expects agents to use `mcp-playwright` to inspect pages and verify selectors before implementation, especially for unknown or external pages. This is an operating rule defined in [AGENTS.md](AGENTS.md). The repository does not install or drive MCP automatically; it provides the protocol and enforcement context for agents that have the tool available.

### Commit-Time Quality Gates

Husky hooks are included for local quality control:

* `pre-commit` runs `npm run lint`.
* `commit-msg` enforces Conventional Commit-style messages with automation-friendly types.
* `.gitmessage` provides an optional commit message template.

---

## Where It Fits

Use this framework when you want:

* A backlog of small, auditable UI automation tasks.
* A repeatable way for humans and AI agents to hand work back and forth.
* Playwright specs that avoid scattered raw selectors.
* Page Objects with selector documentation.
* A simple local lifecycle runner instead of a heavyweight test management system.
* Fast feedback through lint, targeted Playwright execution, and persistent failure logs.

It is intentionally small. There is no dashboard, no CI pipeline definition, no automatic selector healing, and no built-in browser exploration server. Those can be added, but the current framework focuses on a clear local protocol that is easy to inspect and extend.

---

## Getting Started

### Prerequisites

* Node.js 18 or newer.
* Playwright browsers installed with `npx playwright install`.
* An AI coding environment that can read the repo and follow [AGENTS.md](AGENTS.md).
* Optional but recommended: [mcp-playwright](https://github.com/executeautomation/mcp-playwright) configured in your agentic IDE.

### Installation

```bash
npm install
npx playwright install
```

### Optional Commit Template

```bash
git config commit.template .gitmessage
```

---

## Running Tasks

The main entry point is:

```bash
npm run task <TASK_ID|next>
```

### Auto-Pilot Mode

`next` selects the next task in this order:

1. `IN_PROGRESS` - resume current active work.
2. `BLOCKED` - fix failed work before starting new work.
3. `TODO` - activate the next pending task.

```bash
npm run task next
```

When a `TODO` task is selected, the runner changes it to `IN_PROGRESS` and prints the instruction to give your AI assistant.

### Targeted Mode

Run a specific task by ID:

```bash
npm run task T-001
```

For active tasks, the runner executes lint and the test file declared in the task context.

---

## The Handshake (How You Work)

This framework is built around a simple human-AI loop.

### 1. Human Activates a Task

```bash
npm run task next
```

The runner:

* Finds an `IN_PROGRESS`, `BLOCKED`, or `TODO` task using the priority order above.
* Moves `TODO` tasks to `IN_PROGRESS`.
* Prints the prompt to give the AI assistant.
* Writes activity to `logs/last_run.log`.

### 2. AI Implements the Task

Give the printed prompt to your AI assistant. The assistant should:

* Read [AGENTS.md](AGENTS.md).
* Read the task file in `tasks/`.
* Map selectors, preferably with `mcp-playwright`.
* Add or update Page Objects in `pages/`.
* Add or update specs in `tests/`.
* Avoid raw locators in specs.

### 3. Human Verifies the Task

```bash
npm run task T-001
```

The runner:

* Runs `npm run lint`.
* Runs the task's declared Playwright spec.
* Marks the task `DONE` on success.
* Marks or keeps the task `BLOCKED` on failure.
* Points the AI assistant to `logs/last_run.log` for diagnosis.

---

## Project Structure

```text
.
├── .husky/                    # Local git hooks
│   ├── commit-msg             # Commit message validation
│   └── pre-commit             # Lint before commit
├── logs/                      # Runtime logs
│   └── last_run.log           # Latest task execution output
├── pages/                     # Page Objects
│   ├── BasePage.ts            # Shared page helpers
│   └── *.ts                   # Feature-specific page objects
├── scripts/                   # Task runner
│   └── run_task.ts            # Lifecycle and verification engine
├── tasks/                     # Markdown task files
│   ├── template.md            # Task template
│   └── T-*.md                 # Individual task files
├── tests/                     # Playwright specs
│   ├── fixtures/              # Test data files
│   └── *.spec.ts              # Test specifications
├── .eslintrc.js               # ESLint rules
├── .gitmessage                # Optional commit message template
├── .markdownlint.json         # Markdownlint rules
├── AGENTS.md                  # Agent protocol and completion format
├── package.json               # Scripts and dependencies
├── playwright.config.ts       # Playwright configuration
├── README.md                  # Project documentation
└── tsconfig.json              # TypeScript configuration
```

---

## Task File Convention

Preferred task filenames follow:

```text
T-###_description-in-kebab-case.md
```

Examples:

* `T-001_login-navigation.md`
* `T-007_checkout-step1.md`
* `T-010_external-test.md`

The runner resolves tasks case-insensitively by ID prefix, so existing task files with uppercase words still run. New task files should use lowercase kebab-case descriptions to match the protocol.

---

## Lifecycle Rules

| Current Status | Runner Behavior | Success Outcome | Failure Outcome |
| :--- | :--- | :--- | :--- |
| `TODO` | Marks the task `IN_PROGRESS` and prints the AI instruction. | `IN_PROGRESS` | N/A |
| `IN_PROGRESS` | Runs lint and the declared task test. | `DONE` | `BLOCKED` |
| `BLOCKED` | Re-runs lint and the declared task test after fixes. | `DONE` | Remains `BLOCKED` |
| `DONE` | Re-verifies lint and the declared task test if present. | Remains `DONE` | `BLOCKED` |

---

## Regulations

These rules are defined in [AGENTS.md](AGENTS.md) and backed by linting where possible.

1. **No raw locators in specs:** Do not use `page.locator()` in `.spec.ts` files.
2. **Page Object selector documentation:** Page Object properties must document selectors with `@selector`, `@strategy`, and `@verified`.
3. **Lint before completion:** `npm run lint` must pass before a task can be marked `DONE`.
4. **MCP-first exploration:** Use `mcp-playwright` to explore pages and validate selectors when available.
5. **Failure diagnosis:** If verification fails, read `logs/last_run.log` before changing code.

---

## Scripts

| Command | Purpose |
| :--- | :--- |
| `npm run task next` | Activate or resume the next task. |
| `npm run task T-001` | Verify or re-verify a specific task. |
| `npm run lint` | Run TypeScript ESLint and markdownlint. |
| `npm test` | Run the Playwright test suite. |
| `npm run lint:code` | Run ESLint on Page Objects and specs. |
| `npm run lint:md` | Run markdownlint on Markdown files. |

---

## Current Scope

The repository currently includes:

* A working lifecycle runner in [scripts/run_task.ts](scripts/run_task.ts).
* Agent instructions in [AGENTS.md](AGENTS.md).
* One completed login navigation example.
* A task backlog for inventory, cart, sorting, checkout, footer, logout, login-error, and external contact-form coverage.
* Playwright configured for Chromium by default, with Firefox and WebKit examples commented in [playwright.config.ts](playwright.config.ts).

This makes the framework useful as a local AI-assisted SDET workflow today, while leaving clear extension points for stricter JSDoc schema checks, CI integration, dashboards, richer task metadata, and cross-browser expansion.
