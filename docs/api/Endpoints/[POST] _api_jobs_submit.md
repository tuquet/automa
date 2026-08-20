---
tags:
  - api/endpoint
  - api/Jobs
path: "/api/jobs/submit"
method: "POST"
---
# POST /api/jobs/submit

> [!info] 
> **Method**: `POST`
> **Path**: `/api/jobs/submit`

## Request Body

- **Content-Type**: `application/json`
- **Schema**: [[SubmitJobPayload]]

## Responses

### 200
Job submitted successfully

- **Content-Type**: `application/json`
- **Schema**: [[SubmitJobResponse]]

