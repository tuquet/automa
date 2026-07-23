#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const ajvErrors = require('ajv-errors');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const args = process.argv.slice(2);
const filesToLint = args.filter(arg => !arg.startsWith('--'));

if (filesToLint.length === 0) {
  console.error(`${colors.yellow}[WARN] No input files provided. Usage: node lint_automa.js <file1.json> <file2.json>${colors.reset}`);
  process.exit(1);
}

// Load Schemas & Rules
const schemaPath = path.join(__dirname, '../schemas/automa.schema.json');
const semanticRulesPath = path.join(__dirname, '../resources/semantic_rules.json');
let schema, semanticRules;
try {
  schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  semanticRules = JSON.parse(fs.readFileSync(semanticRulesPath, 'utf8'));
} catch (e) {
  console.error(`${colors.red}[ERROR] Could not load required JSON schemas (automa.schema.json or semantic_rules.json).${colors.reset}`);
  process.exit(1);
}

const ajv = new Ajv({ allErrors: true, strict: false });
ajvErrors(ajv);
const compiledValidators = {};

function getValidator(componentName) {
  if (compiledValidators[componentName]) return compiledValidators[componentName];
  if (!schema.definitions[componentName]) return null;
  const nodeSchema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    definitions: schema.definitions,
    $ref: `#/definitions/${componentName}`
  };
  try {
    compiledValidators[componentName] = ajv.compile(nodeSchema);
    return compiledValidators[componentName];
  } catch (e) {
    return null;
  }
}

// Helper: safe object path resolution (like objectPath.get)
function getPath(obj, p) {
  if (!obj || !p) return undefined;
  return p.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
}

