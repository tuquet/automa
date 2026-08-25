---
tags: [api/schema]
---
# JobLogPayload

Payload containing execution logs and telemetry emitted by a workflow step

**Type**: `object`

## Properties

| Name | Type | Description |
|---|---|---|
| `logs` | array,null | Array of structured log entries or node execution telemetry |
| `message` | string,null | Human-readable log message |
| `type` *(req)* | string | Log severity level ("info", "warn", "error", "debug") |
