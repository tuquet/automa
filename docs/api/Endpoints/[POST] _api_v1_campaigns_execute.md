---
tags:
  - api/endpoint
  - api/Campaigns
path: "/api/v1/campaigns/execute"
method: "POST"
---
# Execute a multi-instance automation campaign

> [!info] 
> **Method**: `POST`
> **Path**: `/api/v1/campaigns/execute`

Parses a campaign descriptor from SQLite database or file, provisions required browser profiles, allocates grid matrix slots, and starts parallel workflow execution jobs.

## Request Body

- **Content-Type**: `application/json`
- **Schema**: [[ExecuteCampaignRequest]]

## Responses

### 200
Campaign execution scheduled

- **Content-Type**: `application/json`
- **Schema**: [[ExecuteCampaignResponse]]

### 400
Invalid campaign payload or unreadable descriptor

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

