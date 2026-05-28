# Roadmap & Improvements

This document tracks planned architectural changes, toolchain upgrades, and framework improvements for the `web-playwright-agent-framework`.

> [!IMPORTANT]
> This roadmap is for framework capabilities. Test automation task status lives in `tasks/*.md` and should be managed through `npm run task`.

## 🛑 Core Philosophy (What Stays)

The entire philosophy remains untouched. The task file protocol, the human-AI handshake loop, the POM enforcement, and the `TASK.md` / `AGENTS.md` structure are the key differentiators. Do not touch or deviate from them.

### Non-Negotiables for Agents

- Preserve the file-backed task lifecycle.
- Keep `AGENTS.md` as the authority for AI implementation behavior.
- Keep selectors centralized in Page Objects.
- Keep specs free of raw `page.locator()` calls.
- Keep `npm run lint` and task verification as completion gates.
- Do not mark roadmap items as implemented unless the code exists and verification has passed.

---

## Agent Reading Guide

Use this status model when updating the roadmap:

| Status | Meaning |
| :--- | :--- |
| `IMPLEMENTED` | Code exists in the repository and has been verified. |
| `PARTIAL` | Some implementation exists, but acceptance criteria are not fully met. |
| `PENDING` | Planned but not implemented. |
| `BLOCKED` | Cannot proceed without a dependency, decision, or external setup. |

Each roadmap item should include:

- **Status**
- **Owner**
- **Why it matters**
- **Acceptance criteria**
- **Verification command**
- **Next action**

---

## ✅ Shipped (Implemented)

### 1. `@clack/prompts` Task Runner CLI

**Status:** `IMPLEMENTED`
**Owner:** Framework
**Primary files:** `scripts/task.ts`, `package.json`

#### Why It Matters

Replaced raw `console.log` output in the task runner with a structured CLI experience. This keeps terminal output readable while full command output is written to `logs/last_run.log`.

#### Implemented Behavior

- `npm run task` launches the interactive menu.
- `npm run task next` skips the menu and activates directly.
- `npm run task <TASK_ID>` targets a specific task.
- Lint and test output is captured in `logs/last_run.log`.
- Failed verification moves a task to `BLOCKED`.

#### Reference Snippet

```typescript
// scripts/task.ts
const command = await select({
  message: 'What would you like to do?',
  options: [
    { value: 'next',     label: 'Activate or resume next task' },
    { value: 'verify',   label: 'Verify current active task' },
    { value: 'status',   label: 'Show task board' },
    { value: 'blocked',  label: 'Show blocked tasks' },
  ]
});
```

#### Acceptance Criteria

- [x] Interactive menu is available through `npm run task`.
- [x] Direct activation is available through `npm run task next`.
- [x] Targeted task execution is available through `npm run task <TASK_ID>`.
- [x] Verification output is written to `logs/last_run.log`.

#### Verification Command

```bash
npm run lint
```

#### Next Action

No immediate action. Keep future CLI changes compatible with existing `npm run task` usage.

### 2. Task Dependency Graph

**Status:** `IMPLEMENTED`
**Owner:** Framework
**Primary files:** `types/task.ts`, `scripts/task.ts`, `tasks/*.md`

#### Why It Matters

Task dependencies prevent agents from starting work out of order. This keeps multi-step workflows, such as checkout flows, aligned with prerequisite coverage.

#### Implemented Behavior

- Task frontmatter supports `dependsOn`.
- `npm run task next` skips `TODO` tasks with unmet dependencies.
- Direct task execution fails when dependencies are not `DONE`.

#### Reference Snippet

```typescript
// types/task.ts
interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
  assignedTo?: 'human' | 'ai';
  dependsOn?: string[];
  blockedReason?: string;
}
```

```typescript
// scripts/task.ts
function getNextTask(tasks: (Task & { file: string, content: string })[]) {
  const inProgress = tasks.find(t => t.status === 'IN_PROGRESS');
  if (inProgress) return inProgress;

  const done = new Set(tasks.filter(t => t.status === 'DONE').map(t => t.id));
  return tasks
    .filter(t => t.status === 'TODO')
    .filter(t => (t.dependsOn ?? []).every(dep => done.has(dep)))
    .at(0) ?? null;
}
```