function lintFile(filePath) {
  let content;
  let hasError = false;

  try { content = fs.readFileSync(filePath, 'utf8'); } catch (err) { return false; }
  let data;
  try { data = JSON.parse(content); } catch (err) { return false; }

  let nodes = [], edges = [];
  if (data.drawflow && data.drawflow.nodes && data.drawflow.edges) {
    nodes = data.drawflow.nodes;
    edges = data.drawflow.edges;
  } else if (data.data && data.data.nodes && data.data.edges) {
    nodes = data.data.nodes;
    edges = data.data.edges;
  } else {
    return false;
  }

  // Phase 1: Engine Schema Validation
  nodes.forEach(node => {
    const componentName = `Block${node.label.charAt(0).toUpperCase() + node.label.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase())}`;
    const validator = getValidator(componentName);
    if (validator) {
      const valid = validator(node);
      if (!valid) {
        hasError = true;
        validator.errors.forEach(err => {
          console.error(`${colors.red}[ERROR] [${path.basename(filePath)}] Schema Violation in Node '${node.id}' (${node.label}): ${err.instancePath} ${err.message}${colors.reset}`);
        });
      }
    }
  });

  // Phase 2: Graph Semantic & Data Flow Analysis
  const adjList = {};
  nodes.forEach(n => adjList[n.id] = []);
  edges.forEach(e => {
    if (adjList[e.source]) adjList[e.source].push(e.target);
  });

  const visited = new Set();
  const recStack = new Set();
  
  function isCyclic(nodeId) {
    if (!visited.has(nodeId)) {
      visited.add(nodeId);
      recStack.add(nodeId);
      for (const neighbor of adjList[nodeId]) {
        if (!visited.has(neighbor) && isCyclic(neighbor)) return true;
        else if (recStack.has(neighbor)) {
          console.warn(`${colors.yellow}[WARN] [${path.basename(filePath)}] Potential infinite loop detected! Edge from '${nodeId}' -> '${neighbor}' creates a cycle.${colors.reset}`);
          return true;
        }
      }
    }
    recStack.delete(nodeId);
    return false;
  }
  nodes.forEach(n => { if (!visited.has(n.id)) isCyclic(n.id); });
  
  // Phase 3: Dead Code Elimination (Reachability)
  const triggerNode = nodes.find(n => n.label === 'trigger');
  if (triggerNode) {
    const reachable = new Set();
    const queue = [triggerNode.id];
    while (queue.length > 0) {
      const curr = queue.shift();
      if (!reachable.has(curr)) {
        reachable.add(curr);
        if (adjList[curr]) queue.push(...adjList[curr]);
      }
    }
    nodes.forEach(n => {
      if (!reachable.has(n.id) && n.label !== 'note') {
         console.warn(`${colors.yellow}[WARN] [${path.basename(filePath)}] Dead Node Detected: '${n.id}' (${n.label}) cannot be reached from the Trigger node.${colors.reset}`);
      }
    });
  }

  // Phase 4: Data-Driven Topology Validation (Driven by semantic_rules.json)
  nodes.forEach(node => {
    let config = semanticRules.topologyRules[node.type];
    if (!config) config = semanticRules.topologyRules['BlockBasic']; 
    if (!config) config = semanticRules.topologyRules['default'];
    
    const outgoingEdges = edges.filter(e => e.source === node.id);
    const connectedPorts = outgoingEdges.map(e => e.sourceHandle.replace(node.id + '-', ''));

    connectedPorts.forEach(port => {
      let isAllowed = false;
      config.allowed.forEach(allowedPattern => {
        if (allowedPattern.startsWith('^')) {
           if (new RegExp(allowedPattern).test(port)) isAllowed = true;
        } else {
           if (port === allowedPattern) isAllowed = true;
        }
      });
      if (!isAllowed) {
        console.error(`${colors.red}[ERROR] [${path.basename(filePath)}] Node '${node.id}' (${node.label}) uses an invalid port '${port}'. Allowed ports: ${config.allowed.join(', ')}.${colors.reset}`);
        hasError = true;
      }
    });

    config.required.forEach(reqPort => {
      if (!connectedPorts.includes(reqPort)) {
        console.error(`${colors.red}[ERROR] [${path.basename(filePath)}] Node '${node.id}' (${node.label}) is missing a MANDATORY connection on '${reqPort}'. Topology invalid.${colors.reset}`);
        hasError = true;
      }
    });
  });

  // Phase 5: Data-Driven Variable Scope Resolution (Driven by semantic_rules.json)
  let globalVariables = new Set(semanticRules.variableRules.builtInGlobals);
  try {
    const globalVarsFile = path.join(path.dirname(filePath), 'VARIABLES.md');
    if (fs.existsSync(globalVarsFile)) {
      const globContent = fs.readFileSync(globalVarsFile, 'utf8');
      const globRegex = /`([a-zA-Z0-9_$-]+)`/g;
      let m;
      while ((m = globRegex.exec(globContent)) !== null) {
        globalVariables.add(m[1]);
      }
    }
  } catch(e) {}

  const validLocals = new Map();

  // Dynamic Variable Extractor Iteration
  nodes.forEach(n => {
    semanticRules.variableRules.extractors.forEach(ext => {
      if (ext.block && n.label !== ext.block) return;
      if (ext.blocks && !ext.blocks.includes(n.label)) return;

      if (ext.type === 'prop_boolean') {
        if (getPath(n, ext.conditionPath) === true) {
          const vName = getPath(n, ext.valuePath);
          if (vName) validLocals.set(vName, { sourceNodeId: n.id, used: false });
        }
      } else if (ext.type === 'array_iteration') {
        const arr = getPath(n, ext.arrayPath);
        if (Array.isArray(arr)) {
          arr.forEach(item => {
            if (ext.filter && getPath(item, ext.filter.path) !== ext.filter.value) return;
            const vName = getPath(item, ext.valuePath);
            if (vName) validLocals.set(vName, { sourceNodeId: n.id, used: false });
          });
        }
      } else if (ext.type === 'regex') {
        const text = getPath(n, ext.path);
        if (text && typeof text === 'string') {
          const r = new RegExp(ext.pattern, 'g');
          let m;
          while ((m = r.exec(text)) !== null) {
            validLocals.set(m[ext.groupIndex], { sourceNodeId: n.id, used: false });
          }
        }
      } else if (ext.type === 'mutation') {
        const vName = getPath(n, ext.valuePath);
        if (vName && validLocals.has(vName)) {
           validLocals.get(vName).used = true; // Implicit usage
        }
      } else if (ext.type === 'prop_always') {
        if (getPath(n, ext.conditionPath) === ext.conditionValue) {
          const vName = getPath(n, ext.valuePath);
          if (vName) validLocals.set(vName, { sourceNodeId: n.id, used: false });
        }
      }
    });
  });

  // Phase 6: Interpolation (Mustache) Validation
  const nodesStr = JSON.stringify(nodes);
  const textVarRegex = new RegExp(semanticRules.interpolationRules.syntaxRegex, 'g');
  let textMatch;
  while ((textMatch = textVarRegex.exec(nodesStr)) !== null) {
    const fullPath = textMatch[1];
    const namespace = fullPath.split('.')[0];
    
    // Validate Namespace
    if (!semanticRules.interpolationRules.validNamespaces.includes(namespace)) {
      console.error(`${colors.red}[ERROR] [${path.basename(filePath)}] Invalid Namespace in Interpolation: '{{${fullPath}}}'. Namespace '${namespace}' is not allowed. Allowed namespaces: ${semanticRules.interpolationRules.validNamespaces.join(', ')}.${colors.reset}`);
      hasError = true;
      continue;
    }

    if (namespace === 'variables') {
      let varName = fullPath.split('.')[1];
      if (!varName) continue;
      
      // Handle semantic prefixes
      if (varName.startsWith('$$')) varName = varName.substring(2);
      else if (varName.startsWith('$push:')) varName = varName.substring(6);
      
      if (validLocals.has(varName)) {
        validLocals.get(varName).used = true;
      } else if (!globalVariables.has(varName)) {
        console.error(`${colors.red}[ERROR] [${path.basename(filePath)}] Undeclared variable used in Interpolation: '{{variables.${fullPath.split('.')[1]}}}'. '${varName}' was never assigned by any block.${colors.reset}`);
        hasError = true;
      }
    }
  }

  // Phase 6.5: Javascript `automaRefData` Variable Usage
  const refDataRegex = /automaRefData\s*\(\s*['"]variables['"]\s*,\s*['"]([a-zA-Z0-9_$-]+)['"]\s*\)/g;
  let refMatch;
  while ((refMatch = refDataRegex.exec(nodesStr)) !== null) {
    const varName = refMatch[1];
    if (validLocals.has(varName)) {
      validLocals.get(varName).used = true;
    }
  }

  // Phase 7: Type vs Label Structural Mismatch Validation
  if (semanticRules.typeLabelMap) {
    nodes.forEach(n => {
      const expectedLabels = semanticRules.typeLabelMap[n.type];
      if (expectedLabels && !expectedLabels.includes(n.label)) {
        console.error(`${colors.red}[ERROR] [${path.basename(filePath)}] Structural Mismatch: Node '${n.id}' has type '${n.type}' but is labeled '${n.label}'. This causes execution skipping! Expected labels for this type: ${expectedLabels.join(', ')}.${colors.reset}`);
        hasError = true;
      }
    });
  }

  // Phase 8: JavaScript Mustache Anti-Pattern Detection
  nodes.forEach(n => {
    if (n.label === 'javascript-code' && n.data && n.data.code) {
      if (/\{\{.*\}\}/.test(n.data.code)) {
        console.error(`${colors.yellow}[WARNING] [${path.basename(filePath)}] Mustache Anti-Pattern: Node '${n.id}' uses {{...}} tags inside JS code. This evaluates to a literal string and causes NaN/null errors when parsed! Use automaRefData() instead.${colors.reset}`);
      }
    }
  });

  // Check orphans
  validLocals.forEach((info, varName) => {
     if (!info.used) {
        console.warn(`${colors.yellow}[WARN] [${path.basename(filePath)}] Orphaned Variable: '${varName}' is assigned by node '${info.sourceNodeId}' but is NEVER used downstream. Memory leak / Redundant logic.${colors.reset}`);
     }
  });

  return !hasError;
}

console.log(`${colors.cyan}${colors.bold}Starting Automa Semantic Linter V7 (Data-Driven Edition)...${colors.reset}`);
let hasErrors = false;

for (const file of filesToLint) {
  const absolutePath = path.resolve(file);
  if (fs.existsSync(absolutePath)) {
    if (!lintFile(absolutePath)) {
      hasErrors = true;
    }
  } else {
    console.error(`[ERROR] File not found: ${absolutePath}`);
    hasErrors = true;
  }
}

if (hasErrors) {
  console.error(`\n${colors.red}${colors.bold}Linting FAILED. Please fix the Schema / Semantic errors above.${colors.reset}`);
  process.exit(1);
} else {
  console.log(`\n${colors.green}${colors.bold}Linting PASSED! Workflow is Semantically Sound.${colors.reset}`);
  process.exit(0);
}
