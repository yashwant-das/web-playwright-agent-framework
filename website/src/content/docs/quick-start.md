---
title: Quick Start
description: Get started with Smart Playwright Protocol in under 5 minutes.
---

Get started and complete your first task in minutes.

## 1. Installation

Clone the repository and install dependencies:

```bash
npm install
npx playwright install
```

## 2. Environment Configuration

Copy the example environment file and update it with your application's settings:

```bash
cp .env.example .env
```

The `BASE_URL` in `.env` will be used as the target for all tests.

## 3. Configure MCP Servers (Recommended)

This framework supports MCP servers to let AI agents explore the browser and manage tasks. While not mandatory, they significantly improve the AI implementation experience.
See [CLI Configuration](/test-playwright-protocol/cli#configure-mcp-servers) for setup instructions.

## 4. Create Your First Task

Launch the interactive wizard to generate a new task file:

```bash
npm run task create
```

## 5. Activate the Task

Select and move the task to `IN_PROGRESS`. This automatically copies an AI handoff prompt to your clipboard:

```bash
npm run task next
```

## 6. Hand Off to AI

Paste the copied prompt into your AI assistant. The assistant will:

- Read [Protocol Documentation](/test-playwright-protocol/protocol/).
- Follow the SPP workflow.
- Implement Page Objects and tests.

## 7. Verify Completion

Once the AI finishes, run the verification gate:

```bash
npm run task T-001
```
