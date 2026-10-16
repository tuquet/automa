---
name: specter-automa
description: >
  Headless automation runner and visual DAG engine for browser tasks via native CDP and local SQLite store.
  Trigger: /specter-automa, "specter automa", "run workflow", "inspect workflow", "automa studio".
argument-hint: "[run|list|inspect|studio] [workflow.json]"
license: MIT
---

# Specter Automa Runner (`specter-automa`)

Raw Rust CDP execution. No Electron bloat. Fast, headless, and reproducible browser workflows backed by local SQLite run state.

## Code & Specification Pointers (Code-as-Docs)

Read native source definitions on demand:
- Automa Driver Implementation: [runner/src/drivers/automa.rs](../../../runner/src/drivers/automa.rs)
- Job Payload Schema: [runner/src/protocol/schema.rs](../../../runner/src/protocol/schema.rs)
- TypeScript Type Definitions: [automa/packages/types/src/job.ts](../../../automa/packages/types/src/job.ts)

## Native Commands

```powershell
# 1. List workflows in local vault (~/.specter/automa/workflows/)
specter automa list

# 2. Execute workflow headlessly with timeout
specter automa run ./workflows/my_flow.json --headless --timeout 60

# 3. Validate workflow DAG syntax without browser execution
specter automa inspect ./workflows/my_flow.json

# 4. Launch visual drag-and-drop studio in browser
specter automa studio
```

## Storage Pillar

All workflow definitions and executions resolve strictly to `~/.specter/automa/`:
- Definitions: `~/.specter/automa/workflows/*.json`
- Run Database: `~/.specter/automa/automa.sqlite`
- Logs & Traces: `~/.specter/automa/logs/`

## Output Contract

Report execution results strictly:
```text
[AUTOMA] Flow: <name> (<file>)
• Steps: <N> nodes | DAG: <VALID|BROKEN>
• Execution: Success in <elapsed>ms | Captured: <items> records
Trace: ~/.specter/automa/logs/<run_id>.log
```

## Boundaries

Do NOT modify `.json` workflow definition files during run or inspect. Output execution status and exit. One-shot execution.
