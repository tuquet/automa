import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const OPENAPI_URL = 'http://127.0.0.1:8765/api-docs/openapi.json';
const LOCAL_SPEC = path.join(rootDir, 'packages', 'automa-types', 'openapi.json');
const ROOT_SPEC = path.join(rootDir, 'openapi.json');

export async function getOpenApiSpec() {
    // 1. Try to fetch from live running automa-core
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1500);
        const res = await fetch(OPENAPI_URL, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
            const jsonText = await res.text();
            fs.mkdirSync(path.dirname(LOCAL_SPEC), { recursive: true });
            fs.writeFileSync(LOCAL_SPEC, jsonText, 'utf-8');
            fs.writeFileSync(ROOT_SPEC, jsonText, 'utf-8');
            console.log('✔ Fetched OpenAPI spec from live Automa Core backend.');
            return JSON.parse(jsonText);
        }
    } catch (e) {
        // Backend not running live
    }

    // 2. Try to export directly from automa-core via cargo
    try {
        console.log('⚡ Automa Core is not running live. Exporting OpenAPI spec directly from Rust source...');
        execSync(`cargo run --manifest-path automa-core/Cargo.toml --quiet -- --export-openapi ${LOCAL_SPEC}`, {
            cwd: rootDir,
            stdio: 'inherit'
        });
        if (fs.existsSync(LOCAL_SPEC)) {
            const jsonText = fs.readFileSync(LOCAL_SPEC, 'utf-8');
            fs.writeFileSync(ROOT_SPEC, jsonText, 'utf-8');
            console.log('✔ Successfully generated OpenAPI spec from Rust source.');
            return JSON.parse(jsonText);
        }
    } catch (e) {
        console.warn('⚠️ Could not run cargo export:', e.message);
    }

    // 3. Fallback to existing cached spec
    if (fs.existsSync(LOCAL_SPEC)) {
        console.log('✔ Using cached OpenAPI spec from packages/automa-types/openapi.json');
        return JSON.parse(fs.readFileSync(LOCAL_SPEC, 'utf-8'));
    }
    if (fs.existsSync(ROOT_SPEC)) {
        console.log('✔ Using cached OpenAPI spec from openapi.json');
        return JSON.parse(fs.readFileSync(ROOT_SPEC, 'utf-8'));
    }

    throw new Error('Could not obtain OpenAPI spec from live backend, cargo export, or local cache.');
}

// If run directly from CLI
if (process.argv[1] === __filename) {
    getOpenApiSpec()
        .then(() => console.log('OpenAPI sync complete.'))
        .catch(err => {
            console.error('Error exporting OpenAPI spec:', err.message);
            process.exit(1);
        });
}
