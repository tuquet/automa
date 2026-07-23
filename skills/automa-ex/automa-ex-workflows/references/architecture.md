# Automa Knowledge Base Architecture

The Automa Skill relies on a highly advanced, fully decoupled **3-Layer Data-Driven Architecture**. We do not use imperative linters or hardcoded runner scripts to define business logic. All logic is stored purely as JSON data.

Any System Architect Agent tasked with maintaining or updating the Automa Schema MUST understand this architecture and ONLY modify the JSON knowledge dictionaries.

## The 3-Layer Knowledge Base

### Layer 1: The Physical Base (`shared_blocks.json`)
- **Purpose**: Defines the raw, physical existence of a block (its label, ID, and base properties).
- **Source**: Extracted directly from Automa's `shared.js` definitions.
- **Rule**: Do not manually modify this unless Automa releases a brand new block.

### Layer 2: The UI Constraints (`common_validate.json` & `blocks/*.json`)
- **Purpose**: Defines conditional UI rules (e.g., if a checkbox is checked, an input becomes required).
- **`common_validate.json`**: Contains global rules applicable to many blocks (like the rule enforcing `variableName` when `assignVariable` is true).
- **`blocks/*.json`**: A micro-knowledge base mapping exactly **1 JSON file per Automa Node** (61 files total).
- **Rule**: If a block gets a new UI property or conditional requirement, you MUST edit its specific file in `resources/blocks/` (e.g., `resources/blocks/webhook.json`).

### Layer 3: The Semantic Blueprint (`semantic_rules.json`)
- **Purpose**: Defines the Topology (how blocks connect) and the Memory Scope (how variables are created and read). This acts as the universal "Semantic Contract" for the engine.
- **Topology (`topologyRules`)**: Defines allowed and required output ports (edges) for each block type.
- **Variables (`variableRules`)**: Defines how variables are assigned (extractors) and how they persist (prefixes like `$$`).
- **Interpolation (`interpolationRules`)**: Defines the valid Mustache namespaces (e.g., `variables`, `loopData`) to prevent hallucinated namespaces like `{{aogiac.abc}}`.

## The Generator Pipeline
After modifying any file in the Knowledge Base (`resources/`), you MUST recompile the master schema.
Run:
```bash
node scripts/generate_schema.js
```
This script acts as a compiler. It merges Layer 1, Layer 2, and common properties into a single, massive `automa.schema.json` which is then used for validation.

## Anti-Pattern: The Dumb Runner
There is NO dedicated custom linter script in the modern architecture. Older iterations used `lint_automa.js` containing hardcoded `if/else` logic. This is completely obsolete.
To validate an Automa workflow, agents should use standard JSON Schema tools (like `ajv`) against the generated `automa.schema.json`. All semantic and structural validation logic is declarative and lives inside the JSON files.
