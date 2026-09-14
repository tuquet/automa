import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { rootDir } from './lib/utils.mjs';

const ROOT_DIR = rootDir;

// Canonical Preset Registry
const PRESETS = {
  b1buPAiSjA: {
    name: 'Neutral / Nova',
    code: 'b1buPAiSjA',
    radius: '0.625rem',
    light: {
      '--background': 'oklch(1 0 0)',
      '--foreground': 'oklch(0.145 0 0)',
      '--card': 'oklch(1 0 0)',
      '--card-foreground': 'oklch(0.145 0 0)',
      '--popover': 'oklch(1 0 0)',
      '--popover-foreground': 'oklch(0.145 0 0)',
      '--primary': 'oklch(0.205 0 0)',
      '--primary-foreground': 'oklch(0.985 0 0)',
      '--secondary': 'oklch(0.97 0 0)',
      '--secondary-foreground': 'oklch(0.205 0 0)',
      '--muted': 'oklch(0.97 0 0)',
      '--muted-foreground': 'oklch(0.556 0 0)',
      '--accent': 'oklch(0.97 0 0)',
      '--accent-foreground': 'oklch(0.205 0 0)',
      '--destructive': 'oklch(0.577 0.245 27.325)',
      '--destructive-foreground': 'oklch(0.985 0 0)',
      '--border': 'oklch(0.922 0 0)',
      '--input': 'oklch(0.922 0 0)',
      '--ring': 'oklch(0.708 0 0)',
      '--chart-1': 'oklch(0.87 0 0)',
      '--chart-2': 'oklch(0.556 0 0)',
      '--chart-3': 'oklch(0.439 0 0)',
      '--chart-4': 'oklch(0.371 0 0)',
      '--chart-5': 'oklch(0.269 0 0)',
      '--sidebar': 'oklch(0.985 0 0)',
      '--sidebar-foreground': 'oklch(0.145 0 0)',
      '--sidebar-primary': 'oklch(0.205 0 0)',
      '--sidebar-primary-foreground': 'oklch(0.985 0 0)',
      '--sidebar-accent': 'oklch(0.97 0 0)',
      '--sidebar-accent-foreground': 'oklch(0.205 0 0)',
      '--sidebar-border': 'oklch(0.922 0 0)',
      '--sidebar-ring': 'oklch(0.708 0 0)',
    },
    dark: {
      '--background': 'oklch(0.145 0 0)',
      '--foreground': 'oklch(0.985 0 0)',
      '--card': 'oklch(0.205 0 0)',
      '--card-foreground': 'oklch(0.985 0 0)',
      '--popover': 'oklch(0.205 0 0)',
      '--popover-foreground': 'oklch(0.985 0 0)',
      '--primary': 'oklch(0.922 0 0)',
      '--primary-foreground': 'oklch(0.205 0 0)',
      '--secondary': 'oklch(0.269 0 0)',
      '--secondary-foreground': 'oklch(0.985 0 0)',
      '--muted': 'oklch(0.269 0 0)',
      '--muted-foreground': 'oklch(0.708 0 0)',
      '--accent': 'oklch(0.269 0 0)',
      '--accent-foreground': 'oklch(0.985 0 0)',
      '--destructive': 'oklch(0.704 0.191 22.216)',
      '--destructive-foreground': 'oklch(0.985 0 0)',
      '--border': 'oklch(1 0 0 / 10%)',
      '--input': 'oklch(1 0 0 / 15%)',
      '--ring': 'oklch(0.556 0 0)',
      '--chart-1': 'oklch(0.87 0 0)',
      '--chart-2': 'oklch(0.556 0 0)',
      '--chart-3': 'oklch(0.439 0 0)',
      '--chart-4': 'oklch(0.371 0 0)',
      '--chart-5': 'oklch(0.269 0 0)',
      '--sidebar': 'oklch(0.205 0 0)',
      '--sidebar-foreground': 'oklch(0.985 0 0)',
      '--sidebar-primary': 'oklch(0.488 0.243 264.376)',
      '--sidebar-primary-foreground': 'oklch(0.985 0 0)',
      '--sidebar-accent': 'oklch(0.269 0 0)',
      '--sidebar-accent-foreground': 'oklch(0.985 0 0)',
      '--sidebar-border': 'oklch(1 0 0 / 10%)',
      '--sidebar-ring': 'oklch(0.556 0 0)',
    },
  },
};

