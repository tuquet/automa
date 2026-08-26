---
tags: [api/schema]
---
# LintRequest

Request payload to lint workflows, campaigns, browsers, or packages

**Type**: `object`

## Properties

| Name | Type | Description |
|---|---|---|
| `content` | object,null | Optional raw JSON content or document for auto-detection |
| `drawflow` | object,null | Optional entire workflow payload containing nested drawflow |
| `edges` | array,null | Array of workflow edge connection descriptors |
| `mode` | null | [[LintMode]] |  |
| `nodes` | array,null | Array of workflow block node definitions |
| `targetType` | null | [[LintTargetType]] |  |
