---
tags:
  - api/endpoint
  - api/Jobs
path: "/api/jobs"
method: "POST"
---
# POST /api/jobs

> [!info] 
> **Method**: `POST`
> **Path**: `/api/jobs`

## Request Body

- **Content-Type**: `application/json`
- **Schema**: [[SubmitJobPayload]]

## Responses

### 200
Job submitted successfully

- **Content-Type**: `application/json`
- **Schema**: [[SubmitJobResponse]]

### 400
Invalid request payload or file

### 503
Browser worker unavailable

