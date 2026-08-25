---
tags:
  - api/endpoint
  - api/Browsers
path: "/api/v1/browsers/import-csv"
method: "POST"
---
# Batch import browser profiles from CSV

> [!info] 
> **Method**: `POST`
> **Path**: `/api/v1/browsers/import-csv`

Parses a multi-line CSV string and batch inserts new browser profiles into SQLite.

## Request Body

- **Content-Type**: `application/json`
- **Schema**: [[ImportCsvPayload]]

## Responses

### 200
CSV profiles successfully parsed and imported

- **Content-Type**: `application/json`
- **Schema**: [[ImportCsvResponse]]

### 400
Malformed CSV format

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

