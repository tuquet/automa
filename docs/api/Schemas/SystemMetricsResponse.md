---
tags: [api/schema]
---
# SystemMetricsResponse

Real-time CPU, RAM, and browser runner metrics

**Type**: `object`

## Properties

| Name | Type | Description |
|---|---|---|
| `activeRunners` *(req)* | integer | Number of actively connected browser runner instances |
| `cpuUsage` *(req)* | number | Global CPU utilization percentage (0 - 100) |
| `memoryFree` *(req)* | integer | Free system memory in bytes |
| `memoryTotal` *(req)* | integer | Total system physical memory in bytes |
