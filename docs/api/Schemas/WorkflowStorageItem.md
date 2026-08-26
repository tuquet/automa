---
tags: [api/schema]
---
# WorkflowStorageItem

Workflow descriptor stored in central SQLite database

**Type**: `object`

## Properties

| Name | Type | Description |
|---|---|---|
| `createdAt` *(req)* | string | Creation timestamp (ISO 8601) |
| `data` *(req)* | object | Workflow graph AST (nodes, edges, settings) |
| `description` | string,null | Optional workflow description |
| `icon` | string,null | Optional UI icon identifier |
| `id` *(req)* | string | Unique workflow identifier |
| `name` *(req)* | string | Workflow display name |
| `updatedAt` *(req)* | string | Last modification timestamp (ISO 8601) |
| `version` *(req)* | string | Semantic version of the workflow |
