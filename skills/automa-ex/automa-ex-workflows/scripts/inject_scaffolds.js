const fs = require('fs');
const path = require('path');

const resourcesDir = path.join(__dirname, '../resources');
const blocksDir = path.join(resourcesDir, 'blocks');
const commonValidatePath = path.join(resourcesDir, 'common_validate.json');

// 1. Update common_validate.json
if (fs.existsSync(commonValidatePath)) {
  const commonValidate = JSON.parse(fs.readFileSync(commonValidatePath, 'utf8'));
  
  if (commonValidate.CommonProperties && commonValidate.CommonProperties.properties) {
    // Ensure properties exist
    commonValidate.CommonProperties.properties.addExtraRow = { type: 'boolean' };
    commonValidate.CommonProperties.properties.extraRowDataColumn = { type: 'string' };

    // Add allOf constraints
    commonValidate.CommonProperties.allOf = [
      {
        if: { properties: { assignVariable: { const: true } }, required: ["assignVariable"] },
        then: { required: ["variableName"], properties: { variableName: { minLength: 1 } } }
      },
      {
        if: { properties: { saveData: { const: true } }, required: ["saveData"] },
        then: { required: ["dataColumn"] }
      },
      {
        if: { properties: { addExtraRow: { const: true } }, required: ["addExtraRow"] },
        then: { required: ["extraRowDataColumn"] }
      }
    ];
    
    fs.writeFileSync(commonValidatePath, JSON.stringify(commonValidate, null, 2));
    console.log('[SUCCESS] Updated common_validate.json');
  }
}

// 2. Update specific blocks
const blockUpdates = {
  'trigger.json': {
    allOf: [
      {
        if: { properties: { type: { const: 'interval' } }, required: ['type'] },
        then: { required: ['interval'] }
      },
      {
        if: { properties: { type: { const: 'date' } }, required: ['type'] },
        then: { required: ['date'] }
      },
      {
        if: { properties: { type: { const: 'specific-day' } }, required: ['type'] },
        then: { required: ['days'] }
      }
    ]
  },
  'proxy.json': {
    properties: {
      timeout: { type: 'number', minimum: 0 }
    }
  },
  'javascript-code.json': {
    properties: {
      timeout: { type: 'number', minimum: 0 }
    }
  },
  'google-sheets-drive.json': {
    properties: {
      action: { enum: ['read', 'write', 'update', 'delete'] }
    }
  }
};

for (const [filename, content] of Object.entries(blockUpdates)) {
  const filePath = path.join(blocksDir, filename);
  if (fs.existsSync(filePath)) {
    const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const merged = { ...existing, ...content };
    fs.writeFileSync(filePath, JSON.stringify(merged, null, 2));
    console.log(`[SUCCESS] Updated ${filename}`);
  }
}

console.log('All scaffolds injected successfully.');
