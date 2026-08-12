import fs from 'fs';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if(file.endsWith('.ts')) results.push(file);
        }
    });
    return results;
}

const files = walk('./automa-cli/src');
files.forEach(f => {
    let content = fs.readFileSync(f, 'utf-8');
    let changed = false;

    // Replace JobRepository imports
    content = content.replace(/import\s+\{\s*JobRepository\s*\}\s+from\s+["'][^"']+db\/JobRepository(\.js)?["'];/g, 'import { JobRepository } from "@automa/core";');
    content = content.replace(/await\s+import\s*\(\s*["'][^"']+db\/JobRepository(\.js)?["']\s*\)/g, 'await import("@automa/core")');

    // Replace db/index.js imports for initDb
    content = content.replace(/import\s+\{\s*initDb\s*\}\s+from\s+["'][^"']+db\/index(\.js)?["'];/g, 'import { initCoreDatabases } from "@automa/core";');
    
    if (changed) {
        fs.writeFileSync(f, content, 'utf-8');
        console.log(`Updated ${f}`);
    }
});
