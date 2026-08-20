import { execSync } from 'child_process';
import { rmSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

const API_JSON_PATH = 'automa-bruno.tmp.json';
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

console.log('Injecting baseUrl into collection.bru...');
const collectionPath = join(OUTPUT_DIR, 'collection.bru');
if (existsSync(collectionPath)) {
  const fileContent = readFileSync(collectionPath, 'utf-8');
  if (!fileContent.includes('vars:pre-request')) {
    const appendContent = `\nvars:pre-request {\n  baseUrl: http://127.0.0.1:8765\n}\n`;
    writeFileSync(collectionPath, appendContent, { flag: 'a' });
  } else {
    console.log('vars:pre-request already exists in collection.bru. Skipping injection.');
  }
}

console.log('Cleaning up temporary spec file...');
if (existsSync(API_JSON_PATH)) {
  rmSync(API_JSON_PATH);
}

console.log('✅ Bruno collection synchronized successfully!');
