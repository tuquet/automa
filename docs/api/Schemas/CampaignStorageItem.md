---
tags: [api/schema]
---
# CampaignStorageItem

Campaign descriptor stored in central SQLite database

**Type**: `object`

## Properties

| Name | Type | Description |
|---|---|---|
| `createdAt` *(req)* | string | Creation timestamp (ISO 8601) |
| `cron` | string,null | Optional cron schedule expression |
| `data` *(req)* | object | Campaign data (members, tasks, matrix, concurrency settings) |
| `description` | string,null | Optional campaign description |
| `id` *(req)* | string | Unique campaign identifier |
| `name` *(req)* | string | Campaign display name |
| `updatedAt` *(req)* | string | Last modification timestamp (ISO 8601) |
| `version` *(req)* | string | Semantic version |
