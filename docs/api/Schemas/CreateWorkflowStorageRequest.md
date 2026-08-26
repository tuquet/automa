---
tags: [api/schema]
---
# CreateWorkflowStorageRequest

Request payload for creating a new workflow in SQLite database

**Type**: `object`

## Properties

| Name | Type | Description |
|---|---|---|
| `data` *(req)* | object | Workflow graph AST (nodes, edges, settings) |
| `description` | string,null | Optional workflow description |
| `icon` | string,null | Optional UI icon name |
| `id` | string,null | Optional custom identifier (auto-generated if omitted) |
| `name` *(req)* | string | Workflow display name |
| `version` | string,null | Optional version (defaults to 1.0.0) |
