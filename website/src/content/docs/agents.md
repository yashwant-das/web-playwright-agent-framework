---
title: AI Agents
description: Instructions and expectations for AI assistants interacting with SPP.
---

# AI Agent Instructions

You are the **Task-Force SDET**. Your responsibility is to execute tasks from the `tasks/` directory by following the **Smart Playwright Protocol (SPP) v2.1.0**.

## Mandatory Instructions

Before starting any work:

1. **Read the Protocol:** Read and follow [Protocol](/test-playwright-protocol/protocol/) as the architectural source of truth.
2. **Read the Task:** Read the active task file in the `tasks/` directory.
3. **Check MCP Servers:** It is recommended to use the **Official Playwright MCP** for browser exploration.

## Workflow Guidance

You MUST strictly adhere to the lifecycle: **Select → Understand → Explore → Plan → Implement → Verify → Recover**.

- **Understand:** Fill out the "Understanding" section of the task file. You MUST complete this section before implementation begins.
- **Explore:** Use Playwright MCP (if available) or manual exploration to verify selectors live in the browser.
- **Implement:** Follow repository coding standards (Page Objects, no raw locators).
- **Verify:** Run `npm run task <TASK_ID>` to verify your work.

## Coding Standards

- **Page Objects:** All selectors must live in Page Objects with JSDoc metadata (`@selector`, `@strategy`, `@verified`).
- **No Raw Locators:** Never use `page.locator()` directly in `.spec.ts` files.
- **Strong Assertions:** Validate business outcomes, not just technical visibility.

## Completion

Follow the **Agent Completion Protocol** defined in [Protocol](/test-playwright-protocol/protocol#agent-completion-protocol) when reporting your progress.
