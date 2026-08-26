---
tags:
  - api/endpoint
  - api/Lint
path: "/api/v1/lint"
method: "POST"
---
# Validate and lint Automa assets (Workflows, Campaigns, Browsers, Packages)

> [!info] 
> **Method**: `POST`
> **Path**: `/api/v1/lint`

Performs static analysis on AST graph nodes, edge connections, parameter schemas, campaign schedules, and browser configs.

## Request Body

- **Content-Type**: `application/json`
- **Schema**: [[LintRequest]]

## Responses

### 200
Lint diagnostic results

- **Content-Type**: `application/json`
- **Schema**: [[LintResponse]]

