---
tags: [api/schema]
---
# SubmitJobResponse

Response returned after successfully submitting a workflow job

**Type**: `object`

## Properties

| Name | Type | Description |
|---|---|---|
| `jobId` *(req)* | string | Unique identifier of the created execution job |
| `message` | string,null | Optional status or error message |
| `status` *(req)* | string | Initial lifecycle status (e.g. "queued", "running") |
