---
tags:
  - api/endpoint
  - api/Secrets
path: "/api/secrets/encryption"
method: "POST"
---
# POST /api/secrets/encryption

> [!info] 
> **Method**: `POST`
> **Path**: `/api/secrets/encryption`

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

### 500
Internal Server Error

