import * as fs from 'fs';
import * as path from 'path';
import fm from 'front-matter';
import { intro, outro, select, log, spinner as clackSpinner, note } from '@clack/prompts';
import { Task } from '../types/task';
import { exec } from 'child_process';
import pc from 'picocolors';

const theme = {
    status: (s: string) => {
        if (s === 'DONE') return pc.green(s);
        if (s === 'IN_PROGRESS') return pc.yellow(s);
        if (s === 'BLOCKED') return pc.red(s);
        return pc.blue(s);
    },
    taskId: (id: string) => pc.cyan(pc.bold(`[${id}]`)),
    title: (text: string) => pc.bold(text),
    step: (text: string) => pc.cyan(text),
    success: (text: string) => pc.green(text),
    error: (text: string) => pc.red(text),
    noteTitle: (text: string) => pc.magenta(pc.bold(text)),
    noteWarning: (text: string) => pc.red(pc.bold(text)),
};

const TASKS_DIR = path.join(__dirname, '../tasks');
const LOG_DIR = path.join(process.cwd(), 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);
const LOG_FILE = path.join(LOG_DIR, 'last_run.log');

function mkLog(msg: string) {
    fs.appendFileSync(LOG_FILE, msg + '\n');
}

async function runCmd(command: string): Promise<void> {
    mkLog(`\n> ${command}\n`);
    return new Promise((resolve, reject) => {
        exec(`set -o pipefail && ${command}`, { shell: '/bin/bash' }, (error, stdout, stderr) => {
            if (stdout) mkLog(stdout);
            if (stderr) mkLog(stderr);
            if (error) {
                reject(new Error(`Command failed: ${command}`));
            } else {
                resolve();
            }
        });
    });
}

function getAllTasks(): (Task & { file: string, content: string })[] {
    const files = fs.readdirSync(TASKS_DIR).filter(f => f.endsWith('.md') && f !== 'template.md');
    return files.map(f => {
        const content = fs.readFileSync(path.join(TASKS_DIR, f), 'utf8');
        const parsed = fm<Task>(content);
        return {
            ...parsed.attributes,
            id: f.split('_')[0],
            file: f,
            content
        };
    });
}

function getNextTask(tasks: (Task & { file: string, content: string })[]) {
    const inProgress = tasks.find(t => t.status === 'IN_PROGRESS');
    if (inProgress) return inProgress;

    const done = new Set(tasks.filter(t => t.status === 'DONE').map(t => t.id));
    return tasks
      .filter(t => t.status === 'TODO')
      .filter(t => (t.dependsOn ?? []).every(dep => done.has(dep)))
      .at(0) ?? null;
}

function updateTaskStatus(filePath: string, fullContent: string, newStatus: string) {
    let newContent = fullContent.replace(/status: ".*"/, `status: "${newStatus}"`);
    if (newStatus === 'DONE') {
        newContent = newContent.replace(/- \[ \]/g, '- [x]');
    }
    fs.writeFileSync(filePath, newContent);
}

