---
tags: [api/schema]
---
# EncryptSecretRequest

Request payload to encrypt a secret string

**Type**: `object`

## Properties

| Name | Type | Description |
|---|---|---|
| `passphrase` | string,null | Optional encryption master passphrase (falls back to AUTOMA_PASSPHRASE env) |
| `plaintext` *(req)* | string | Plaintext string to encrypt |
