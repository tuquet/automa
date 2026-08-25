---
tags: [api/schema]
---
# SaveWorkflowPayload

Request payload for saving or updating a workflow file

**Type**: `object`

## Properties

| Name | Type | Description |
|---|---|---|
| `content` *(req)* | object | Workflow JSON content object (nodes, edges, settings) |
| `path` *(req)* | string | Target filesystem path where the workflow should be written |
