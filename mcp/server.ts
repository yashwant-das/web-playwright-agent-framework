import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import fm from 'front-matter';
import { Task } from '../types/task';

// ---------------------------------------------------------------------------
// Server Setup
// ---------------------------------------------------------------------------

const server = new McpServer({
    name: 'task-framework',
    version: '1.0.0',
});

const TASKS_DIR = path.resolve(__dirname, '../tasks');
const LOG_DIR = path.resolve(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'last_run.log');

// ---------------------------------------------------------------------------
// Protocol-safe logging — stdout is reserved for JSON-RPC messages.
// All diagnostics MUST go to stderr or a log file.
// ---------------------------------------------------------------------------

function log(msg: string): void {
    console.error(`[task-framework] ${msg}`);
}

function logToFile(msg: string): void {
    if (!fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    fs.appendFileSync(LOG_FILE, msg + '\n');
}

// ---------------------------------------------------------------------------
// Shell Command Runner (with logging)
// ---------------------------------------------------------------------------

function runCmd(command: string): Promise<string> {
    logToFile(`\n> ${command}\n`);
    return new Promise((resolve, reject) => {
        exec(
            command,
            { cwd: path.resolve(__dirname, '..'), timeout: 120_000 },
            (error, stdout, stderr) => {
                if (stdout) logToFile(stdout);
                if (stderr) logToFile(stderr);
                if (error) {
                    reject(
                        new Error(
                            `Command failed: ${command}\n${stderr || stdout}`,
                        ),
                    );
                } else {
                    resolve(stdout);
                }
            },
        );
    });
}

// ---------------------------------------------------------------------------
// Security: Strict test-file path validation to prevent shell injection
// ---------------------------------------------------------------------------

const SAFE_TEST_PATH = /^[a-zA-Z0-9_\-./]+\.spec\.ts$/;

function validateTestFilePath(
    testFile: string,
): { valid: true; absolute: string } | { valid: false; reason: string } {
    if (!SAFE_TEST_PATH.test(testFile)) {
        return {
            valid: false,
            reason: `Invalid test file path format: "${testFile}". Must match pattern: <name>.spec.ts with only alphanumeric, dash, underscore, dot, and slash characters.`,
        };
    }
    // Prevent directory traversal
    if (testFile.includes('..')) {
        return {
            valid: false,
            reason: `Path traversal detected in test file path: "${testFile}".`,
        };
    }
    const absolute = path.resolve(__dirname, '..', testFile);
    if (!fs.existsSync(absolute)) {
        return {
            valid: false,
            reason: `Test file does not exist on disk: "${testFile}".`,
        };
    }
    return { valid: true, absolute };
}

// ---------------------------------------------------------------------------
// Task Helpers
// ---------------------------------------------------------------------------

type TaskWithMeta = Task & { file: string; content: string };

function getAllTasks(): TaskWithMeta[] {
    const files = fs
        .readdirSync(TASKS_DIR)
        .filter((f) => f.endsWith('.md') && f !== 'template.md');

    const tasks: TaskWithMeta[] = [];
    for (const f of files) {
        try {
            const content = fs.readFileSync(path.join(TASKS_DIR, f), 'utf8');
            const parsed = fm<Task>(content);
            tasks.push({
                ...parsed.attributes,
                id: f.split('_')[0],
                file: f,
                content,
            });
        } catch (err: any) {
            log(`Failed to parse front-matter in task file tasks/${f}: ${err.message || err}`);
        }
    }
    return tasks;
}

function updateTaskStatus(
    filePath: string,
    fullContent: string,
    newStatus: string,
): void {
    let updated = fullContent.replace(
        /status: ".*"/,
        `status: "${newStatus}"`,
    );
    if (newStatus === 'DONE') {
        updated = updated.replace(/- \[ \]/g, '- [x]');
    }
    fs.writeFileSync(filePath, updated);
}

function findTask(
    taskId: string,
): TaskWithMeta | { error: string } {
    const tasks = getAllTasks();
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return { error: `Task ${taskId} not found.` };
    return target;
}

function errorResponse(text: string) {
    return { content: [{ type: 'text' as const, text }], isError: true };
}

function textResponse(text: string) {
    return { content: [{ type: 'text' as const, text }] };
}

// ---------------------------------------------------------------------------
// Tool: activate_task
// ---------------------------------------------------------------------------

server.tool(
    'activate_task',
    'Transition a task from TODO to IN_PROGRESS. Checks that all tasks listed in dependsOn are DONE before allowing activation. Returns an error if the task has unmet dependencies.',
    {
        taskId: z
            .string()
            .regex(/^T-\d{3}$/, 'Must be in the format T-### (e.g. T-001)')
            .describe('The task ID to activate, e.g. T-001'),
    },
    async ({ taskId }) => {
        log(`activate_task called for ${taskId}`);

        const result = findTask(taskId);
        if ('error' in result) return errorResponse(result.error);
        const target = result;

        // Enforce dependency chain
        const allTasks = getAllTasks();
        const done = new Set(
            allTasks.filter((t) => t.status === 'DONE').map((t) => t.id),
        );
        const unmetDeps = (target.dependsOn ?? []).filter(
            (dep) => !done.has(dep),
        );

        if (unmetDeps.length > 0) {
            return errorResponse(
                `Cannot activate ${taskId}. Unmet dependencies: ${unmetDeps.join(', ')}. Those tasks must be DONE first.`,
            );
        }

        if (target.status !== 'TODO') {
            return errorResponse(
                `Task ${taskId} is currently ${target.status}. Only TODO tasks can be activated.`,
            );
        }

        updateTaskStatus(
            path.join(TASKS_DIR, target.file),
            target.content,
            'IN_PROGRESS',
        );

        return textResponse(
            `Task ${taskId} is now IN_PROGRESS. Please read AGENTS.md, then read tasks/${target.file}, implement the requirements, and finally call verify_task.`
        );
    },
);

// ---------------------------------------------------------------------------
// Tool: verify_task
// ---------------------------------------------------------------------------

server.tool(
    'verify_task',
    'Run automated quality gates (ESLint linting and Playwright tests) for a task. If both gates pass, the task transitions to DONE. If either gate fails, the task transitions to BLOCKED and the failure details are written to logs/last_run.log.',
    {
        taskId: z
            .string()
            .regex(/^T-\d{3}$/, 'Must be in the format T-### (e.g. T-001)')
            .describe('The task ID to verify, e.g. T-001'),
        notes: z
            .string()
            .optional()
            .describe('Optional completion notes to attach to the result'),
    },
    async ({ taskId, notes }) => {
        log(`verify_task called for ${taskId}`);

        const result = findTask(taskId);
        if ('error' in result) return errorResponse(result.error);
        const target = result;
        const filePath = path.join(TASKS_DIR, target.file);

        // Re-read content fresh (task may have been modified since getAllTasks)
        const freshContent = fs.readFileSync(filePath, 'utf8');

        // Clear the log file for this verification run
        logToFile(`\n${'='.repeat(60)}\n[${taskId}] MCP verification started at ${new Date().toISOString()}\n${'='.repeat(60)}`);
        fs.writeFileSync(LOG_FILE, `--- Verification Run Started for ${taskId} ---\n`);

        try {
            // ── Gate 1: Lint ──────────────────────────────────────────
            log(`[${taskId}] Running lint...`);
            logToFile(`[${taskId}] Running lint checks...`);
            await runCmd('npm run lint');
            logToFile(`[${taskId}] ✓ Lint passed`);

            // ── Gate 2: Playwright Tests ──────────────────────────────
            const testFileMatch = freshContent.match(
                /- \*\*Test File:\*\* `(.*)`/,
            );
            if (!testFileMatch) {
                throw new Error(
                    `Task ${taskId} does not declare a test file in its body. ` +
                    'Expected a line like: - **Test File:** `tests/example.spec.ts`',
                );
            }
            const testFile = testFileMatch[1];

            // Security: validate the extracted path before passing to shell
            const validation = validateTestFilePath(testFile);
            if (!validation.valid) {
                throw new Error(
                    `Security: ${validation.reason}`,
                );
            }

            log(`[${taskId}] Running tests: ${testFile}`);
            logToFile(`[${taskId}] Running Playwright tests: ${testFile}`);
            await runCmd(`npm test ${testFile}`);
            logToFile(`[${taskId}] ✓ Tests passed`);

            // ── Both gates passed: mark DONE ──────────────────────────
            updateTaskStatus(filePath, freshContent, 'DONE');
            log(`[${taskId}] Verification passed → DONE`);
            logToFile(`[${taskId}] Verification PASSED. Status → DONE`);

            return textResponse(
                [
                    `Task ${taskId} passed all quality gates and is now DONE.`,
                    '',
                    'Gates passed:',
                    '  ✓ ESLint (lint:code + lint:md)',
                    `  ✓ Playwright tests (${testFile})`,
                    notes ? `\nNotes: ${notes}` : '',
                ]
                    .filter(Boolean)
                    .join('\n'),
            );
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : String(err);

            // Gate failure: mark BLOCKED
            updateTaskStatus(filePath, freshContent, 'BLOCKED');
            log(`[${taskId}] Verification failed → BLOCKED`);
            logToFile(
                `[${taskId}] Verification FAILED. Status → BLOCKED\nError: ${message}`,
            );

            return errorResponse(
                [
                    `Error: ${message}`,
                    '',
                    `Task ${taskId} is now BLOCKED. Verification failed. Please read logs/last_run.log for full diagnostic output and fix the failing code or selectors. Once fixed, call verify_task again with taskId ${taskId}.`
                ].join('\n')
            );
        }
    },
);

// ---------------------------------------------------------------------------
// Tool: list_tasks
// ---------------------------------------------------------------------------

server.tool(
    'list_tasks',
    'List all tasks with their current status, title, and dependency information. Optionally filter by status. Use this to get a full overview of the task board.',
    {
        status: z
            .enum(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED'])
            .optional()
            .describe(
                'Optional filter: only return tasks matching this status',
            ),
    },
    async ({ status }) => {
        log(`list_tasks called${status ? ` (filter: ${status})` : ''}`);

        const allTasks = getAllTasks();
        const done = new Set(
            allTasks.filter((t) => t.status === 'DONE').map((t) => t.id),
        );
        const tasks = status
            ? allTasks.filter((t) => t.status === status)
            : allTasks;

        if (tasks.length === 0) {
            return textResponse(
                status
                    ? `No tasks with status ${status}.`
                    : 'No tasks found.',
            );
        }

        const lines = tasks.map((t) => {
            const deps = t.dependsOn ?? [];
            const unmetDeps = deps.filter((dep) => !done.has(dep));
            const depInfo =
                deps.length === 0
                    ? ''
                    : unmetDeps.length > 0
                      ? ` | Blocked by: ${unmetDeps.join(', ')}`
                      : ` | Dependencies met`;
            return `[${t.id}] ${t.title} (${t.status})${depInfo}`;
        });

        return textResponse(lines.join('\n'));
    },
);

// ---------------------------------------------------------------------------
// Tool: get_unmet_dependencies
// ---------------------------------------------------------------------------

server.tool(
    'get_unmet_dependencies',
    'List tasks that cannot be activated because they are waiting on unmet dependencies. A task is in this list when one or more tasks in its dependsOn list are not yet DONE.',
    {},
    async () => {
        log('get_unmet_dependencies called');

        const tasks = getAllTasks();
        const done = new Set(
            tasks.filter((t) => t.status === 'DONE').map((t) => t.id),
        );
        const blocked = tasks.filter(
            (t) =>
                t.status !== 'DONE' &&
                (t.dependsOn ?? []).some((dep) => !done.has(dep)),
        );

        if (blocked.length === 0) {
            return textResponse('No blocked tasks.');
        }

        const text = blocked
            .map((t) => {
                const unmet = (t.dependsOn ?? []).filter(
                    (dep) => !done.has(dep),
                );
                return `[${t.id}] ${t.title} — Waiting on: ${unmet.join(', ')}`;
            })
            .join('\n');

        return textResponse(text);
    },
);

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    log('Task-framework MCP server connected and ready.');
}

main().catch((err) => {
    // Protocol-safe: only stderr, never stdout
    console.error('Fatal: MCP server failed to start:', err);
    process.exit(1);
});
