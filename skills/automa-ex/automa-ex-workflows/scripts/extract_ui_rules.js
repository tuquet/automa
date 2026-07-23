const fs = require('fs');
const path = require('path');
const compiler = require('@vue/compiler-sfc');

const componentsDir = 'C:/Users/pn.tund2/Documents/Repository/automa-ecosystem/automa-ex/src/components/newtab/workflow/edit';
const sharedBlocksPath = path.join(__dirname, '../resources/shared_blocks.json');
const outDir = path.join(__dirname, '../resources/blocks');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const sharedBlocks = JSON.parse(fs.readFileSync(sharedBlocksPath, 'utf8'));

// A simple recursive AST walker
function walkAST(node, parentConditions, results) {
  let currentConditions = [...parentConditions];
  
  // Check for v-if or v-show directives
  if (node.props) {
    const vIf = node.props.find(p => p.type === 7 && p.name === 'if' && p.exp);
    const vShow = node.props.find(p => p.type === 7 && p.name === 'show' && p.exp);
    if (vIf && vIf.exp && vIf.exp.loc) currentConditions.push(vIf.exp.loc.source);
    if (vShow && vShow.exp && vShow.exp.loc) currentConditions.push(vShow.exp.loc.source);
  }

  // Check for v-model binding
  if (node.props) {
    const vModel = node.props.find(p => 
      (p.type === 7 && p.name === 'model' && p.exp) || 
      (p.type === 6 && p.name === 'model-value' && p.value) 
    );
    const vBindModelValue = node.props.find(p => p.type === 7 && p.name === 'bind' && p.arg && p.arg.content === 'model-value' && p.exp);

    let bindingContent = null;
    if (vModel && vModel.exp && vModel.exp.loc) bindingContent = vModel.exp.loc.source;
    else if (vBindModelValue && vBindModelValue.exp && vBindModelValue.exp.loc) bindingContent = vBindModelValue.exp.loc.source;
    
    if (bindingContent && bindingContent.startsWith('data.')) {
      const fieldName = bindingContent.replace('data.', '');
      if (currentConditions.length > 0) {
        results.push({ field: fieldName, conditions: currentConditions });
      }
    }
  }

  if (node.children) {
    node.children.forEach(child => walkAST(child, currentConditions, results));
  }
  
  if (node.type === 9 && node.branches) {
    node.branches.forEach(branch => walkAST(branch, currentConditions, results));
  } else if (node.type === 10) {
    let branchConditions = [...currentConditions];
    if (node.condition && node.condition.loc) {
      branchConditions.push(node.condition.loc.source);
    }
    if (node.children) {
      node.children.forEach(child => walkAST(child, branchConditions, results));
    }
  }
}

let totalRulesFound = 0;
let filesGenerated = 0;

console.log('Starting Vue AST Scanner V2 (Knowledge Base Mapper)...');

for (const [blockId, blockDef] of Object.entries(sharedBlocks)) {
  let editComponent = blockDef.editComponent;
  if (!editComponent) {
     // Fallback: guess component name (e.g. active-tab -> EditActiveTab)
     editComponent = `Edit${blockId.charAt(0).toUpperCase() + blockId.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase())}`;
  }

  const outFilePath = path.join(outDir, `${blockId}.json`);
  let existing = {};
  if (fs.existsSync(outFilePath)) {
    try { existing = JSON.parse(fs.readFileSync(outFilePath, 'utf8')); } catch(e) {}
  }
  
  let allOf = existing.allOf || [];

  const vueFilePath = path.join(componentsDir, `${editComponent}.vue`);
  if (fs.existsSync(vueFilePath)) {
    const content = fs.readFileSync(vueFilePath, 'utf8');
    const { descriptor } = compiler.parse(content);
    
    if (descriptor.template) {
      const ast = compiler.compileTemplate({ 
        source: descriptor.template.content,
        id: blockId,
        filename: `${editComponent}.vue`
      }).ast;
      
      const results = [];
      walkAST(ast, [], results);
      
      if (results.length > 0) {
        // We only clear out old AST-generated rules if we want to overwrite them.
        // For now, let's just regenerate them.
        const newAllOf = [];
        results.forEach(res => {
          const ifProperties = {};
          let canTranslate = true;
          
          res.conditions.forEach(cond => {
            const eqMatch = cond.match(/^data\.([a-zA-Z0-9_]+)\s*===\s*['"]([^'"]+)['"]$/);
            const boolMatch = cond.match(/^data\.([a-zA-Z0-9_]+)$/);
            
            if (eqMatch) {
              ifProperties[eqMatch[1]] = { "const": eqMatch[2] };
            } else if (boolMatch) {
              ifProperties[boolMatch[1]] = { "const": true };
            } else {
              canTranslate = false;
            }
          });
          
          if (canTranslate) {
             newAllOf.push({
               if: { properties: ifProperties },
               then: { required: [res.field] }
             });
          }
        });
        
        // Merge and deduplicate
        newAllOf.forEach(rule => {
           const ruleStr = JSON.stringify(rule);
           if (!allOf.some(existingRule => JSON.stringify(existingRule) === ruleStr)) {
               allOf.push(rule);
           }
        });
        
        totalRulesFound += newAllOf.length;
      }
    }
  } else {
    // Component not found, which is fine (maybe it doesn't have an Edit UI)
  }

  // Always write the file, even if allOf is empty, so we guarantee 1 file per node!
  existing.allOf = allOf;
  fs.writeFileSync(outFilePath, JSON.stringify(existing, null, 2));
  filesGenerated++;
}

console.log(`\nScan Complete. Generated ${filesGenerated} Micro-Knowledge Base files in resources/blocks/.`);
console.log(`Successfully mapped ${totalRulesFound} strict JSON schema rules.`);
