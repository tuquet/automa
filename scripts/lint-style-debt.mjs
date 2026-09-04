import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();

const TARGET_DIRS = [
  'automa-webe/src/studio',
  'automa-webe/src/components',
  'automa-webe/src/assets/css',
  'automa-vsce/webview-ui/src',
  'automa-desk/src',
  'packages/automa-ui/src',
];

const EXTENSIONS = ['.vue', '.css', '.ts', '.html'];

const RULES = [
  {
    id: 'no-hardcoded-gray-bg',
    regex: /\bbg-(?:gray|slate|zinc|neutral|stone)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/g,
    message: 'Hardcoded gray background utility detected. Use semantic tokens (bg-card, bg-muted, bg-accent, bg-background).',
  },
  {
    id: 'no-hardcoded-gray-text',
    regex: /\btext-(?:gray|slate|zinc|neutral|stone)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/g,
    message: 'Hardcoded gray text utility detected. Use semantic tokens (text-foreground, text-muted-foreground, text-accent-foreground).',
  },
  {
    id: 'no-hardcoded-gray-border',
    regex: /\bborder-(?:gray|slate|zinc|neutral|stone)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/g,
    message: 'Hardcoded gray border utility detected. Use semantic tokens (border-border, border-input).',
  },
  {
    id: 'no-legacy-custom-classes',
    regex: /(?:^|[\s"'`])(?:bg-box-transparent|bg-box-transparent-2|hoverable|custom-table)(?:[\s"'`$])/g,
    message: 'Deprecated legacy custom class detected. Use semantic Tailwind utilities (bg-muted, hover:bg-accent, [&_thead]:bg-muted).',
  },
  {
    id: 'no-raw-hex-in-template',
    regex: /style="[^"]*#[0-9a-fA-F]{3,8}[^"]*"/g,
    message: 'Raw inline hex color detected in style attribute. Use semantic CSS variables or theme tokens.',
  },
];

let totalViolations = 0;
const violationsByFile = new Map();

function scanDir(dir) {
  const fullPath = path.join(ROOT_DIR, dir);
  if (!fs.existsSync(fullPath)) return;

  const entries = fs.readdirSync(fullPath, { withFileTypes: true });
  for (const entry of entries) {
    const res = path.join(fullPath, entry.name);
    const rel = path.relative(ROOT_DIR, res).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
      scanDir(rel);
    } else if (entry.isFile()) {
      if (!EXTENSIONS.some((ext) => entry.name.endsWith(ext))) continue;

      const content = fs.readFileSync(res, 'utf-8');
      const lines = content.split('\n');

      for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx];
        for (const rule of RULES) {
          rule.regex.lastIndex = 0;
          const match = rule.regex.exec(line);
          if (match) {
            totalViolations++;
            if (!violationsByFile.has(rel)) {
              violationsByFile.set(rel, []);
            }
            violationsByFile.get(rel).push({
              line: lineIdx + 1,
              rule: rule.id,
              match: match[0],
              message: rule.message,
            });
          }
        }
      }
    }
  }
}

for (const target of TARGET_DIRS) {
  scanDir(target);
}

if (totalViolations > 0) {
  console.error(`\x1b[31m[Style Lint Failed]\x1b[0m Found ${totalViolations} style technical debt violations across ${violationsByFile.size} files:`);
  for (const [filePath, fileViolations] of violationsByFile.entries()) {
    console.error(`\n  \x1b[33m${filePath}\x1b[0m:`);
    for (const v of fileViolations) {
      console.error(`    Line ${v.line}: [\x1b[31m${v.rule}\x1b[0m] "${v.match}" -> ${v.message}`);
    }
  }
  console.error(`\n\x1b[31mPlease fix the violations above to maintain 100% semantic theme token consistency.\x1b[0m`);
  process.exit(1);
} else {
  console.log('\x1b[32m[Style Lint Passed]\x1b[0m 0 style technical debts found across all packages.');
  process.exit(0);
}
