---
tags:
  - api/endpoint
  - api/Storage
path: "/api/v1/storage/campaigns"
method: "POST"
---
# Create or persist a campaign in database

> [!info] 
> **Method**: `POST`
> **Path**: `/api/v1/storage/campaigns`

Creates a new campaign record or updates an existing record in SQLite database.

## Request Body

- **Content-Type**: `application/json`
- **Schema**: [[CreateCampaignStorageRequest]]

## Responses

### 200
Campaign created successfully

- **Content-Type**: `application/json`
- **Schema**: [[CampaignStorageItem]]

### 400
Invalid campaign payload

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 500
Database write error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

