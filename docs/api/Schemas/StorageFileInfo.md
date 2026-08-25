---
tags: [api/schema]
---
# StorageFileInfo

File descriptor for a workflow or campaign in the storage vault

**Type**: `object`

## Properties

| Name | Type | Description |
|---|---|---|
| `fileType` *(req)* | string | Type of file ("workflow" or "campaign") |
| `name` *(req)* | string | File base name |
| `path` *(req)* | string | Full absolute path on the filesystem |
| `relativePath` *(req)* | string | Path relative to the storage vault root |
