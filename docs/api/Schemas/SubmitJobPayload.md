---
tags: [api/schema]
---
# SubmitJobPayload

Payload for submitting a new background job

**Type**: `object`

## Properties

| Name | Type | Description |
|---|---|---|
| `description` | string,null | Optional human-readable description or note for this job execution (useful for AI Agents to explain their intent). |
| `options` | null | [[SubmitJobOptions]] |  |
| `workflowPath` *(req)* | string | Absolute or relative path to the `.workflow.json` file. |
