# Agentic Playwright SDET Framework

[![Playwright](https://img.shields.io/badge/Playwright-1.41.0-2ead34?logo=playwright)](https://playwright.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-3178c6?logo=typescript)](https://www.typescriptlang.org)
[![ESLint](https://img.shields.io/badge/ESLint-8.56.0-4b32c3?logo=eslint)](https://eslint.org)
[![Node](https://img.shields.io/badge/Node-18+-339933?logo=nodedotjs)](https://nodejs.org)

## Smart Playwright Protocol (SPP) v2.0

AI-assisted Playwright automation using a structured, protocol-driven workflow. This framework keeps human-AI collaboration explicit, reviewable, and repeatable.

## Protocol Workflow

The framework enforces a single, disciplined workflow for all automation tasks:

```text
Understand
    ↓
Explore
    ↓
Plan
    ↓
Implement
    ↓
Verify
    ↓
PASS → DONE
FAIL → BLOCKED
           ↓
        Recover
```

## Quick Start

Get started and complete your first task in minutes.

### 1. Installation

Clone the repository and install dependencies:

```bash
npm install
npx playwright install
```

### 2. Configure MCP Servers (Required for AI)

This framework relies on MCP servers to let AI agents explore the browser and manage tasks.
**See [docs/CLI.md](docs/CLI.md#configure-mcp-servers) for setup instructions.**

### 3. Create Your First Task

Launch the interactive wizard to generate a new task file:

```bash
npm run task create
```

### 4. Activate the Task

Select and move the task to `IN_PROGRESS`. This automatically copies an AI handoff prompt to your clipboard:

```bash
npm run task next
```

### 5. Hand Off to AI

Paste the copied prompt into your AI assistant. The assistant will:

- Read [docs/PROTOCOL.md](docs/PROTOCOL.md).
- Follow the SPP workflow.
- Implement Page Objects and tests.

### 6. Verify Completion

Once the AI finishes, run the verification gate:

```bash
npm run task T-###
```

## Documentation

| File | Purpose |
| :--- | :--- |
| [docs/PROTOCOL.md](docs/PROTOCOL.md) | **Architectural source of truth**: workflow, states, and rules. |
| [docs/CLI.md](docs/CLI.md) | **Command reference**: tools, menu, board, and troubleshooting. |
| [AGENTS.md](AGENTS.md) | Lightweight instructions for AI assistants. |
