# Agentic Playwright Task Runner

The **Agentic Playwright Task Runner** (`scripts/task.ts`) is a custom-built, production-grade orchestration engine designed to manage the lifecycle of automated testing tasks. It acts as the bridge between human engineers and AI Agents (like Cursor or GitHub Copilot), ensuring that tasks are executed, verified, and handed off flawlessly.

---

## 🎨 Production-Grade UI

The CLI has been completely overhauled with `@clack/prompts` and `picocolors` to provide a visually stunning, distraction-free terminal experience:

- **Clean Spinners:** Raw output from linters and test runners (which often flood the terminal) is entirely suppressed. The CLI displays elegant spinners while commands run.
- **Silent Logging:** All raw stdout/stderr output is seamlessly streamed to `logs/last_run.log`. If a task fails, you or your AI agent can read this file to debug without cluttering the main terminal.
- **Unified Theme Engine:** All colors, prefixes, and typography are centrally managed by a `theme` object. This guarantees perfect visual harmony (e.g., Green for `DONE`, Red for `BLOCKED`, Cyan for Task IDs).
- **Graceful Failure UI:** If a task throws an error, the CLI gracefully aborts the spinner and renders an AI Handoff Prompt.

---

## 🤖 AI Handoff Prompts

When a task changes state and requires action, the CLI automatically generates a beautifully bordered box (`clack.note`) explicitly tailored for your AI assistant.

Example (Task Blocked):

```text
◇  Prompt your AI Assistant: ───────────────────────────────────────────╮
│                                                                       │
│  Task T-001 is BLOCKED.                                               │
│  Ask your AI Assistant to read logs/last_run.log and fix the issues.  │
│                                                                       │
├───────────────────────────────────────────────────────────────────────╯
```

This prompt is IDE-agnostic and designed to be copy-pasted directly into Cursor, Roo Code, or Copilot.

---

## 🔗 Dependency Graph (`dependsOn`)

The Task Runner supports a fully resolved dependency graph via the YAML frontmatter in your task files (`tasks/*.md`).

```yaml
---
id: "T-008"
title: "Verify Checkout Completion"
status: "TODO"
dependsOn: ["T-007"]
---
```

**Behavior:**

- If you attempt to activate a task (e.g., `T-008`) while its dependencies (`T-007`) are not marked as `DONE`, the CLI will gracefully block execution and print a clear `Unmet Dependencies` warning box.
- The `dependsOn: []` array gracefully resolves to true, allowing independent tasks to run immediately.

---

## 🛠️ Usage Commands

The Task Runner exposes several commands through `npm run task`.

### 1. Interactive Menu

Running the command with no arguments boots the interactive Clack menu:

```bash
npm run task
```

**Options:**

- `Activate next available task`: Automatically scans the `tasks/` directory, resolves the dependency graph, and activates the next eligible `TODO` task.
- `Mark current task as verified`: Re-runs quality gates (Linter + Tests) on the currently `IN_PROGRESS` or `DONE` task.
- `Show task board status`: Prints a color-coded summary of all tasks and their current states.
- `Show blocked tasks`: Filters and prints all tasks currently in the `BLOCKED` state.

### 2. Specific Task Execution

You can bypass the menu by passing a specific Task ID:

```bash
npm run task T-001
```

This forces the CLI to run verification/activation specifically for that task file.

---

## 🔄 Task Lifecycle

1. **TODO:** The task is waiting to be started.
2. **IN_PROGRESS:** The task has been activated. The AI Agent should read the task requirements and implement the code.
3. **BLOCKED:** The task failed verification (Linter error or failing Playwright test). The AI Agent must read `logs/last_run.log` to fix it.
4. **DONE:** The task passed all verification gates. The frontmatter checkboxes are automatically ticked by the CLI.
