import fs from 'fs';
import path from 'path';

const DOCS_MAPPING = [
  {
    source: '../docs/PROTOCOL.md',
    target: 'src/content/docs/protocol.md',
    metadata: {
      title: 'Protocol',
      description: 'The architectural source of truth for the Smart Playwright Protocol.',
    }
  },
  {
    source: '../docs/CLI.md',
    target: 'src/content/docs/cli.md',
    metadata: {
      title: 'CLI',
      description: 'Command reference for the Smart Playwright Protocol CLI.',
    }
  },
  {
    source: '../docs/ROADMAP.md',
    target: 'src/content/docs/roadmap.md',
    metadata: {
      title: 'Roadmap',
      description: 'Future enhancements and planned improvements for SPP.',
    }
  },
  {
    source: '../AGENTS.md',
    target: 'src/content/docs/agents.md',
    metadata: {
      title: 'AI Agents',
      description: 'Instructions and expectations for AI assistants interacting with SPP.',
    }
  },
  {
    source: '../README.md',
    target: 'src/content/docs/quick-start.md',
    metadata: {
      title: 'Quick Start',
      description: 'Get started with Smart Playwright Protocol in under 5 minutes.',
    }
  }
];

function rewriteLinks(content) {
  // Rewrite internal .md links to Starlight slugs
  // e.g., [Protocol](docs/PROTOCOL.md) -> [Protocol](/test-playwright-protocol/protocol/)
  // e.g., [CLI](CLI.md) -> [CLI](/test-playwright-protocol/cli/)
  
  return content
    .replace(/\[([^\]]+)\]\(docs\/PROTOCOL\.md\)/g, '[$1](/test-playwright-protocol/protocol/)')
    .replace(/\[([^\]]+)\]\(PROTOCOL\.md\)/g, '[$1](/test-playwright-protocol/protocol/)')
    .replace(/\[([^\]]+)\]\(docs\/CLI\.md\)/g, '[$1](/test-playwright-protocol/cli/)')
    .replace(/\[([^\]]+)\]\(CLI\.md\)/g, '[$1](/test-playwright-protocol/cli/)')
    .replace(/\[([^\]]+)\]\(docs\/ROADMAP\.md\)/g, '[$1](/test-playwright-protocol/roadmap/)')
    .replace(/\[([^\]]+)\]\(ROADMAP\.md\)/g, '[$1](/test-playwright-protocol/roadmap/)')
    .replace(/\[([^\]]+)\]\(AGENTS\.md\)/g, '[$1](/test-playwright-protocol/agents/)')
    .replace(/\[([^\]]+)\]\(\.\.\/AGENTS\.md\)/g, '[$1](/test-playwright-protocol/agents/)')
    .replace(/\[([^\]]+)\]\(README\.md\)/g, '[$1](/test-playwright-protocol/quick-start/)');
}

function sync() {
  console.log('🔄 Syncing documentation from root...');
  
  for (const { source, target, metadata } of DOCS_MAPPING) {
    const sourcePath = path.resolve(source);
    const targetPath = path.resolve(target);
    
    if (!fs.existsSync(sourcePath)) {
      console.warn(`⚠️ Source file not found: ${source}`);
      continue;
    }
    
    let content = fs.readFileSync(sourcePath, 'utf-8');
    
    // Remove the first H1 if it's the same as the title (Starlight adds its own)
    content = content.replace(/^# .*\n/, '');
    
    // Rewrite links
    content = rewriteLinks(content);
    
    // Add tip alert for CLI.md relative paths
    if (source.includes('CLI.md')) {
      content = content.replace(/> \[!TIP\]/, ':::tip');
      content = content.replace(/> After activating/, 'After activating');
      content = content.replace(/:::tip\n:::tip/, ':::tip');
    }

    const frontmatter = [
      '---',
      `title: ${metadata.title}`,
      `description: ${metadata.description}`,
      '---',
      '',
      ''
    ].join('\n');
    
    fs.writeFileSync(targetPath, frontmatter + content);
    console.log(`✅ Synced ${source} -> ${target}`);
  }
}

sync();