async function processTask(task: Task & { file: string, content: string }) {
    const filePath = path.join(TASKS_DIR, task.file);
    const actualTaskId = task.id;

    mkLog(`\n[${actualTaskId}] ACTIVATING TASK: ${task.title}`);
    log.step(theme.step(`ACTIVATING TASK ${theme.taskId(actualTaskId)}: ${theme.title(task.title)}`));

    let s: ReturnType<typeof clackSpinner> | undefined;

    try {
        if (task.status === 'TODO') {
            log.step(`Status is ${theme.status('TODO')}. Moving to ${theme.status('IN_PROGRESS')}...`);
            updateTaskStatus(filePath, task.content, 'IN_PROGRESS');
            
            note(
                `Task ${actualTaskId} is IN_PROGRESS.\nUse your AI Assistant (via MCP) to read the task details and implement the requirements.`,
                theme.noteTitle('Prompt your AI Assistant:')
            );
        }
        else if (task.status === 'IN_PROGRESS' || task.status === 'BLOCKED') {
            log.step(`Status is ${theme.status(task.status)}. Running Verification...`);
            
            s = clackSpinner();
            s.start('Running Linter');
            await runCmd('npm run lint');
            s.stop(theme.success('Lint Passed'));

            const testFileMatch = task.content.match(/- \*\*Test File:\*\* `(.*)`/);
            if (!testFileMatch) {
                log.error(theme.error(`No Test File defined in task. Cannot verify.`));
                throw new Error("No Test File found");
            }
            const testFile = testFileMatch[1];
            
            s = clackSpinner();
            s.start(`Running Test: ${testFile}`);
            await runCmd(`npm test ${testFile}`);
            s.stop(theme.success('Verification Passed!'));

            log.success(theme.success(`Moving task to DONE.`));
            updateTaskStatus(filePath, task.content, 'DONE');
        }
        else if (task.status === 'DONE') {
            log.step(`Status is ${theme.status('DONE')}. Re-verifying...`);
            
            s = clackSpinner();
            s.start('Running Linter');
            await runCmd('npm run lint');
            s.stop(theme.success('Lint Passed'));

            const testFileMatch = task.content.match(/- \*\*Test File:\*\* `(.*)`/);
            const cmd = testFileMatch ? `npm test ${testFileMatch[1]}` : 'npm test';
            
            s = clackSpinner();
            s.start(`Running Tests`);
            await runCmd(cmd);
            s.stop(theme.success('Re-Verification Passed! Task remains DONE.'));
        }
    } catch (e) {
        if (s) {
            s.stop(theme.error('Process interrupted or failed.'));
        }
        log.error(theme.error(`Verification Failed.`));
        updateTaskStatus(filePath, task.content, 'BLOCKED');
        note(
            `Task ${actualTaskId} is BLOCKED.\nAsk your AI Assistant to read logs/last_run.log and fix the issues.`,
            theme.noteTitle('Prompt your AI Assistant:')
        );
    }
}

async function main() {
    let argTask = process.argv[2];
    const tasks = getAllTasks();

    if (argTask) {
        if (argTask === 'next') {
            const next = getNextTask(tasks);
            if (!next) {
                log.info("No eligible Pending tasks found (or dependencies blocked).");
                process.exit(0);
            }
            await processTask(next);
            process.exit(0);
        } else {
            const target = tasks.find(t => 
                t.file.toLowerCase().startsWith(argTask.toLowerCase() + '_') || 
                t.id.toLowerCase() === argTask.toLowerCase()
            );
            if (!target) {
                log.error(`Task ${argTask} not found.`);
                process.exit(1);
            }
            const done = new Set(tasks.filter(t => t.status === 'DONE').map(t => t.id));
            const unmetDeps = (target.dependsOn ?? []).filter(dep => !done.has(dep));
            if (unmetDeps.length > 0) {
                log.error(theme.error(`Cannot activate ${target.id}.`));
                note(
                    `The following tasks must be marked as DONE first:\n${unmetDeps.map(d => `• ${d}`).join('\n')}`,
                    theme.noteWarning('Unmet Dependencies')
                );
                process.exit(1);
            }
            await processTask(target);
            process.exit(0);
        }
    }

    intro(pc.bold('Agentic Playwright Task Runner'));
    const command = await select({
        message: 'What would you like to do?',
        options: [
            { value: 'next',     label: 'Activate next available task' },
            { value: 'verify',   label: 'Mark current task as verified (runs tests)' },
            { value: 'status',   label: 'Show task board status' },
            { value: 'blocked',  label: 'Show blocked tasks' },
        ]
    });

    if (command === 'next' || command === 'verify') {
        const next = getNextTask(tasks);
        if (!next) {
            log.info("No eligible tasks to activate.");
        } else {
            await processTask(next);
        }
    } else if (command === 'status') {
        log.info('Task Board Status:');
        tasks.forEach(t => {
            log.message(`  ${theme.taskId(t.id)} ${t.title} (${theme.status(t.status)})`);
        });
    } else if (command === 'blocked') {
        const blocked = tasks.filter(t => t.status === 'BLOCKED');
        if (blocked.length === 0) log.success('No blocked tasks!');
        else {
            blocked.forEach(t => {
                log.error(`[${t.id}] ${t.title} - Check logs/last_run.log`);
            });
        }
    }

    outro('Done.');
}

main().catch(console.error);
