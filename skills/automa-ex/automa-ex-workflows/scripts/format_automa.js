#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

let dagre;
try {
  dagre = require('dagre');
} catch (e) {
  console.error('[ERROR] The "dagre" library is missing. Please run "npm install dagre" in the scripts directory.');
  process.exit(1);
}

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const args = process.argv.slice(2);
const filesToFormat = args.filter(arg => !arg.startsWith('--'));

if (filesToFormat.length === 0) {
  console.error(`${colors.yellow}[WARN] No input files provided. Usage: node format_automa.js <file1.json>${colors.reset}`);
  process.exit(1);
}

function formatFile(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error(`[ERROR] Cannot read file: ${filePath}`);
    return false;
  }

  let data;
  try {
    data = JSON.parse(content);
  } catch (err) {
    console.error(`[ERROR] Invalid JSON format: ${filePath}`);
    return false;
  }

  let nodes = [];
  let edges = [];

  if (data.drawflow && data.drawflow.nodes && data.drawflow.edges) {
    nodes = data.drawflow.nodes;
    edges = data.drawflow.edges;
  } else if (data.data && data.data.nodes && data.data.edges) {
    // Package format
    nodes = data.data.nodes;
    edges = data.data.edges;
  } else {
    console.error(`[ERROR] Missing drawflow/nodes/edges in: ${filePath}`);
    return false;
  }

  const graph = new dagre.graphlib.Graph();
  graph.setGraph({
    rankdir: 'LR',
    ranksep: 100,
    ranker: 'tight-tree',
  });
  graph._isMultigraph = true;
  graph.setDefaultEdgeLabel(() => ({}));

  // Build Graph Nodes
  nodes.forEach(node => {
    if (node.label === 'blocks-group-2' || node.parentNode) return;
    
    // Simulate node dimensions if missing (Automa exported JSONs usually lack dimensions)
    let width = 250;
    let height = 100;
    
    if (node.dimensions) {
      width = node.dimensions.width || 250;
      height = node.dimensions.height || 100;
    } else if (node.type === 'BlockNote') {
      width = 400;
      height = 200;
    } else if (node.label === 'trigger') {
      width = 200;
      height = 80;
    }

    graph.setNode(node.id, {
      label: node.label,
      width: width,
      height: height,
    });
  });

  // Build Graph Edges
  edges.forEach(edge => {
    graph.setEdge(edge.source, edge.target, { id: edge.id });
  });

  // Execute Dagre Auto-align
  try {
    dagre.layout(graph);
  } catch (err) {
    console.error(`[ERROR] Dagre layout failed on ${filePath}:`, err.message);
    return false;
  }

  // Apply new coordinates
  let modifiedCount = 0;
  nodes.forEach(node => {
    const graphNode = graph.node(node.id);
    if (!graphNode) return;

    const { x, y } = graphNode;

    // We use exact x and y without padding to match Automa UI
    const newX = x;
    const newY = y;

    if (node.position.x !== newX || node.position.y !== newY) {
      node.position.x = newX;
      node.position.y = newY;
      modifiedCount++;
    }
  });

  if (modifiedCount > 0) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`[SUCCESS] Auto-aligned ${modifiedCount} nodes in ${path.basename(filePath)}`);
      return true;
    } catch (err) {
      console.error(`[ERROR] Failed to save file ${filePath}:`, err.message);
      return false;
    }
  } else {
    console.log(`[INFO] Graph is already perfectly aligned in ${path.basename(filePath)}`);
    return true;
  }
}

console.log(`${colors.cyan}${colors.bold}Starting Automa Formatter (Auto-align)...${colors.reset}`);
let successCount = 0;
for (const file of filesToFormat) {
  const absolutePath = path.resolve(file);
  if (fs.existsSync(absolutePath)) {
    if (formatFile(absolutePath)) successCount++;
  } else {
    console.error(`[ERROR] File not found: ${absolutePath}`);
  }
}

if (successCount === filesToFormat.length) {
  process.exit(0);
} else {
  process.exit(1);
}
