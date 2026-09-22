#!/usr/bin/env node

/**
 * Automa Ecosystem - Style Technical Debt Scanner
 * Enforces semantic theme tokens, prohibits hardcoded grays, sub-12px text, and legacy classes.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pc, rootDir } from './lib/utils.mjs';

const TARGET_DIRS = [
  'apps/webe/src/studio',
  'apps/webe/src/components',
  'apps/webe/src/assets/css',
  'apps/vsce/webview-ui/src',
  'apps/desk/src',
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
  {
    id: 'no-arbitrary-font-sizes',
    regex: /\btext-\[(?:8|9|10|11|13|15)px\]/g,
    message: 'Arbitrary micro font size detected. Use semantic tokens (text-xs for >=12px, text-sm for 14px, text-base for 16px). Sub-12px is forbidden.',
  },
  {
    id: 'no-sub-12px-css',
    regex: /font-size:\s*(?:[1-9]|1[01])px/g,
    message: 'Hardcoded sub-12px font size detected. Minimum allowed font size is 12px (text-xs / 0.75rem).',
  },
  {
    id: 'no-centered-dialog-header',
    regex: /\btext-center\s+sm:text-left\b/g,
    message: 'Centered dialog header detected. Dialog/sheet/alert headers must be unconditionally left-aligned (text-left) in desktop/IDE panels.',
  },
  {
    id: 'no-fractional-control-height',
    regex: /\b(?:h|min-h|max-h)-(?:[4-9]\.5|1[0-9]\.5)\b/g,
    message: 'Arbitrary fractional control height detected. Control heights must strictly follow Shadcn scale (h-7 for xs/28px, h-8 for sm/32px, h-9 for default/36px, h-10 for lg/40px).',
  },
];

const FILE_RULES = [
  {
    id: 'no-modal-hardcoded-min-height',
    regex: /\.modal-[a-zA-Z0-9_-]+[\s\S]*?min-height:\s*\d+px/g,
    message: 'Hardcoded min-height on modal container class detected. Modals must use intrinsic content sizing or flex-col layout to prevent empty space.',
  },
];

let totalViolations = 0;
const violationsByFile = new Map();

function scanDir(dir) {
  const fullPath = path.join(rootDir, dir);
  if (!fs.existsSync(fullPath)) return;

  const entries = fs.readdirSync(fullPath, { withFileTypes: true });
  for (const entry of entries) {
    const res = path.join(fullPath, entry.name);
    const rel = path.relative(rootDir, res).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
      scanDir(rel);
    } else if (entry.isFile()) {
      if (!EXTENSIONS.some((ext) => entry.name.endsWith(ext))) continue;

      const content = fs.readFileSync(res, 'utf-8');

      // Check whole-file rules
      for (const rule of FILE_RULES) {
        rule.regex.lastIndex = 0;
        let fileMatch;
        while ((fileMatch = rule.regex.exec(content)) !== null) {
          totalViolations++;
          if (!violationsByFile.has(rel)) {
            violationsByFile.set(rel, []);
          }
          const upToMatch = content.slice(0, fileMatch.index);
          const lineNum = upToMatch.split('\n').length;
          violationsByFile.get(rel).push({
            line: lineNum,
            rule: rule.id,
            match: fileMatch[0].replace(/\s+/g, ' ').slice(0, 50),
            message: rule.message,
          });
        }
      }

      // Check line-by-line rules
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
  console.error(`${pc.red('[Style Lint Failed]')} Found ${totalViolations} style technical debt violations across ${violationsByFile.size} files:`);
  for (const [filePath, fileViolations] of violationsByFile.entries()) {
    console.error(`\n  ${pc.yellow(filePath)}:`);
    for (const v of fileViolations) {
      console.error(`    Line ${v.line}: [${pc.red(v.rule)}] "${v.match}" -> ${v.message}`);
    }
  }
  console.error(`\n${pc.red('Please fix the violations above to maintain 100% semantic theme token consistency.')}\n`);
  process.exit(1);
} else {
  console.log(`${pc.green('✔ [Style Lint Passed]')} 0 style technical debts found across all packages.`);
  process.exit(0);
}