#### Acceptance Criteria

- [x] `dependsOn` is represented in the task type.
- [x] `next` respects completed dependencies.
- [x] direct task activation rejects unmet dependencies.

#### Verification Command

```bash
npm run lint
```

#### Next Action

Add schema validation later so invalid dependency IDs fail early.

### 3. MCP Server

**Status:** `IMPLEMENTED`
**Owner:** Framework
**Primary files:** `mcp/server.ts`, `package.json`

#### Why It Matters

The custom MCP server exposes the task lifecycle to agentic IDEs. This lets an AI agent inspect and coordinate framework tasks without bypassing the repository conventions.

#### Implemented Tools

| Tool | Purpose |
| :--- | :--- |
| `activateTask` | Validates dependencies and marks a task `IN_PROGRESS`. |
| `verifyTask` | Marks a task `DONE` manually. |
| `getBlockedTasks` | Returns tasks blocked by unmet dependencies. |

> [!CAUTION]
> `verifyTask` is a manual override and bypasses the automated lint/test gates. The preferred completion path remains `npm run task <TASK_ID>`.

#### Reference Snippet

```typescript
// mcp/server.ts
const server = new McpServer({ name: 'task-framework', version: '1.0.0' });

server.tool('activateTask', {
  taskId: z.string().regex(/^T-\d{3}$/),
}, async ({ taskId }) => {
  // validates dependencies and updates file to IN_PROGRESS
});
```

#### Acceptance Criteria

- [x] MCP server starts through `npm run mcp`.
- [x] `activateTask` validates task IDs and dependencies.
- [x] `verifyTask` exists with an explicit warning in documentation.
- [x] `getBlockedTasks` reports dependency-blocked tasks.

#### Verification Command

```bash
npm run lint
```

#### Next Action

Decide whether MCP should support verified completion or remain activation-focused.

### 4. ESLint v9 Flat Config

**Status:** `IMPLEMENTED`
**Owner:** Framework
**Primary files:** `eslint.config.ts`, `package.json`

#### Why It Matters

The flat config aligns the project with ESLint v9 and supports Playwright-specific enforcement for agent-written specs.

#### Implemented Behavior

- `eslint.config.ts` is present.
- `playwright/no-raw-locators` is enabled for `.spec.ts` files.
- `playwright/prefer-web-first-assertions` is enabled.
- JSDoc tags for selector documentation are recognized.

#### Reference Snippet

```typescript
// eslint.config.ts
export default tseslint.config(
  tseslint.configs.strictTypeChecked,
  {
    ...playwright.configs['flat/recommended'],
    files: ['**/*.spec.ts'],
    rules: {
      'playwright/no-raw-locators': 'error',
      'playwright/prefer-web-first-assertions': 'error',
    },
  }
);
```

#### Acceptance Criteria

- [x] ESLint v9 flat config exists.
- [x] raw locators are forbidden in spec files.
- [x] lint runs through `npm run lint`.

#### Verification Command

```bash
npm run lint
```

#### Next Action

Add stricter validation for required Page Object JSDoc metadata.

### 5. Selector Health Check Pre-commit Hook

**Status:** `PARTIAL`
**Owner:** Framework
**Primary files:** `scripts/check-selectors.ts`, `.husky/pre-commit`, `package.json`

#### Why It Matters

The selector health check helps prevent brittle selector strategies from entering Page Objects.

#### Current Behavior

- `scripts/check-selectors.ts` scans `pages/**/*.ts`.
- `.husky/pre-commit` runs `npx lint-staged`.
- `.husky/pre-commit` also runs `npx tsx scripts/check-selectors.ts`.
- `package.json` includes a `lint-staged` entry for Page Object changes.

#### Current Limitation

The original roadmap described a check that runs only when Page Object files are staged. The current hook always runs `scripts/check-selectors.ts` during pre-commit. This is acceptable for correctness, but it is not the optimized staged-file-only behavior described in the original plan.

#### Reference Snippet

```sh
# .husky/pre-commit
npx lint-staged
npx tsx scripts/check-selectors.ts
```

#### Acceptance Criteria

- [x] selector health check script exists.
- [x] pre-commit hook runs the selector health check.
- [x] Page Object path matches the current project structure: `pages/**/*.ts`.
- [ ] hook runs only when relevant Page Object files are staged.

