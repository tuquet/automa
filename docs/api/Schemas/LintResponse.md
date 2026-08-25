---
tags: [api/schema]
---
# LintResponse

Result of workflow AST validation and lint checks

**Type**: `object`

## Properties

| Name | Type | Description |
|---|---|---|
| `issues` *(req)* | Array<[[LintIssue]]> | List of detected validation warnings and errors |
| `valid` *(req)* | boolean | Whether the workflow passed validation without errors |
