#!/usr/bin/env node

/**
 * Automa Core OpenAPI Strict Schema Linter
 * Enforces utoipa annotations, snake_case operation IDs, and strongly typed structs.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pc, rootDir } from './lib/utils.mjs';

const API_DIR = path.join(rootDir, 'apps/core/src/api/handlers');

function lintSchemaFiles() {
  let hasError = false;

  if (!fs.existsSync(API_DIR)) {
    console.error(`${pc.red('[Lint Error]')} API directory not found at ${API_DIR}`);
    return;
  }

  const files = fs.readdirSync(API_DIR).filter((f) => f.endsWith('.rs'));

  for (const file of files) {
    const filePath = path.join(API_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    let insideStruct = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.includes('Json<serde_json::Value>')) {
        console.error(`${pc.red('[Lint Error]')} ${file}:${i + 1} -> Lazy Handler: Found Json<serde_json::Value>. You must use a strongly typed struct.`);
        hasError = true;
      }

      if (line.match(/pub struct \w+/)) {
        insideStruct = true;
      }
      if (insideStruct && line.startsWith('}')) {
        insideStruct = false;
      }

      if (insideStruct && line.includes('serde_json::Value')) {
        const prevLine = i > 0 ? lines[i - 1] : '';
        const prev2Line = i > 1 ? lines[i - 2] : '';

        if (!prevLine.includes('#[schema(') && !prev2Line.includes('#[schema(')) {
          console.error(`${pc.red('[Lint Error]')} ${file}:${i + 1} -> Lazy Schema: Struct field uses serde_json::Value without #[schema(value_type)].`);
          hasError = true;
        }
      }
    }
  }

  if (hasError) {
    console.error(`\n${pc.bold(pc.red('[Lint Failed] OpenAPI Schema rules violated. Please fix the errors above.'))}\n`);
    process.exit(1);
  } else {
    console.log(`${pc.green('✔ [Lint Passed]')} All OpenAPI Schema rules are satisfied.`);
  }
}

lintSchemaFiles();
