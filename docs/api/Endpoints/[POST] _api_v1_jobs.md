---
tags:
  - api/endpoint
  - api/Jobs
path: "/api/v1/jobs"
method: "POST"
---
# Submit a workflow execution job

> [!info] 
> **Method**: `POST`
> **Path**: `/api/v1/jobs`

Submits a new automation workflow job to be executed by a browser worker instance. Supports workflowId, inline workflowData, or filesystem workflowPath. Automatically ensures the required browser instance is launched and connected.

## Request Body

- **Content-Type**: `application/json`
- **Schema**: [[SubmitJobPayload]]

## Responses

### 200
Job submitted and accepted for execution

- **Content-Type**: `application/json`
- **Schema**: [[SubmitJobResponse]]

### 400
Invalid request payload or unreadable workflow file

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 429
Maximum concurrent jobs reached

- **Content-Type**: `application/json`
- **Schema**: [[SubmitJobResponse]]

### 503
Browser worker unavailable or connection timeout

- **Content-Type**: `application/json`
- **Schema**: [[SubmitJobResponse]]