#### Verification Command

```bash
npm run lint
npx tsx scripts/check-selectors.ts
```

#### Next Action

Decide whether always running the selector health check is acceptable. If not, optimize the hook to run only for staged Page Object changes.

---

## ⏳ Backlog (Pending)

### 6. Strict Page Object JSDoc Metadata Schema

**Status:** `PENDING`
**Owner:** Framework
**Priority:** High

#### Why It Matters

`AGENTS.md` requires every Page Object property to include:

```text
@selector
@strategy
@verified YYYY-MM-DD
```

Current linting checks that Page Object properties have JSDoc and that tag names are recognized. It does not yet enforce that all required tags exist or that `@verified` uses the required date format.

#### Acceptance Criteria

- [ ] every Page Object property must include `@selector`.
- [ ] every Page Object property must include `@strategy`.
- [ ] every Page Object property must include `@verified`.
- [ ] `@verified` must match `YYYY-MM-DD`.
- [ ] violations fail `npm run lint` or a documented verification script.

#### Suggested Implementation

Add either:

- a custom ESLint rule, or
- a TypeScript AST checker similar to `scripts/check-selectors.ts`.

#### Verification Command

```bash
npm run lint
```

### 7. Task Frontmatter Validation

**Status:** `PENDING`
**Owner:** Framework
**Priority:** High

#### Why It Matters

The task runner depends on structured task metadata. Invalid or missing frontmatter can cause confusing task activation and verification behavior.

#### Acceptance Criteria

- [ ] `status` must be one of `TODO`, `IN_PROGRESS`, `DONE`, or `BLOCKED`.
- [ ] `dependsOn` must contain valid `T-###` IDs.
- [ ] filename task ID and frontmatter `id` must match when `id` is present.
- [ ] active tasks must declare `- **Test File:**`.
- [ ] validation failures must give actionable error messages.

#### Verification Command

```bash
npm run task next
```

### 8. CI Verification Workflow

**Status:** `PENDING`
**Owner:** Framework
**Priority:** Medium

#### Why It Matters

Local hooks are useful, but CI should enforce the same quality gates before pull requests are merged.

#### Acceptance Criteria

- [ ] CI installs dependencies with `npm ci`.
- [ ] CI installs Playwright browsers.
- [ ] CI runs `npm run lint`.
- [ ] CI runs `npm test`.

#### Suggested Workflow Commands

```bash
npm ci
npx playwright install --with-deps chromium
npm run lint
npm test
```

### 9. MCP Verification Parity

**Status:** `PENDING`
**Owner:** Framework
**Priority:** Medium

#### Why It Matters

The MCP server can mark a task `DONE`, but it does not run the same lint/test verification as the CLI. This can create drift if agents use `verifyTask` incorrectly.

#### Acceptance Criteria

- [ ] either remove or clearly restrict manual `verifyTask`, or
- [ ] add a verified MCP path that executes the same gates as `npm run task <TASK_ID>`.
- [ ] documentation clearly states the approved completion path.

#### Recommended Direction

Keep terminal verification as the primary completion path unless there is a strong need for MCP-based verification.

### 10. Priority-Aware Task Selection

**Status:** `PENDING`
**Owner:** Framework
**Priority:** Low

#### Why It Matters

`npm run task next` currently prioritizes unfinished work, then uses filesystem order for eligible `TODO` tasks. A priority-aware selector would make backlog ordering more explicit.

#### Acceptance Criteria

- [ ] task selection respects active work first.
- [ ] eligible `TODO` tasks can be sorted by priority.
- [ ] dependency order remains enforced.
- [ ] behavior is documented in `docs/TASK_CLI.md`.

---

## Agent Update Protocol

When an agent updates this roadmap:

1. Read the implementation files listed in the roadmap item.
2. Confirm the current behavior from code, not assumptions.
3. Update `Status`, `Acceptance Criteria`, and `Next Action`.
4. Run the relevant verification command.
5. Do not move an item to `IMPLEMENTED` without verification evidence.

> [!WARNING]
> Do not use this roadmap to track individual test task completion. Use the task files under `tasks/` for that lifecycle.
