---
tags: [api/schema]
---
# MatrixSlotInfo

Display bounds and runtime state for a grid window slot

**Type**: `object`

## Properties

| Name | Type | Description |
|---|---|---|
| `browserId` | string,null | Assigned browser profile ID (if any) |
| `height` *(req)* | integer | Window height in pixels |
| `slotIndex` *(req)* | integer | 0-indexed matrix slot position |
| `status` *(req)* | string | Slot status ("ready", "running", "completed", "failed") |
| `width` *(req)* | integer | Window width in pixels |
| `x` *(req)* | integer | Window X coordinate in pixels |
| `y` *(req)* | integer | Window Y coordinate in pixels |
