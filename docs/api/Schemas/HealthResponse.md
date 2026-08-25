---
tags: [api/schema]
---
# HealthResponse

Daemon health check response

**Type**: `object`

## Properties

| Name | Type | Description |
|---|---|---|
| `message` *(req)* | string | Status message description |
| `status` *(req)* | string | Overall operational status ("ok", "degraded") |
| `version` *(req)* | string | Semantic version of the running daemon binary |
