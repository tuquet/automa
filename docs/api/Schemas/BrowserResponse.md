---
tags: [api/schema]
---
# BrowserResponse

Browser profile descriptor

**Type**: `object`

## Properties

| Name | Type | Description |
|---|---|---|
| `createdAt` *(req)* | string | Creation timestamp (ISO 8601) |
| `id` *(req)* | string | Unique browser profile identifier |
| `isOnline` *(req)* | boolean | Whether an active browser process is currently connected |
| `name` *(req)* | string | User-friendly profile label |
| `timezone` | string,null | Emulated timezone ID |
| `updatedAt` *(req)* | string | Last update timestamp (ISO 8601) |
| `userAgent` | string,null | Custom User-Agent header string |
