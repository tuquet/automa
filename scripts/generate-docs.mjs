import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const OPENAPI_URL = 'http://127.0.0.1:8765/api-docs/openapi.json';
const API_DIR = path.join(rootDir, 'docs', 'api');
const ENDPOINTS_DIR = path.join(API_DIR, 'Endpoints');
const SCHEMAS_DIR = path.join(API_DIR, 'Schemas');

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function resolveRef(ref) {
    if (!ref) return null;
    const parts = ref.split('/');
    return parts[parts.length - 1];
}

function getTypeStr(schema) {
    if (!schema) return 'any';
    if (schema.$ref) {
        const refName = resolveRef(schema.$ref);
        return `[[${refName}]]`;
    }
    if (schema.type === 'array' && schema.items) {
        return `Array<${getTypeStr(schema.items)}>`;
    }
    if (schema.anyOf) {
        return schema.anyOf.map(getTypeStr).join(' | ');
    }
    if (schema.oneOf) {
        return schema.oneOf.map(getTypeStr).join(' | ');
    }
    if (schema.allOf) {
        return schema.allOf.map(getTypeStr).join(' & ');
    }
    return schema.type || 'any';
}

function generateSchemaFile(name, schema) {
    let content = `---\ntags: [api/schema]\n---\n# ${name}\n\n`;
    if (schema.description) content += `${schema.description}\n\n`;

    content += `**Type**: \`${schema.type}\`\n\n`;

    if (schema.properties) {
        content += `## Properties\n\n| Name | Type | Description |\n|---|---|---|\n`;
        const required = schema.required || [];
        for (const [propName, propSchema] of Object.entries(schema.properties)) {
            const isReq = required.includes(propName) ? ' *(req)*' : '';
            const typeStr = getTypeStr(propSchema);
            const desc = (propSchema.description || '').replace(/\n/g, ' ');
            content += `| \`${propName}\`${isReq} | ${typeStr} | ${desc} |\n`;
        }
    } else if (schema.type === 'array') {
        content += `Array of: ${getTypeStr(schema.items)}\n`;
    }

    const filePath = path.join(SCHEMAS_DIR, `${name}.md`);
    fs.writeFileSync(filePath, content);
}

function generateEndpointFile(pathStr, method, op) {
    const safePath = pathStr.replace(/\//g, '_').replace(/[\{\}]/g, '');
    const filename = `[${method.toUpperCase()}] ${safePath}.md`;
    const title = op.summary || `${method.toUpperCase()} ${pathStr}`;

    const tags = ['api/endpoint'];
    if (op.tags) op.tags.forEach(t => tags.push(`api/${t}`));

    let content = `---\ntags:\n${tags.map(t => `  - ${t}`).join('\n')}\npath: "${pathStr}"\nmethod: "${method.toUpperCase()}"\n---\n`;
    content += `# ${title}\n\n`;
    content += `> [!info] \n> **Method**: \`${method.toUpperCase()}\`\n> **Path**: \`${pathStr}\`\n\n`;

    if (op.description) content += `${op.description}\n\n`;

    if (op.parameters && op.parameters.length > 0) {
        content += `## Parameters\n\n| Name | In | Required | Type | Description |\n|---|---|---|---|---|\n`;
        op.parameters.forEach(p => {
            const typeStr = p.schema ? getTypeStr(p.schema) : 'string';
            const req = p.required ? '✅' : '';
            content += `| \`${p.name}\` | ${p.in} | ${req} | ${typeStr} | ${p.description || ''} |\n`;
        });
        content += `\n`;
    }

    if (op.requestBody) {
        content += `## Request Body\n\n`;
        if (op.requestBody.description) content += `${op.requestBody.description}\n\n`;
        
        const contentTypes = op.requestBody.content || {};
        for (const [contentType, mediaType] of Object.entries(contentTypes)) {
            content += `- **Content-Type**: \`${contentType}\`\n`;
            content += `- **Schema**: ${getTypeStr(mediaType.schema)}\n\n`;
        }
    }

    if (op.responses) {
        content += `## Responses\n\n`;
        for (const [statusCode, res] of Object.entries(op.responses)) {
            content += `### ${statusCode}\n`;
            if (res.description) content += `${res.description}\n\n`;
            
            if (res.content) {
                for (const [contentType, mediaType] of Object.entries(res.content)) {
                    content += `- **Content-Type**: \`${contentType}\`\n`;
                    content += `- **Schema**: ${getTypeStr(mediaType.schema)}\n\n`;
                }
            }
        }
    }

    const filePath = path.join(ENDPOINTS_DIR, filename);
    fs.writeFileSync(filePath, content);
    return filename;
}

import { getOpenApiSpec } from './export-openapi.mjs';

async function main() {
    console.log(`[Docs] Loading OpenAPI specification...`);
    try {
        const spec = await getOpenApiSpec();
        
        // Setup dirs
        ensureDir(API_DIR);
        
        // Xóa thư mục cũ để làm sạch
        if (fs.existsSync(ENDPOINTS_DIR)) fs.rmSync(ENDPOINTS_DIR, { recursive: true, force: true });
        if (fs.existsSync(SCHEMAS_DIR)) fs.rmSync(SCHEMAS_DIR, { recursive: true, force: true });
        
        ensureDir(ENDPOINTS_DIR);
        ensureDir(SCHEMAS_DIR);

        let schemaCount = 0;
        let endpointCount = 0;

        // Generate Schemas
        if (spec.components && spec.components.schemas) {
            for (const [name, schema] of Object.entries(spec.components.schemas)) {
                generateSchemaFile(name, schema);
                schemaCount++;
            }
        }

        // Generate Endpoints
        let homeIndex = `# Automa API Endpoints\n\n`;
        
        if (spec.paths) {
            for (const [pathStr, pathItem] of Object.entries(spec.paths)) {
                for (const [method, op] of Object.entries(pathItem)) {
                    const filename = generateEndpointFile(pathStr, method, op);
                    homeIndex += `- [[${filename.replace('.md', '')}]]\n`;
                    endpointCount++;
                }
            }
        }
        
        fs.writeFileSync(path.join(API_DIR, 'Endpoints.md'), homeIndex);

        console.log(`[Docs] \x1b[32mSuccessfully generated ${endpointCount} endpoints and ${schemaCount} schemas in docs/api/\x1b[0m`);
    } catch (e) {
        console.error(`\x1b[31m[Error] Failed to fetch OpenAPI spec. Is the Automa Daemon running? (automa-cli serve)\x1b[0m`);
        console.error(e.message);
        process.exit(1);
    }
}

main();
