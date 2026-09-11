#!/usr/bin/env node

/**
 * Automa Ecosystem - Bruno Collection Synchronizer
 * Converts openapi.json to Bruno .bru files and automates path parameter injection.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { getOpenApiSpec } from './export-openapi.mjs';
import { pc, rootDir, safeRm } from './lib/utils.mjs';

const API_JSON_PATH = path.join(rootDir, 'automa-bruno.tmp.json');
const OUTPUT_DIR = path.join(rootDir, 'automa-bruno');

async function syncBruno() {
  console.log(`${pc.cyan('🔍 Obtaining OpenAPI spec for Bruno collection...')}`);

  try {
    const spec = await getOpenApiSpec();
    fs.writeFileSync(API_JSON_PATH, JSON.stringify(spec, null, 2), 'utf-8');

    console.log(`${pc.yellow('🧹 Cleaning up old Bruno collection...')}`);
    safeRm(OUTPUT_DIR);

    console.log(`${pc.cyan('📥 Importing OpenAPI spec to Bruno...')}`);
    execSync(
      `pnpm exec bru import openapi -s "${API_JSON_PATH}" -o "${rootDir}" -n "automa-bruno" --collection-format bru -g path`,
      { cwd: rootDir, stdio: 'inherit' },
    );

    console.log(`${pc.cyan('💉 Injecting baseUrl into collection.bru...')}`);
    const collectionPath = path.join(OUTPUT_DIR, 'collection.bru');
    if (fs.existsSync(collectionPath)) {
      const fileContent = fs.readFileSync(collectionPath, 'utf-8');
      if (!fileContent.includes('vars:pre-request')) {
        const appendContent = '\nvars:pre-request {\n  baseUrl: http://127.0.0.1:8765\n}\n';
        fs.writeFileSync(collectionPath, appendContent, { flag: 'a' });
      } else {
        console.log(`${pc.dim('vars:pre-request already exists in collection.bru. Skipping injection.')}`);
      }
    }

    console.log(`${pc.cyan('⚙️  Automating path parameters in .bru files...')}`);
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

    if (fs.existsSync(OUTPUT_DIR)) {
      const bruFiles = walkDir(OUTPUT_DIR);
      let updatedCount = 0;
      for (const file of bruFiles) {
        let fileContent = fs.readFileSync(file, 'utf-8');
        const pathRegex = /params:path \{[\s\S]*?\n\}/g;
        let hasChanges = false;

        fileContent = fileContent.replace(pathRegex, (match) => {
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
      console.log(`${pc.green('✔')} Automated path parameters in ${updatedCount} files.`);
    }

    console.log(`${pc.bold(pc.green('✅ Bruno collection synchronized successfully!'))}`);
  } finally {
    // Guaranteed cleanup of temporary spec file
    safeRm(API_JSON_PATH);
  }
}

syncBruno().catch((err) => {
  console.error(`${pc.red('✘ Failed to sync Bruno collection:')}`, err.message);
  process.exit(1);
});
