const fs = require('fs');
const path = require('path');

const rootTasksPath = path.join('C:', 'Repository', 'automa-ecosystem', '.vscode', 'tasks.json');
const rootTasksRaw = fs.readFileSync(rootTasksPath, 'utf8');
const rootConfig = JSON.parse(rootTasksRaw);

const folders = ['automa', 'automa-be', 'automa-cli', 'automa-dashboard'];
const groupedTasks = {};
folders.forEach(f => groupedTasks[f] = []);
const remainingRootTasks = [];

rootConfig.tasks.forEach(task => {
  let moved = false;
  if (task.options && task.options.cwd) {
    for (const folder of folders) {
      if (task.options.cwd === `\${workspaceFolder}/${folder}`) {
        // Change cwd to just ${workspaceFolder} since it's now in the subfolder
        task.options.cwd = '${workspaceFolder}';
        groupedTasks[folder].push(task);
        moved = true;
        break;
      }
    }
  }
  if (!moved) {
    remainingRootTasks.push(task);
  }
});

rootConfig.tasks = remainingRootTasks;

// Handle inputs
const groupedInputs = {};
folders.forEach(f => groupedInputs[f] = []);
const remainingRootInputs = [];

if (rootConfig.inputs) {
  rootConfig.inputs.forEach(input => {
    // Check if input is used in any task of automa-cli
    let usedInFolder = null;
    for (const folder of folders) {
      const isUsed = groupedTasks[folder].some(t => JSON.stringify(t).includes(`\${input:${input.id}}`));
      if (isUsed) {
        usedInFolder = folder;
        break;
      }
    }
    
    if (usedInFolder) {
      groupedInputs[usedInFolder].push(input);
    } else {
      remainingRootInputs.push(input);
    }
  });
}

rootConfig.inputs = remainingRootInputs;
if (rootConfig.inputs.length === 0) delete rootConfig.inputs;

// Write out back to root
fs.writeFileSync(rootTasksPath, JSON.stringify(rootConfig, null, 2));

// Write out subfolders
for (const folder of folders) {
  const tasks = groupedTasks[folder];
  const inputs = groupedInputs[folder];
  
  if (tasks.length > 0) {
    const folderVscode = path.join('C:', 'Repository', 'automa-ecosystem', folder, '.vscode');
    if (!fs.existsSync(folderVscode)) {
      fs.mkdirSync(folderVscode, { recursive: true });
    }
    
    const folderTasksPath = path.join(folderVscode, 'tasks.json');
    let folderConfig = { version: '2.0.0', tasks: [] };
    if (fs.existsSync(folderTasksPath)) {
      folderConfig = JSON.parse(fs.readFileSync(folderTasksPath, 'utf8'));
    }
    
    folderConfig.tasks = folderConfig.tasks.concat(tasks);
    
    if (inputs.length > 0) {
      folderConfig.inputs = folderConfig.inputs || [];
      folderConfig.inputs = folderConfig.inputs.concat(inputs);
    }
    
    fs.writeFileSync(folderTasksPath, JSON.stringify(folderConfig, null, 2));
    console.log(`Moved ${tasks.length} tasks to ${folder}/.vscode/tasks.json`);
  }
}
console.log('Root tasks remaining:', rootConfig.tasks.length);
