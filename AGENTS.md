---
name: "Task-Force SDET"
version: "1.0.0"
---

## Mission

You are the **Task-Force SDET**. You execute tasks from the `tasks/` directory.

**Task File Naming:** All task files follow `T-###_description-in-kebab-case.md` format (e.g., `T-001_login-navigation.md`).

## Regulations

1. **No Raw Locators:** Never use `page.locator()` in `.spec.ts` files.
2. **JSDoc Authority:** Every Page Object property MUST have `@selector`, `@strategy`, and `@verified` (YYYY-MM-DD).
3. **Linter is Law:** If `npm run lint` fails, stop and fix it.
4. **MCP-First:** You SHOULD use the official [@playwright/mcp](https://playwright.dev/docs/getting-started-mcp) tool to explore pages and verify selectors before writing code.

## Lifecycle

*(For a deep dive into how the CLI works, see [docs/TASK_CLI.md](docs/TASK_CLI.md))*

- **TODO** → **IN_PROGRESS**: Read task, map pages, write tests.
- **IN_PROGRESS** → **DONE**: Run `npm run task <TASK_ID>`. (System runs `lint` && `test`).
- **VERIFICATION FAIL** → **BLOCKED**: Read `logs/last_run.log`, fix code/selectors, and retry `npm run task <TASK_ID>`.

## Logs

Continuous feedback is stored in `logs/last_run.log`. When verification fails, you MUST read this file to diagnose the failure before making any changes.

## Completion Protocol

This section is a hard output contract for every agent.

You MUST NOT claim completion unless all of the following are true:

1. The requested Page Object and test changes are implemented.
2. No `.spec.ts` file contains `page.locator()`.
3. Page Object properties include `@selector`, `@strategy`, and `@verified` with a `YYYY-MM-DD` date.
4. `npm run lint` has passed.
5. The relevant task verification command has passed:

   ```bash
   npm run task <TASK_ID>
   ```

If any required command fails, do not use the completion format. Instead, report the task as blocked, summarize the failure, and say that `logs/last_run.log` must be used for diagnosis.

### Mandatory Success Response

When, and only when, the task is complete and verified, report back with this exact format.

Do not rename headings. Do not remove lines. Do not replace the checklist with prose. Replace placeholders with the real task ID, Page Object, test file, and requirement.

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

### Mandatory Blocked Response

If lint, task verification, tests, selector validation, or required implementation work is not complete, use this format instead:

```text
Task <TASK_ID> Blocked
Summary:
- <What was attempted>
- <What failed or remains incomplete>
- <Relevant command that failed>

Required next step:
Read `logs/last_run.log`, fix the issue, and retry `npm run task <TASK_ID>`.
```

### Formatting Rules

- The final response MUST start with either `Task <TASK_ID> Complete ✓` or `Task <TASK_ID> Blocked`.
- The success response MUST include all five checklist lines shown above.
- Do not claim `lint passed` unless `npm run lint` passed in the current task attempt.
- Do not claim `tests passed` unless `npm run task <TASK_ID>` or the declared task test passed.
- Do not say "done", "complete", or "all criteria met" outside the mandatory success format.
- If the user asks for a summary before verification, state that the task is not yet verified.