// aaKeeG is the official shadcn-vue preset code for Neutral / Nova with Inter and Pointer
PRESETS.aaKeeG = {
  ...PRESETS.b1buPAiSjA,
  name: 'Neutral / Nova (Vue)',
  code: 'aaKeeG',
  pointer: true,
};

function formatCssVariables(vars, indent = '  ') {
  return Object.entries(vars)
    .map(([key, val]) => `${indent}${key}: ${val};`)
    .join('\n');
}

export function applyPreset(rawPresetCode = 'b1buPAiSjA') {
  const cleanCode = (rawPresetCode || '').trim();
  if (!/^[a-zA-Z0-9_-]+$/.test(cleanCode)) {
    console.error(`❌ Invalid preset code format: "${cleanCode}". Disallowed characters detected.`);
    return;
  }
  const presetCode = cleanCode;

  console.log('================================================================================');
  console.log('🎨 SHADCN-VUE DESIGN SYSTEM PRESET & TOKEN INJECTOR');
  console.log(`📂 Target UI Directory: ${path.join(ROOT_DIR, 'packages/automa-ui')}`);
  console.log(`📦 Applying Preset: [${presetCode}]`);
  console.log('================================================================================\n');

  let preset = PRESETS[presetCode];
  if (!preset) {
    console.log(`🔍 Preset ${presetCode} not in local cache. Attempting to decode via shadcn CLI...`);
    try {
      const decoded = execSync(`pnpm dlx shadcn@latest preset decode ${presetCode}`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      console.log('Decoded preset info:\n', decoded);
    } catch {
      console.warn('⚠️ Could not dynamically decode preset. Falling back to b1buPAiSjA.');
    }
    preset = PRESETS.b1buPAiSjA;
  }

  // 1. Target 1: packages/automa-ui/src/styles/tokens.css
  const tokensPath = path.join(ROOT_DIR, 'packages/automa-ui/src/styles/tokens.css');
  if (fs.existsSync(tokensPath)) {
    console.log(`📝 Updating Core Design Tokens: ${path.relative(ROOT_DIR, tokensPath)}`);
    let content = fs.readFileSync(tokensPath, 'utf8');

    // Replace :root variables in tokens.css
    content = content.replace(
      /--automa-bg:\s*[^;]+;/,
      `--automa-bg: var(--vscode-sideBar-background, ${preset.light['--background']});`
    );
    content = content.replace(
      /--automa-bg-subtle:\s*[^;]+;/,
      `--automa-bg-subtle: var(--vscode-editor-background, ${preset.light['--muted']});`
    );
    content = content.replace(
      /--automa-border:\s*[^;]+;/,
      `--automa-border: var(--vscode-panel-border, ${preset.light['--border']});`
    );
    content = content.replace(
      /--automa-border-focus:\s*[^;]+;/,
      `--automa-border-focus: var(--vscode-focusBorder, ${preset.light['--ring']});`
    );
    content = content.replace(
      /--automa-text-primary:\s*[^;]+;/,
      `--automa-text-primary: var(--vscode-foreground, ${preset.light['--foreground']});`
    );
    content = content.replace(
      /--automa-text-muted:\s*[^;]+;/,
      `--automa-text-muted: var(--vscode-descriptionForeground, ${preset.light['--muted-foreground']});`
    );
    content = content.replace(
      /--automa-accent:\s*[^;]+;/,
      `--automa-accent: var(--vscode-button-background, ${preset.light['--primary']});`
    );
    content = content.replace(
      /--automa-accent-foreground:\s*[^;]+;/,
      `--automa-accent-foreground: var(--vscode-button-foreground, ${preset.light['--primary-foreground']});`
    );
    content = content.replace(
      /--automa-error:\s*[^;]+;/,
      `--automa-error: var(--vscode-errorForeground, ${preset.light['--destructive']});`
    );
    content = content.replace(
      /--radius:\s*[^;]+;/,
      `--radius: ${preset.radius};`
    );

    // Replace .dark variables in tokens.css
    content = content.replace(
      /--automa-bg:\s*var\(--vscode-sideBar-background,\s*#18181b\);/,
      `--automa-bg: var(--vscode-sideBar-background, ${preset.dark['--card']});`
    );
    content = content.replace(
      /--automa-bg-subtle:\s*var\(--vscode-editor-background,\s*#09090b\);/,
      `--automa-bg-subtle: var(--vscode-editor-background, ${preset.dark['--background']});`
    );
    content = content.replace(
      /--automa-border:\s*var\(--vscode-panel-border,\s*#27272a\);/,
      `--automa-border: var(--vscode-panel-border, ${preset.dark['--border']});`
    );
    content = content.replace(
      /--automa-border-focus:\s*var\(--vscode-focusBorder,\s*#6366f1\);/,
      `--automa-border-focus: var(--vscode-focusBorder, ${preset.dark['--ring']});`
    );
    content = content.replace(
      /--automa-text-primary:\s*var\(--vscode-foreground,\s*#f4f4f5\);/,
      `--automa-text-primary: var(--vscode-foreground, ${preset.dark['--foreground']});`
    );
    content = content.replace(
      /--automa-text-muted:\s*var\(--vscode-descriptionForeground,\s*#a1a1aa\);/,
      `--automa-text-muted: var(--vscode-descriptionForeground, ${preset.dark['--muted-foreground']});`
    );
    content = content.replace(
      /--automa-accent:\s*var\(--vscode-button-background,\s*#6366f1\);/,
      `--automa-accent: var(--vscode-button-background, ${preset.dark['--primary']});`
    );
    content = content.replace(
      /--automa-accent-foreground:\s*var\(--vscode-button-foreground,\s*#ffffff\);/,
      `--automa-accent-foreground: var(--vscode-button-foreground, ${preset.dark['--primary-foreground']});`
    );

    fs.writeFileSync(tokensPath, content, 'utf8');
    console.log('  ✔ Updated tokens.css successfully.');
  }

  // 2. Target 2: automa-webe/src/assets/css/tailwind.css
  const webeTailwindPath = path.join(ROOT_DIR, 'automa-webe/src/assets/css/tailwind.css');
  if (fs.existsSync(webeTailwindPath)) {
    console.log(`📝 Updating Web Studio Tailwind Styles: ${path.relative(ROOT_DIR, webeTailwindPath)}`);
    let content = fs.readFileSync(webeTailwindPath, 'utf8');

    // Replace :root block in webe tailwind.css
    const lightTokensStr = formatCssVariables(preset.light);
    const darkTokensStr = formatCssVariables(preset.dark);

    const rootBlockPattern = /:host,\s*:root\s*\{[\s\S]*?\n\}/;
    const newRootBlock = `:host,\n:root {\n${lightTokensStr}\n}`;
    if (rootBlockPattern.test(content)) {
      content = content.replace(rootBlockPattern, newRootBlock);
    }

    const darkBlockPattern = /\.dark,\s*\[data-theme='dark'\],\s*\.vscode-dark\s*\{[\s\S]*?\n\}/;
    const newDarkBlock = `.dark,\n[data-theme='dark'],\n.vscode-dark {\n${darkTokensStr}\n}`;
    if (darkBlockPattern.test(content)) {
      content = content.replace(darkBlockPattern, newDarkBlock);
    }

    fs.writeFileSync(webeTailwindPath, content, 'utf8');
    console.log('  ✔ Updated webe tailwind.css successfully.');
  }

  console.log('\n🔨 Rebuilding @automa/ui tokens package...');
  try {
    execSync('pnpm -F @automa/ui build', { cwd: ROOT_DIR, stdio: 'inherit' });
    console.log('  ✔ @automa/ui built successfully.');
  } catch (err) {
    console.error('❌ Failed to rebuild @automa/ui:', err.message);
  }

  console.log('\n🔍 Verifying style debt compliance...');
  try {
    execSync('node scripts/lint-style-debt.mjs', { cwd: ROOT_DIR, stdio: 'inherit' });
  } catch (err) {
    console.error('❌ Style debt audit failed:', err.message);
  }

  console.log('\n🎉 Successfully applied Shadcn Preset:', preset.name, `(${preset.code})`);
}

const targetPreset = process.argv[2] || 'b1buPAiSjA';
applyPreset(targetPreset);
