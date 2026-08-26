---
tags: [api/schema]
---
# SubmitJobPayload

Request payload for submitting a new workflow execution job

**Type**: `object`

## Properties

| Name | Type | Description |
|---|---|---|
| `options` | null | [[SubmitJobOptions]] |  |
| `workflowData` | object,null | Raw inline workflow JSON payload (alternative to workflowPath or workflowId) |
| `workflowId` | string,null | Unique identifier of the workflow to execute |
| `workflowPath` | string,null | Absolute or relative filesystem path to the `.workflow.json` file (deprecated, prefer workflowId) |
