# Roadmap & Improvements

This document tracks planned architectural changes, toolchain upgrades, and framework improvements for the `web-playwright-agent-framework`.

## 🛑 Core Philosophy (What Stays)

The entire philosophy remains untouched. The task file protocol, the human-AI handshake loop, the POM enforcement, and the `TASK.md` / `AGENTS.md` structure are the key differentiators. Do not touch or deviate from them.

---

## ✅ Shipped (Implemented)

### 1. `@clack/prompts` Task Runner CLI
Replaced raw `console.log` output in the task runner with a proper interactive experience.

```typescript
// scripts/task.ts
import { intro, outro, select, confirm, log, spinner } from '@clack/prompts';

const command = await select({
  message: 'What would you like to do?',
  options: [
    { value: 'next',     label: 'Activate next available task' },
    { value: 'verify',   label: 'Mark current task as verified (runs tests)' },
    { value: 'status',   label: 'Show task board status' },
    { value: 'blocked',  label: 'Show blocked tasks' },
  ]
});
```

`npm run task` launches the interactive menu. `npm run task next` skips the menu and activates directly — both patterns work, preserving scripting compatibility.

### 2. Task Dependency Graph
Added a `dependsOn` field to the task schema and enforced order automatically via the CLI.

```typescript
// types/task.ts
interface Task {
  id: string;                    // e.g. "T-003"
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
  assignedTo: 'human' | 'ai';
  dependsOn?: string[];          // e.g. ["T-001", "T-002"]
  blockedReason?: string;
}
```

The task runner enforces order automatically:

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

If `T-003` declares `dependsOn: ["T-001"]` and `T-001` isn't DONE, `T-003` shows as `BLOCKED` with a reason. The runner will never activate it until the dependency resolves. This is the kind of guard rail that prevents AI agents from working on things out of order.

### 3. MCP Server
Exposed the task lifecycle as MCP tools (`activateTask`, `verifyTask`, `getBlockedTasks`).

```typescript
// mcp/server.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

const server = new McpServer({ name: 'task-framework', version: '1.0.0' });

server.tool('activateTask', {
  taskId: z.string().regex(/^T-\d{3}$/),
}, async ({ taskId }) => {
  // validates dependencies, updates file to IN_PROGRESS, and enforces AGENTS.md
  return { content: [{ type: 'text', text: `Task ${taskId} is now IN_PROGRESS.\n\nCRITICAL ENFORCEMENT: Before implementing this task, you MUST review AGENTS.md...` }] };
});

server.tool('verifyTask', {
  taskId: z.string().regex(/^T-\d{3}$/),
  notes: z.string().optional(),
}, async ({ taskId, notes }) => {
  // human confirmation gate — sets status to DONE
  return { content: [{ type: 'text', text: `Task ${taskId} is now DONE...\n\nWARNING: You bypassed the automated quality gates...` }] };
});

server.tool('getBlockedTasks', {}, async () => {
  // returns all tasks with unmet dependencies
  return { content: [{ type: 'text', text: `...` }] };
});
```

Now an AI agent in Cursor can call `activateTask` to pick up a task, work on it, and call `verifyTask` when done — the human still approves via the `verifyTask` call, but the coordination happens inside the IDE. This is the project's human-AI handshake protocol made native to MCP.

---

## ⏳ Backlog (Pending)

### 4. ESLint v9 Flat Config ⏳ [PENDING]
Replace `.eslintrc.json` with `eslint.config.ts`.

```typescript
// eslint.config.ts
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  tseslint.configs.strictTypeChecked,
  {
    ...playwright.configs['flat/recommended'],
    files: ['**/*.spec.ts'],
    rules: {
      'playwright/no-raw-locators': 'error',     // forbid page.locator() in specs
      'playwright/prefer-web-first-assertions': 'error',
    },
  },
  {
    languageOptions: {
      parserOptions: { project: true }
    }
  }
);
```

The `playwright/no-raw-locators` rule enforces that specs only use Page Object methods — raw `page.locator()` in a `.spec.ts` is a lint error. This is a natural fit for the project's philosophy.

### 5. Selector Health Check Pre-commit Hook ✅ [IMPLEMENTED]
Add a Husky pre-commit hook that runs ARIA selector validation before any commit that touches a Page Object file.

```typescript
// scripts/check-selectors.ts
import { Project } from 'ts-morph';

const project = new Project({ tsConfigFilePath: 'tsconfig.json' });
const pageObjects = project.getSourceFiles('src/page-objects/**/*.ts');

const violations: string[] = [];

for (const file of pageObjects) {
  file.getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter(isLocatorCall)
    .filter(call => !isARIALocator(call))
    .forEach(call => {
      violations.push(
        `${file.getFilePath()}:${call.getStartLineNumber()} — raw locator: ${call.getText()}`
      );
    });
}

if (violations.length > 0) {
  console.error('Selector health check failed:');
  violations.forEach(v => console.error(`  ${v}`));
  process.exit(1);
}
```

`.husky/pre-commit`:

```sh
npx lint-staged
npx tsx scripts/check-selectors.ts
```

This runs only when `src/page-objects/` files are staged. Fast, non-intrusive, enforces the ARIA-first rule at commit time so it never reaches PR review.
