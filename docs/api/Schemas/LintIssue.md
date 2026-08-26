---
tags: [api/schema]
---
# LintIssue

Diagnostic issue report detected by the linter

**Type**: `object`

## Properties

| Name | Type | Description |
|---|---|---|
| `code` | string,null | Machine-readable rule code for IDE filtering and categorization |
| `message` *(req)* | string | Detailed diagnostic explanation |
| `nodeId` | string,null | Node ID associated with this diagnostic issue, if applicable |
| `path` | string,null | JSONPath location of the affected element |
| `severity` *(req)* | [[LintSeverity]] | Severity level ("warning", "error", "info") |
