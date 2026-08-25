---
tags: [api/schema]
---
# ExecuteCampaignRequest

Request payload to trigger or schedule a campaign execution

**Type**: `object`

## Properties

| Name | Type | Description |
|---|---|---|
| `campaignId` | string,null | Optional custom campaign identifier |
| `campaignPath` | string,null | Path to the `.campaign.json` descriptor file |
| `runNow` | boolean,null | Immediately start executing jobs |
| `useGrid` | boolean,null | Automatically tile browser windows across screen grid |
