import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import fm from 'front-matter';
import { Task } from '../types/task';

const server = new McpServer({ name: 'task-framework', version: '1.0.0' });
const TASKS_DIR = path.join(__dirname, '../tasks');

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

function updateTaskStatus(filePath: string, fullContent: string, newStatus: string) {
    let newContent = fullContent.replace(/status: ".*"/, `status: "${newStatus}"`);
    if (newStatus === 'DONE') {
        newContent = newContent.replace(/- \[ \]/g, '- [x]');
    }
    fs.writeFileSync(filePath, newContent);
}

server.tool('activateTask', {
  taskId: z.string().regex(/^T-\d{3}$/),
}, async ({ taskId }) => {
  const tasks = getAllTasks();
  const target = tasks.find(t => t.id === taskId);
  if (!target) return { content: [{ type: 'text', text: `Task ${taskId} not found` }], isError: true };

  const done = new Set(tasks.filter(t => t.status === 'DONE').map(t => t.id));
  const unmetDeps = (target.dependsOn ?? []).filter(dep => !done.has(dep));
  
  if (unmetDeps.length > 0) {
      return { content: [{ type: 'text', text: `Cannot activate ${taskId}. Unmet dependencies: ${unmetDeps.join(', ')}` }], isError: true };
  }

  updateTaskStatus(path.join(TASKS_DIR, target.file), target.content, 'IN_PROGRESS');
  return { content: [{ type: 'text', text: `Task ${taskId} is now IN_PROGRESS.\n\nCRITICAL ENFORCEMENT: Before implementing this task, you MUST review AGENTS.md for strict coding guidelines and definitions of done.` }] };
});

server.tool('verifyTask', {
  taskId: z.string().regex(/^T-\d{3}$/),
  notes: z.string().optional(),
}, async ({ taskId, notes }) => {
  const tasks = getAllTasks();
  const target = tasks.find(t => t.id === taskId);
  if (!target) return { content: [{ type: 'text', text: `Task ${taskId} not found` }], isError: true };

  updateTaskStatus(path.join(TASKS_DIR, target.file), target.content, 'DONE');
  return { content: [{ type: 'text', text: `Task ${taskId} is now DONE. Notes: ${notes || 'none'}\n\nWARNING: You bypassed the automated quality gates (Linter & Tests). In the future, prefer running 'npm run task ${taskId}' in the terminal for strict verification.` }] };
});

server.tool('getBlockedTasks', {}, async () => {
  const tasks = getAllTasks();
  const done = new Set(tasks.filter(t => t.status === 'DONE').map(t => t.id));
  const blocked = tasks.filter(t => t.status !== 'DONE' && (t.dependsOn ?? []).some(dep => !done.has(dep)));
  
  const text = blocked.map(t => `[${t.id}] ${t.title} - Waiting on: ${(t.dependsOn ?? []).filter(dep => !done.has(dep)).join(', ')}`).join('\n') || 'No blocked tasks';
  return { content: [{ type: 'text', text }] };
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch(console.error);
