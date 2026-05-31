# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Smart Playwright Protocol Framework** — a file-backed task lifecycle for Playwright E2E test automation using the **Smart Playwright Protocol (SPP) v2.0**.

## Key Commands

```bash
npm test                    # Run all Playwright tests
npm test <file>            # Run a specific spec (e.g., tests/login_navigation.spec.ts)
npm run lint               # ESLint (code) + markdownlint (docs)
npm run task               # Interactive task CLI
npm run task create        # Task creation wizard
npm run task next          # Activate/resume next eligible task (auto-copies prompt)
npm run task T-001         # Verify/re-verify a specific task
npm run mcp                # Start custom task lifecycle MCP server
```

## Architecture

This framework follows the **Smart Playwright Protocol (SPP) v2.0**:

- **PROTOCOL.md** (`docs/PROTOCOL.md`): The architectural source of truth.
- **Task files** (`tasks/T-*.md`): Source of truth for individual work units.
- **Page Objects** (`pages/`): Sole owners of selectors and user actions.
- **Specs** (`tests/`): Test scenarios and business assertions.
- **ESLint** (`eslint.config.ts`): Enforces quality gates and JSDoc metadata.
- **MCP server** (`mcp/server.ts`): Task lifecycle tools for AI-assisted IDEs.
- **Git hooks** (`.husky/`): `pre-commit` blocks `.only` and `waitForTimeout`; `commit-msg` enforces Conventional Commit format.

## Commit Conventions

- **Types**: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `build`, `arch`, `heal`
- **Examples**:
  - `feat(cli): add task generator`
  - `fix(tasks): handle blocked task parsing`
  - `build(deps): upgrade playwright`
  - `heal(selectors): repair checkout locator`

## Critical Coding Rules

1. **No `page.locator()` in `.spec.ts` files** — Use Page Objects exclusively.
2. **Banned Practices**: No `page.waitForTimeout()`, `test.only()`, or `describe.only()`.
3. **JSDoc Metadata**: Every Page Object property MUST have `@selector`, `@strategy`, and `@verified` (date: `YYYY-MM-DD`).
4. **Strong Business Assertions**: Validate outcomes (e.g., `toHaveText("$54.99")`) rather than visibility.
5. **Linter is Law**: Run `npm run lint` before claiming any task is complete.

## Task Workflow

Follow the SPP lifecycle: **Select → Understand → Explore → Plan → Implement → Verify → Recover**.

1. **Understand**: Fill out the `Understanding` section in the task file before coding.
2. **Explore**: Use Playwright MCP to verify selectors live in the browser.
3. **Plan**: Draft an `Implementation Plan` in the task file.
4. **Implement**: Write code following repository standards.
5. **Verify**: Run `npm run task <TASK_ID>`.

## Adding a New Task

Use `npm run task create` or copy `tasks/template.md`. New tasks include:

- `Understanding`: Feature, Expected Behavior, Business Outcome, Risk.
- `Context`: Page Object, Test File, URL.
- `Implementation Plan`: Step-by-step approach.
- `Acceptance Criteria`: Checklist of requirements.

## Documentation

- `README.md` — Onboarding and quick start.
- `docs/PROTOCOL.md` — Architectural source of truth.
- `docs/CLI.md` — Technical command reference.
- `docs/ROADMAP.md` — Future enhancements and improvements.
- `AGENTS.md` — Lightweight agent instructions.
