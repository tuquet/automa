const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.rs')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('automa-core/src/api');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // regex looks for "/api/" not followed by "v1/"
  const newContent = content.replace(/"\/api\/(?!v1\/)/g, '"/api/v1/');
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log('Updated ' + file);
  }
});
