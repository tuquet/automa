
const fs = require('fs');
const wf = JSON.parse(fs.readFileSync('wf-login.json', 'utf8'));
const issues = [];
if (!wf.drawflow || !wf.drawflow.nodes) {
  console.log('Invalid workflow JSON');
  process.exit();
}

console.log('Workflow Nodes Count:', wf.drawflow.nodes.length);

const nodes = wf.drawflow.nodes;
for (const node of nodes) {
  // 3. Documentation Check
  if (!node.data.description || node.data.description.trim() === '') {
    issues.push('Missing description: Node [' + node.label + '] (' + node.id + ')');
  }
  
  // 5. Redundancy Check
  if (node.label === 'element-exists') {
    issues.push('Redundancy Risk: Node [' + node.label + '] (' + node.id + ') used. Ensure it is for branching, not just waiting.');
  }
  
  // 8. Resiliency Check
  if (node.data.waitForSelector) {
    if (!node.data.waitSelectorTimeout || node.data.waitSelectorTimeout < 5000) {
      issues.push('Resiliency Risk: Node [' + node.label + '] (' + node.id + ') has waitSelectorTimeout < 5000ms.');
    }
  }
  if (node.label === 'event-click' || node.label === 'forms') {
    if (node.data.onError !== 'fallback') {
      issues.push('Resiliency Risk: Node [' + node.label + '] (' + node.id + ') does not have onError: \'fallback\'.');
    }
  }
  
  // 4. Reusability Check
  if (node.label === 'forms' && node.data.getValue && node.data.getValue.length > 0) {
    for (const item of node.data.getValue) {
      if (!item.value.includes('{{')) {
         issues.push('Hardcode Risk: Node [' + node.label + '] (' + node.id + ') has hardcoded value: ' + item.value + '. Use {{variables}}.');
      }
    }
  }
  if (node.label === 'new-tab' && node.data.url && !node.data.url.includes('{{')) {
    issues.push('Hardcode Risk: Node [new-tab] (' + node.id + ') has hardcoded URL: ' + node.data.url + '. Use {{variables}}.');
  }
}

if (wf.globalData) {
  issues.push('GlobalData usage found: ' + wf.globalData.replace(/\\n/g, ' '));
}

console.log('\n--- ISSUES FOUND ---');
issues.forEach(i => console.log('- ' + i));

