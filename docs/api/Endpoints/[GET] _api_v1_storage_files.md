---
tags:
  - api/endpoint
  - api/Storage
path: "/api/v1/storage/files"
method: "GET"
---
# List all workflow and campaign files in storage workspace

> [!info] 
> **Method**: `GET`
> **Path**: `/api/v1/storage/files`

Recursively traverses the `automa-vault` storage directory and returns metadata for all `.workflow.json` and `.campaign.json` files.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `limit` | query |  | integer,null | Maximum number of files to return |
| `offset` | query |  | integer,null | Number of items to skip for pagination (default 0) |
| `search` | query |  | string,null | Optional search query to filter files by name or relative path |

## Responses

### 200
List all workflow and campaign files in storage

- **Content-Type**: `application/json`
- **Schema**: Array<[[StorageFileInfo]]>

### 500
Failed to list storage files

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

