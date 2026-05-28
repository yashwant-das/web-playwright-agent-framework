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
    taskId: (id: string) => pc.bold(`[${id}]`),
    title: (text: string) => pc.bold(text),
    step: (text: string) => pc.dim(text),
    success: (text: string) => pc.green(text),
    error: (text: string) => pc.red(text),
    noteTitle: (text: string) => pc.bold(text),
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

    mkLog(`\n[${actualTaskId}] Task selected: ${task.title}`);
    log.step(`${theme.taskId(actualTaskId)} ${theme.title(task.title)}`);

    let s: ReturnType<typeof clackSpinner> | undefined;

    try {
        if (task.status === 'TODO') {
            log.step(`Status: ${theme.status('TODO')}. Moving task to ${theme.status('IN_PROGRESS')}.`);
            updateTaskStatus(filePath, task.content, 'IN_PROGRESS');
            
            note(
                `Task ${actualTaskId} is now IN_PROGRESS.\nAsk your AI assistant to read AGENTS.md and tasks/${task.file}, then implement the requirements.`,
                theme.noteTitle('AI handoff')
            );
        }
        else if (task.status === 'IN_PROGRESS' || task.status === 'BLOCKED') {
            log.step(`Status: ${theme.status(task.status)}. Running verification.`);
            
            s = clackSpinner();
            s.start('Running lint');
            await runCmd('npm run lint');
            s.stop(theme.success('Lint passed'));

            const testFileMatch = task.content.match(/- \*\*Test File:\*\* `(.*)`/);
            if (!testFileMatch) {
                log.error(theme.error('Task does not declare a test file. Cannot verify.'));
                throw new Error("No Test File found");
            }
            const testFile = testFileMatch[1];
            
            s = clackSpinner();
            s.start(`Running Playwright test: ${testFile}`);
            await runCmd(`npm test ${testFile}`);
            s.stop(theme.success('Test passed'));

            log.success(theme.success('Verification passed. Marking task DONE.'));
            updateTaskStatus(filePath, task.content, 'DONE');
        }
        else if (task.status === 'DONE') {
            log.step(`Status: ${theme.status('DONE')}. Re-running verification.`);
            
            s = clackSpinner();
            s.start('Running lint');
            await runCmd('npm run lint');
            s.stop(theme.success('Lint passed'));

            const testFileMatch = task.content.match(/- \*\*Test File:\*\* `(.*)`/);
            const cmd = testFileMatch ? `npm test ${testFileMatch[1]}` : 'npm test';
            
            s = clackSpinner();
            s.start('Running tests');
            await runCmd(cmd);
            s.stop(theme.success('Verification passed. Task remains DONE.'));
        }
    } catch (e) {
        if (s) {
            s.stop(theme.error('Command failed.'));
        }
        log.error(theme.error('Verification failed.'));
        updateTaskStatus(filePath, task.content, 'BLOCKED');
        note(
            `Task ${actualTaskId} is now BLOCKED.\nAsk your AI assistant to read logs/last_run.log and fix the issue.\nOnce fixed, retry: npm run task ${actualTaskId}`,
            theme.noteTitle('Repair required')
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
                log.info('No eligible tasks found. Resolve blocked work or add a TODO task.');
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
                    `The following tasks must be marked as DONE first:\n${unmetDeps.map(d => `- ${d}`).join('\n')}`,
                    theme.noteWarning('Unmet Dependencies')
                );
                process.exit(1);
            }
            await processTask(target);
            process.exit(0);
        }
    }

    intro(pc.bold('Agentic Playwright Task CLI'));
    const command = await select({
        message: 'What would you like to do?',
        options: [
            { value: 'next',     label: 'Activate or resume next task' },
            { value: 'verify',   label: 'Verify current active task' },
            { value: 'status',   label: 'Show task board' },
            { value: 'blocked',  label: 'Show blocked tasks' },
        ]
    });

    if (command === 'next' || command === 'verify') {
        const next = getNextTask(tasks);
        if (!next) {
            log.info('No eligible tasks found.');
        } else {
            await processTask(next);
        }
    } else if (command === 'status') {
        log.info('Task board');
        tasks.forEach(t => {
            log.message(`  ${theme.taskId(t.id)} ${t.title} (${theme.status(t.status)})`);
        });
    } else if (command === 'blocked') {
        const blocked = tasks.filter(t => t.status === 'BLOCKED');
        if (blocked.length === 0) log.success('No blocked tasks.');
        else {
            blocked.forEach(t => {
                log.error(`[${t.id}] ${t.title} - Check logs/last_run.log`);
            });
        }
    }

    outro('Complete.');
}

main().catch(console.error);
