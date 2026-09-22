import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { pc, rootDir } from './lib/utils.mjs';

const __filename = fileURLToPath(import.meta.url);

const OPENAPI_URL = 'http://127.0.0.1:8765/api-docs/openapi.json';
const OPENAPI_SPEC = path.join(rootDir, 'packages', 'automa-types', 'openapi.json');

export async function getOpenApiSpec() {
  // 1. Try to fetch from live running automa-core
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(OPENAPI_URL, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const jsonText = await res.text();
      fs.mkdirSync(path.dirname(OPENAPI_SPEC), { recursive: true });
      fs.writeFileSync(OPENAPI_SPEC, jsonText, 'utf-8');
      console.log(`${pc.green('✔')} Fetched OpenAPI spec from live Automa Core backend.`);
      return JSON.parse(jsonText);
    }
  } catch (_) {
    // Backend not running live
  }

  // 2. Try to export directly from automa-core via cargo
  try {
    console.log(`${pc.yellow('⚡')} Automa Core is not running live. Exporting OpenAPI spec directly from Rust source...`);
    execSync(`cargo run --manifest-path apps/core/Cargo.toml --quiet -- --export-openapi ${OPENAPI_SPEC}`, {
      cwd: rootDir,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    if (fs.existsSync(OPENAPI_SPEC)) {
      const jsonText = fs.readFileSync(OPENAPI_SPEC, 'utf-8');
      console.log(`${pc.green('✔')} Successfully generated OpenAPI spec from Rust source.`);
      return JSON.parse(jsonText);
    }
  } catch (e) {
    console.warn(`${pc.yellow('⚠️')} Could not run cargo export:`, e.message);
  }

  // 3. Fallback to existing cached spec
  if (fs.existsSync(OPENAPI_SPEC)) {
    console.log(`${pc.green('✔')} Using cached OpenAPI spec from packages/automa-types/openapi.json`);
    return JSON.parse(fs.readFileSync(OPENAPI_SPEC, 'utf-8'));
  }

  throw new Error('Could not obtain OpenAPI spec from live backend, cargo export, or local cache.');
}

// If run directly from CLI
if (process.argv[1] === __filename) {
  getOpenApiSpec()
    .then(() => console.log(`${pc.green('✔')} OpenAPI sync complete.`))
    .catch((err) => {
      console.error(`${pc.red('✘')} Error exporting OpenAPI spec:`, err.message);
      process.exit(1);
    });
}
