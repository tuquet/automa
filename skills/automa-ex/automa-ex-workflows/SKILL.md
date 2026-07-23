---
name: automa-ex-workflows
description: "Guidelines for creating, editing, and reviewing Automa JSON workflows. Trigger: automa, workflow json, automa json, review workflow, branching test, test package, multiple outputs."
---

# Automa Workflow Best Practices

> [!WARNING]
> **For Agents Maintaining the Skill:** DO NOT edit `.schema.json` files manually! We use a decoupled, 3-Layer Data-Driven Architecture. You MUST read `references/architecture.md` before making any schema updates. All logic is stored in JSON format; do not attempt to write custom JS linters.

> [!IMPORTANT]
> **Git Repository Rules:** NEVER use `git commit` or `git push` on your own accord when working on workflows or schemas. Pushing code to remote is an important, sensitive action. **ONLY the USER** is allowed to push code. Leave all completed changes in the Staging Area or Working Directory for the user to review.

Automa Workflows require absolute precision regarding Data Structure (Schema) and strict adherence to Business Logic. This SKILL is designed in Modules to help Agents easily look up knowledge.

## 1. Master Handbook (Knowledge Base)
- **[Automa Master Handbook](./references/automa-handbook.md)**: The single source of truth containing all Rules, Anti-Patterns, DOM Selection Strategies, Advanced Blocks, and Self-Healing principles. Agents MUST read this handbook if they are unsure about any Automa logic.
- **[Architecture Bible](./references/architecture.md)**: Required reading if you are asked to *update* or *maintain* the Automa schemas or knowledge base rules.

## 2. Schemas & Assets (Data Standards)
- **[Workflow Schema](./schemas/automa.schema.json)**: Source of Truth to ensure the output JSON format for Workflows is 100% valid.
- **[Package Schema](./schemas/package.schema.json)**: Source of Truth for generating reusable Automa Packages (Custom Blocks with multiple outputs).

## 3. Agent Workflow Guidelines (Recommended Flow)
When asked to create or modify an Automa Workflow, the Agent MUST follow this workflow:
1. **Design & Plan**:
   - Sketch out the workflow logic (use ASCII diagrams if complex).
   - Parameterize all inputs under `trigger.parameters`. Absolutely no hardcoded credentials or environment URLs.
   - Anticipate failures by using self-healing patterns (e.g. `onError: { enable: true, toDo: "fallback" }`, wait selectors).
2. **Generate JSON & Docs**:
   - Generate the workflow strictly following the `automa.schema.json`.
   - **MANDATORY**: Inject `note` blocks into the workflow JSON to visually document the core stages/logic of the workflow directly on the canvas. This acts as self-contained documentation.
   - Never guess DOM selectors without actual HTML context. 
3. **Validation Phase (Schema & Advanced Semantic Flow)**:
   - Before delivering the JSON to the user, you MUST pass both validation layers:
     - **Layer 1 (Schema)**: Handled by AJV to ensure the data structure is valid.
     - **Layer 2 (Advanced Semantic Flow)**: Ensures there are no Infinite Loops, Dead Code, Orphaned Variables, or Mustache Interpolation errors (e.g. `{{fake.var}}`).
   - Command: `node <skillPath>/scripts/lint_automa.js <target_json_file>` (This script runs both layers).
   - > [!CAUTION]
   - > **NEVER BYPASS THE ADVANCED FLOW**. AJV alone cannot catch Graph Cycles or Mustache Hallucinations. You MUST run `lint_automa.js` and fix all warnings/errors before claiming the task is done.
   - Save the valid JSON to the user's requested path or provide it for import.

## 4. Prompt Templates (User Interfaces)
- **[Workflow Request Form](./templates/workflow_request.md)**: **STRICT RULE**: When a user asks you to create a workflow, you MUST ensure they have provided the information listed in this template. If they do not provide exact DOM selectors, you MUST ask them to fill out this template or provide the selectors before you generate the JSON. Never guess or hallucinate DOM selectors.