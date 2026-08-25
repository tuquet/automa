---
tags:
  - api/endpoint
  - api/Browsers
path: "/api/v1/browsers/{id}/cookies"
method: "POST"
---
# Import cookies into a browser profile

> [!info] 
> **Method**: `POST`
> **Path**: `/api/v1/browsers/{id}/cookies`

Batch writes and encrypts an array of cookies directly into the browser profile's Chromium SQLite cookie database.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Unique browser profile identifier |

## Request Body

- **Content-Type**: `application/json`
- **Schema**: Array<[[Cookie]]>

## Responses

### 200
Cookies successfully imported

- **Content-Type**: `application/json`
- **Schema**: any

### 400
Malformed cookie data

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 500
Failed to write cookies to database

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

