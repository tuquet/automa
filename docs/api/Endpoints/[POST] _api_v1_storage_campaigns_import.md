---
tags:
  - api/endpoint
  - api/Storage
path: "/api/v1/storage/campaigns/import"
method: "POST"
---
# Import a campaign JSON into storage database

> [!info] 
> **Method**: `POST`
> **Path**: `/api/v1/storage/campaigns/import`

Parses and imports a campaign JSON object into SQLite database.

## Request Body

- **Content-Type**: `application/json`
- **Schema**: [[ImportCampaignStorageRequest]]

## Responses

### 200
Campaign imported successfully

- **Content-Type**: `application/json`
- **Schema**: [[CampaignStorageItem]]

### 400
Invalid campaign JSON

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 500
Database write error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

