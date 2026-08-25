---
tags: [api/schema]
---
# CreateBrowserRequest

Request payload for creating a new browser profile

**Type**: `object`

## Properties

| Name | Type | Description |
|---|---|---|
| `id` | string,null | Optional custom ID (auto-generated UUID if omitted) |
| `name` *(req)* | string | User-friendly profile name |
| `timezone` | string,null | Emulated timezone ID |
| `userAgent` | string,null | Custom User-Agent header |
