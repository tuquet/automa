---
tags:
  - api/endpoint
  - api/Storage
path: "/api/v1/storage/campaigns"
method: "GET"
---
# List all campaigns from storage database

> [!info] 
> **Method**: `GET`
> **Path**: `/api/v1/storage/campaigns`

Retrieves all campaigns persisted in the central SQLite database.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `limit` | query |  | integer,null | Maximum number of campaigns to return |
| `offset` | query |  | integer,null | Number of items to skip for pagination (default 0) |
| `search` | query |  | string,null | Optional search query to filter campaigns by name, ID or description |

## Responses

### 200
List of campaigns

- **Content-Type**: `application/json`
- **Schema**: Array<[[CampaignStorageItem]]>

### 500
Database read error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

