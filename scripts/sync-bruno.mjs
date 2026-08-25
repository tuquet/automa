import { execSync } from 'child_process';
import fs, { rmSync, writeFileSync, existsSync, readFileSync } from 'fs';
import path, { join } from 'path';

import { getOpenApiSpec } from './export-openapi.mjs';

const API_JSON_PATH = 'automa-bruno.tmp.json';
const OUTPUT_DIR = 'automa-bruno';

console.log('Obtaining OpenAPI spec for Bruno collection...');
try {
  const spec = await getOpenApiSpec();
  writeFileSync(API_JSON_PATH, JSON.stringify(spec, null, 2), 'utf-8');
} catch (e) {
  console.error('Failed to obtain OpenAPI spec for Bruno:', e.message);
  process.exit(1);
}

console.log('Cleaning up old Bruno collection...');
if (existsSync(OUTPUT_DIR)) {
  rmSync(OUTPUT_DIR, { recursive: true, force: true });
}

console.log('Importing OpenAPI spec to Bruno...');
try {
  execSync(
    `pnpm exec bru import openapi -s ${API_JSON_PATH} -o . -n "automa-bruno" --collection-format bru -g path`,
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
    const appendContent = '\nvars:pre-request {\n  baseUrl: http://127.0.0.1:8765\n}\n';
    writeFileSync(collectionPath, appendContent, { flag: 'a' });
  } else {
    console.log('vars:pre-request already exists in collection.bru. Skipping injection.');
  }
}


console.log('Automating path parameters in .bru files...');
function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (let file of list) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(file));
    } else if (file.endsWith('.bru') && !file.endsWith('collection.bru')) {
      results.push(file);
    }
  }
  return results;
}

const bruFiles = walkDir(OUTPUT_DIR);
let updatedCount = 0;
for (const file of bruFiles) {
  let fileContent = fs.readFileSync(file, 'utf-8');
  
  // Find the params:path { ... } block
  const pathRegex = /params:path \{[\s\S]*?\n\}/g;
  let hasChanges = false;
  
  fileContent = fileContent.replace(pathRegex, (match) => {
    // Replace lines like '  id: 1234' or '  job_id: ' with '  id: {{id}}' and '  job_id: {{job_id}}'
    // Ignore lines starting with '@'
    return match.replace(/^(\s+)([a-zA-Z0-9_\-]+):.*$/gm, (lineMatch, indent, paramName) => {
      if (paramName.startsWith('@')) return lineMatch;
      hasChanges = true;
      return `${indent}${paramName}: {{${paramName}}}`;
    });
  });
  
  if (hasChanges) {
    fs.writeFileSync(file, fileContent);
    updatedCount++;
  }
}
console.log(`Automated path parameters in ${updatedCount} files.`);

console.log('Cleaning up temporary spec file...');
if (existsSync(API_JSON_PATH)) {
  rmSync(API_JSON_PATH);
}

console.log('✅ Bruno collection synchronized successfully!');
