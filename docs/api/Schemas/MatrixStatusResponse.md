---
tags: [api/schema]
---
# MatrixStatusResponse

Grid matrix telemetry and slot allocation for a campaign

**Type**: `object`

## Properties

| Name | Type | Description |
|---|---|---|
| `activeSlots` *(req)* | Array<[[MatrixSlotInfo]]> | Detailed matrix slots currently allocated |
| `campaignId` *(req)* | string | Unique campaign identifier |
| `completedTasks` *(req)* | integer | Number of completed tasks |
| `status` *(req)* | string | Overall campaign status ("active", "completed", "aborted") |
| `totalTasks` *(req)* | integer | Total tasks queued in the campaign |
