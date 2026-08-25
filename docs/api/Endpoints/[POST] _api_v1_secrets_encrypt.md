---
tags:
  - api/endpoint
  - api/Secrets
path: "/api/v1/secrets/encrypt"
method: "POST"
---
# Encrypt sensitive token or secret with AES-256

> [!info] 
> **Method**: `POST`
> **Path**: `/api/v1/secrets/encrypt`

Encrypts plaintext secrets using PBKDF2 and AES-GCM-256 authenticated encryption.

## Request Body

- **Content-Type**: `application/json`
- **Schema**: [[EncryptSecretRequest]]

## Responses

### 200
Secret encrypted successfully

- **Content-Type**: `application/json`
- **Schema**: [[EncryptSecretResponse]]

### 400
Missing plaintext or passphrase

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 500
Internal encryption failure

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

