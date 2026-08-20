---
tags:
  - api/endpoint
  - api/Secrets
path: "/api/secrets/encrypt"
method: "POST"
---
# POST /api/secrets/encrypt

> [!info] 
> **Method**: `POST`
> **Path**: `/api/secrets/encrypt`

## Request Body

- **Content-Type**: `application/json`
- **Schema**: [[EncryptSecretRequest]]

## Responses

### 200
Secret encrypted successfully

- **Content-Type**: `application/json`
- **Schema**: [[EncryptSecretResponse]]

### 400
Bad Request

- **Content-Type**: `application/json`
- **Schema**: [[ErrorResponse]]

### 500
Internal Server Error

- **Content-Type**: `application/json`
- **Schema**: [[ErrorResponse]]

