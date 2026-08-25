---
tags: [api/schema]
---
# TableRow

Single data row entry belonging to a storage table

**Type**: `object`

## Properties

| Name | Type | Description |
|---|---|---|
| `data` *(req)* | object | Key-value document payload of row columns |
| `id` *(req)* | string | Unique row identifier |
| `table_id` *(req)* | string | Parent table identifier |
