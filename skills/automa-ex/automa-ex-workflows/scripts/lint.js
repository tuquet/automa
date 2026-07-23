const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const ajvErrors = require("ajv-errors");
const fs = require("fs");
const path = require("path");

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const schemaPath = path.resolve(__dirname, "../schemas/automa.schema.json");
const dataPath = process.argv[2];

if (!dataPath) {
  console.error(`${colors.red}Usage: npm run lint -- <path-to-workflow.json>${colors.reset}`);
  process.exit(1);
}

let hasError = false;

function logError(msg) {
  console.error(`${colors.red}${colors.bold}[ERROR]${colors.reset} ${msg}`);
  hasError = true;
}

try {
  let content = fs.readFileSync(dataPath, "utf8");
  if (content.includes('Ã')) {
    logError(`Mojibake (Encoding Error) detected in: ${dataPath}`);
  }

  const data = JSON.parse(content);
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));

  console.log(`${colors.cyan}Phase 1: Strict JSON Schema Validation (AJV)...${colors.reset}`);
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  ajvErrors(ajv);

  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (!valid) {
    validate.errors.forEach(err => {
      logError(`${err.instancePath} ${err.message}`);
    });
  } else {
    console.log(`${colors.green}✅ AJV Schema Validation PASSED.${colors.reset}`);
  }

  console.log(`${colors.cyan}Phase 2: Structural & Referential Integrity Validation...${colors.reset}`);
  
  if (data.drawflow && data.drawflow.nodes && data.drawflow.edges) {
    const nodes = data.drawflow.nodes;
    const edges = data.drawflow.edges;
    const nodeMap = new Map();

    // 1. Build Node Map & Check for Duplicate IDs
    for (const node of nodes) {
      if (nodeMap.has(node.id)) {
        logError(`Duplicate Node ID detected: '${node.id}' (${node.label}). This breaks Vue Flow.`);
      }
      nodeMap.set(node.id, node);
    }

    // 2. Validate Edges
    for (const edge of edges) {
      const sourceNode = nodeMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);

      if (!sourceNode) logError(`Edge '${edge.id}' has unknown source node: '${edge.source}'`);
      if (!targetNode) logError(`Edge '${edge.id}' has unknown target node: '${edge.target}'`);

      if (edge.id.startsWith('vueflow__edge-')) {
        const expectedId = `vueflow__edge-${edge.source}${edge.sourceHandle}-${edge.target}${edge.targetHandle}`;
        if (edge.id !== expectedId) {
          logError(`Edge '${edge.id}' has malformed ID. Expected: '${expectedId}'`);
        }
      }
    }
  }

  if (hasError) {
    console.error(`\n${colors.red}${colors.bold}❌ Linting FAILED. Please fix the errors above.${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`\n${colors.green}${colors.bold}✅ Linting PASSED PERFECTLY.${colors.reset}`);
  }

} catch (e) {
  console.error(`${colors.red}Error during validation: ${e.message}${colors.reset}`);
  process.exit(1);
}
