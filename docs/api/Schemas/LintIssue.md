---
tags: [api/schema]
---
# LintIssue

Diagnostic issue report detected by the workflow linter

**Type**: `object`

## Properties

| Name | Type | Description |
|---|---|---|
| `message` *(req)* | string | Detailed diagnostic explanation |
| `path` | string,null | JSONPath location of the affected element |
| `severity` *(req)* | string | Severity level ("warning", "error") |
