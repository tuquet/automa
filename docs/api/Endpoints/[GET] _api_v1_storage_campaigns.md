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

## Responses

### 200
List of campaigns

- **Content-Type**: `application/json`
- **Schema**: Array<[[CampaignStorageItem]]>

### 500
Database read error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

