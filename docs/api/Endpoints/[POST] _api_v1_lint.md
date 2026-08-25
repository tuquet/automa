---
tags:
  - api/endpoint
  - api/Lint
path: "/api/v1/lint"
method: "POST"
---
# Validate and lint workflow AST graph

> [!info] 
> **Method**: `POST`
> **Path**: `/api/v1/lint`

Performs static analysis on workflow nodes, edge connections, parameter schemas, and detects structural defects.

## Request Body

- **Content-Type**: `application/json`
- **Schema**: [[LintRequest]]

## Responses

### 200
Lint diagnostic results

- **Content-Type**: `application/json`
- **Schema**: [[LintResponse]]

