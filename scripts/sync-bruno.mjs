import { execSync } from 'child_process';
import { rmSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const API_JSON_PATH = 'bruno/specs/automa-core-api.json';
const OUTPUT_DIR = 'automa-bruno/automa-core-api';

console.log('Fetching OpenAPI spec from Rust Backend...');
try {
  execSync(`curl -s http://127.0.0.1:8765/api-docs/openapi.json -o ${API_JSON_PATH}`);
} catch (e) {
  console.error('Failed to fetch OpenAPI spec. Is the Rust backend running?');
  process.exit(1);
}

console.log('Cleaning up old Bruno collection...');
if (existsSync(OUTPUT_DIR)) {
  rmSync(OUTPUT_DIR, { recursive: true, force: true });
}

console.log('Importing OpenAPI spec to Bruno...');
try {
  execSync(
    `pnpm exec bru import openapi -s ${API_JSON_PATH} -o ./automa-bruno -n "automa-core-api" --collection-format bru -g path`,
    { stdio: 'inherit' }
  );
} catch (e) {
  console.error('Failed to import OpenAPI to Bruno.');
  process.exit(1);
}

console.log('Restoring Local Environment variables...');
const envDir = join(OUTPUT_DIR, 'environments');
mkdirSync(envDir, { recursive: true });

const localEnvContent = `vars {
  baseUrl: http://127.0.0.1:8765
}
`;
writeFileSync(join(envDir, 'Local.bru'), localEnvContent, 'utf-8');

console.log('✅ Bruno collection synchronized successfully!');
