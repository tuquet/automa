---
tags: [api/schema]
---
# StorageVariable

Global variable stored in Automa SQLite / FS storage

**Type**: `object`

## Properties

| Name | Type | Description |
|---|---|---|
| `id` | string,null | Unique variable identifier |
| `key` | string,null | Unique variable key used in workflow expressions |
| `name` | string,null | Human-friendly display label |
| `value` *(req)* | object | Arbitrary JSON value or primitive stored |
