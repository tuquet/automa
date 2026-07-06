const path = require('path');
const fs = require('fs');

const commonPaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];

for (const p of commonPaths) {
  console.log(`${p}: ${fs.existsSync(p)}`);
}
