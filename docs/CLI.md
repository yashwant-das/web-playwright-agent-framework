# Smart Playwright Protocol CLI

`scripts/task.ts` is the local CLI that moves Markdown task files through the framework lifecycle. Use this document when you need exact command behavior, board usage, and configuration.

> [!NOTE]
> For first-time setup and onboarding, start with [README.md](../README.md). For the architectural source of truth (workflow, states, rules), see [PROTOCOL.md](PROTOCOL.md).

## Commands

| Command | Purpose |
| :--- | :--- |
| `npm run task` | Open the interactive task menu. |
| `npm run task create` | Launch the task creation wizard. |
| `npm run task next` | Activate or resume the next eligible task. |
| `npm run task status` | Show project task summary and board. |
| `npm run task blocked` | List all tasks currently in BLOCKED state. |
| `npm run task <TASK_ID>` | Activate, verify, or re-verify one specific task. |

## Interactive Menu

Run:

```bash
npm run task
```

Available menu actions:

| Action | Behavior |
| :--- | :--- |
| `Create a new task` | Launches the interactive wizard to generate a new task file. |
| `Activate or resume next task` | Selects the current active task first, then the next dependency-ready `TODO` task. Copies the AI handoff prompt to the clipboard. |
| `Verify current active task` | Runs verification for the current active task. Copies a repair prompt if verification fails. |
| `Show task board` | Prints task summary, active task, and recent tasks. |
| `Show blocked tasks` | Lists tasks currently marked `BLOCKED` with reasons. |

## Task Creation Wizard

Run `npm run task create` to start the interactive task generator. It prompts for:

- **Task ID**: Must follow `T-###`.
- **Title**: Descriptive name for the task.
- **Page Object**: (Optional) The target Page Object name.
- **Test File**: (Optional) The target spec file path.
- **URL**: (Optional) The starting URL.
- **Acceptance Criteria**: (Optional) Comma-separated list of requirements.

The wizard generates an SPP v2 compliant Markdown file in `tasks/`.

## AI Handoff Prompts

When a task is activated or blocked, the runner generates a concise prompt for the AI assistant and **automatically copies it to your clipboard**.

### Activation Prompt

Generated when a task moves to `IN_PROGRESS`. Includes protocol instructions and the task file path.

### Repair Prompt

Generated when verification fails and the task moves to `BLOCKED`. Points the agent to `logs/last_run.log` and instructs them to fix the smallest possible issue.

> [!TIP]
> After activating a task or seeing a failure, simply switch to your AI assistant's chat and paste (Ctrl+V/Cmd+V) to provide all necessary context.

## Task Board & Status

`npm run task status` provides a summary of the current project state:

- **Summary Counts:** Total tasks by state (`TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`).
- **Current Task:** The task currently being worked on.
- **Recent Tasks:** A list of the most recently modified tasks.

## Verification & Logs

The runner executes quality gates for `IN_PROGRESS` and `BLOCKED` tasks.

### Command

```bash
npm run task <TASK_ID>
```

Example:

```bash
npm run task T-011
```

This runs `npm run lint` and `npm test <declared-test-file>`.

### Logs

The runner writes command output to:

```text
logs/last_run.log
```

The log includes stdout, stderr, lint failures, and Playwright failures. **Always read this file when a task becomes `BLOCKED`.**

## Configure MCP Servers

The framework supports MCP servers to improve the AI assistant experience.

### Official Playwright MCP (Recommended)

Used for browser exploration and selector validation.

```json
"playwright": {
  "command": "npx",
  "args": ["-y", "@playwright/mcp@latest"]
}
```

### SPP Lifecycle MCP (Optional / Experimental)

Provides tools for programmatic task lifecycle management.

```json
"spp-protocol": {
  "command": "npx",
  "args": ["tsx", "/absolute/path/to/repo/mcp/server.ts"],
  "env": {
    "NODE_OPTIONS": "--disable-warning=DEP0205"
  }
}
```

### Automated Setup Prompt

If you want the AI assistant to configure the MCP servers for you automatically, copy and paste the following prompt into your AI assistant's chat window:

```text
Please register the following MCP servers in my IDE's MCP configuration file:

1. **Official Playwright MCP** (for browser exploration and selector verification):
   "command": "npx",
   "args": ["-y", "@playwright/mcp@latest"]

2. **SPP Lifecycle MCP** (for task lifecycle management):
   - Determine the absolute path to `mcp/server.ts` in the current workspace.
   "command": "npx",
   "args": ["tsx", "<ABSOLUTE_PATH_TO_mcp/server.ts>"],
   "env": { "NODE_OPTIONS": "--disable-warning=DEP0205" }

Configuration file locations:
- Antigravity IDE: `~/.gemini/config/mcp_config.json`
- Gemini CLI: `~/.gemini/settings.json`
- Cursor: `.cursor/mcp.json` in the project root
- VS Code: `.vscode/mcp.json` in the workspace root
Read the existing configuration if it exists; otherwise, initialize a new one. Add or update the MCP server entries without removing any existing servers, write the updated configuration, and confirm once completed.
```

### Manual Configuration

Add both servers to your IDE's MCP configuration file:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    },
    "spp-protocol": {
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

## Troubleshooting

### `Task <ID> not found`

Check that the task file is in `tasks/` and its filename starts with the task ID (e.g., `T-011_...md`).

### `No Test File found`

Ensure the task body includes exactly one line like this:
`- **Test File:** tests/example.spec.ts`

### MCP Server Does Not Start

Test the **SPP Lifecycle MCP** server manually:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1"}}}' | npm run mcp
```

## Related Files

| File | Purpose |
| :--- | :--- |
| [../README.md](../README.md) | Onboarding and quick start. |
| [PROTOCOL.md](PROTOCOL.md) | **Architectural source of truth**: workflow, states, and rules. |
| [ROADMAP.md](ROADMAP.md) | Future enhancements and planned improvements. |
| [../AGENTS.md](../AGENTS.md) | Lightweight instructions for AI assistants. |
| [../scripts/task.ts](../scripts/task.ts) | Task runner implementation. |
| [../mcp/server.ts](../mcp/server.ts) | Custom protocol lifecycle MCP server. |
