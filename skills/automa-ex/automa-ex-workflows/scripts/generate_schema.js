const fs = require('fs');
const path = require('path');

const sharedBlocksPath = path.join(__dirname, '../resources/shared_blocks.json');
const commonValidatePath = path.join(__dirname, '../resources/common_validate.json');
const blocksDir = path.join(__dirname, '../resources/blocks');
const schemaOutPath = path.join(__dirname, '../schemas/automa.schema.json');

if (!fs.existsSync(sharedBlocksPath)) {
  console.error('[ERROR] shared_blocks.json not found.');
  process.exit(1);
}

const sharedBlocks = JSON.parse(fs.readFileSync(sharedBlocksPath, 'utf8'));

let commonValidate = {};
if (fs.existsSync(commonValidatePath)) {
  commonValidate = JSON.parse(fs.readFileSync(commonValidatePath, 'utf8'));
}

const schema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Automa Workflow Schema V7",
  "type": "object",
  "definitions": {
    ...commonValidate
  }
};

// 1. Build Base Definitions from shared_blocks.json
for (const [key, blockDef] of Object.entries(sharedBlocks)) {
  const componentName = `Block${key.charAt(0).toUpperCase() + key.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase())}`;
  
  const properties = {};
  if (blockDef.data) {
    for (const dataKey of Object.keys(blockDef.data)) {
      if (commonValidate.CommonProperties && commonValidate.CommonProperties.properties[dataKey]) {
        continue; // Handled by $ref
      }
      properties[dataKey] = {};
    }
  }

  const blockSchema = {
    type: "object",
    properties: {
      label: {
        const: key
      },
      data: {
        type: "object",
        properties: properties,
        additionalProperties: true
      }
    },
    required: ["label"]
  };

  if (commonValidate.CommonProperties) {
    if (!blockSchema.properties.data.allOf) blockSchema.properties.data.allOf = [];
    blockSchema.properties.data.allOf.push({ "$ref": "#/definitions/CommonProperties" });
  }

  schema.definitions[componentName] = blockSchema;
}

// 2. Read specific node knowledge bases (1 file per node)
if (fs.existsSync(blocksDir)) {
  const blockFiles = fs.readdirSync(blocksDir).filter(f => f.endsWith('.json'));
  for (const file of blockFiles) {
    const nodeType = file.replace('.json', ''); // e.g., 'webhook'
    // Convert to PascalCase with 'Block' prefix (webhook -> BlockWebhook, workflow-state -> BlockWorkflowState)
    const componentName = `Block${nodeType.charAt(0).toUpperCase() + nodeType.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase())}`;
    
    const filePath = path.join(blocksDir, file);
    try {
      const nodeRules = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      if (schema.definitions[componentName]) {
        // Merge the rules into the existing definition
        if (nodeRules.allOf) {
          if (!schema.definitions[componentName].properties.data.allOf) {
             schema.definitions[componentName].properties.data.allOf = [];
          }
          schema.definitions[componentName].properties.data.allOf.push(...nodeRules.allOf);
        }
        
        // Merge extra properties or required fields if defined in the specific node file
        if (nodeRules.properties) {
           Object.assign(schema.definitions[componentName].properties.data.properties, nodeRules.properties);
        }
        if (nodeRules.required) {
           schema.definitions[componentName].properties.data.required = nodeRules.required;
        }
      } else {
        console.warn(`[WARN] Node '${nodeType}' found in resources/blocks/ but not in shared_blocks.json`);
      }
    } catch (e) {
      console.error(`[ERROR] Failed to parse specific node file ${file}:`, e.message);
    }
  }
} else {
  console.log('[INFO] resources/blocks directory not found. No specific node rules applied.');
}

const rootSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Automa Workflow Schema V7",
  type: "object",
  properties: {
    drawflow: {
      type: "object",
      properties: {
        nodes: {
          type: "array",
          items: {
            anyOf: Object.keys(schema.definitions)
              .filter(k => k.startsWith('Block') && k !== 'BlockParameterPrompt')
              .map(k => ({ $ref: `#/definitions/${k}` }))
          }
        },
        edges: {
          type: "array"
        }
      }
    }
  },
  definitions: schema.definitions
};

fs.writeFileSync(schemaOutPath, JSON.stringify(rootSchema, null, 2));
console.log(`[INFO] Schema generated successfully at schemas/automa.schema.json with ${Object.keys(schema.definitions).length} node definitions and root drawflow structure.`);
