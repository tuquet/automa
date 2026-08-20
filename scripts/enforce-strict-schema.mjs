import fs from 'fs';
import path from 'path';

const API_DIR = path.join(process.cwd(), 'automa-core/src/api/handlers');

function lintSchemaFiles() {
    let hasError = false;

    if (!fs.existsSync(API_DIR)) {
        console.error('[Lint Error] API directory not found at ' + API_DIR);
        return;
    }

    const files = fs.readdirSync(API_DIR).filter(f => f.endsWith('.rs'));

    for (const file of files) {
        const filePath = path.join(API_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        let insideStruct = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.includes('Json<serde_json::Value>')) {
                console.error('\x1b[31m[Lint Error]\x1b[0m ' + file + ':' + (i+1) + ' -> Lazy Handler: Found Json<serde_json::Value>. You must use a strongly typed struct.');
                hasError = true;
            }

            if (line.match(/pub struct \w+/)) {
                insideStruct = true;
            }
            if (insideStruct && line.startsWith('}')) {
                insideStruct = false;
            }

            if (insideStruct && line.includes('serde_json::Value')) {
                const prevLine = i > 0 ? lines[i-1] : '';
                const prev2Line = i > 1 ? lines[i-2] : '';
                
                if (!prevLine.includes('#[schema(') && !prev2Line.includes('#[schema(')) {
                    console.error('\x1b[31m[Lint Error]\x1b[0m ' + file + ':' + (i+1) + ' -> Lazy Schema: Struct field uses serde_json::Value without #[schema(value_type)].');
                    hasError = true;
                }
            }
        }
    }

    if (hasError) {
        console.error('\x1b[31m[Lint Failed] OpenAPI Schema rules violated. Please fix the errors above.\x1b[0m');
        process.exit(1);
    } else {
        console.log('\x1b[32m[Lint Passed] All OpenAPI Schema rules are satisfied.\x1b[0m');
    }
}

lintSchemaFiles();
