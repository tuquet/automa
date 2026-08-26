---
tags: [api/schema]
---
# CreateCampaignStorageRequest

Request payload for creating a new campaign in SQLite database

**Type**: `object`

## Properties

| Name | Type | Description |
|---|---|---|
| `cron` | string,null | Optional cron expression |
| `data` *(req)* | object | Campaign data (members, tasks, matrix) |
| `description` | string,null | Optional campaign description |
| `id` | string,null | Optional custom identifier |
| `name` *(req)* | string | Campaign display name |
| `version` | string,null | Optional version (defaults to 1.0.0) |
