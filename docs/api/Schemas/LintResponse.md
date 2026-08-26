---
tags: [api/schema]
---
# LintResponse

Result of static AST and schema validation

**Type**: `object`

## Properties

| Name | Type | Description |
|---|---|---|
| `issues` *(req)* | Array<[[LintIssue]]> | List of detected validation warnings, errors, and info diagnostics |
| `mode` *(req)* | [[LintMode]] | Mode used during evaluation |
| `targetType` *(req)* | [[LintTargetType]] | Detected asset target type |
| `valid` *(req)* | boolean | Whether the asset passed validation without errors |
