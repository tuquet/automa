---
tags: [api/schema]
---
# ExecuteCampaignResponse

Response returned after scheduling a campaign

**Type**: `object`

## Properties

| Name | Type | Description |
|---|---|---|
| `allocatedSlots` *(req)* | Array<[[MatrixSlotInfo]]> | Grid matrix slot assignments |
| `campaignId` *(req)* | string | Unique campaign identifier |
| `jobIds` *(req)* | Array<string> | List of created job identifiers |
| `status` *(req)* | string | Current campaign state |
| `totalJobs` *(req)* | integer | Total execution jobs generated |
