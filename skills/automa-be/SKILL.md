---
name: automa-be-api
description: API specification and contract detailing the Supabase endpoints and database schema exposed by automa-be for the Automa Extension.
---

# Automa Backend API Specification

This skill documents the API contract and endpoints exposed by `automa-be` (Supabase backend) for consumption by the Automa Chrome Extension (`automa` project). Use this reference when building MCP servers or analyzing the communication layer between the extension and backend.

## 1. Deno Edge Functions (HTTP Endpoints)

Supabase Edge Functions are hosted under `/functions/v1/`.

### 1.1 `GET /functions/v1/get-workflow`
Exposes the data structure of a single active workflow.
- **Method:** `GET` (CORS preflight supported via `OPTIONS`)
- **Query Parameters:**
  - `id` (string, required): The UUID or string ID of the workflow.
- **Authorization:** Optionally forwards the client `Authorization` header to create the client-scoped Supabase connection.
- **Response:**
  - `200 OK`: Returns the JSON representation of the workflow (from the `data` column) directly.
  - `400 Bad Request`: Parameter `id` is missing.
  - `404 Not Found`: Workflow is missing or marked as `is_deleted = true`.
  - `505 Server Error`: DB query failed.

### 1.2 `GET /functions/v1/download-extension`
Serves the latest packaged version of the Chrome Extension.
- **Method:** `GET` (CORS preflight supported via `OPTIONS`)
- **Action:** Fetches the list of files in the `release` storage bucket, filters by `.zip`, sorts by creation time descending, and redirects (`302 Found`) the user to the public download URL of the newest zip file.
- **Local Proxy Note:** Replaces `kong:8000` with `127.0.0.1:54321` when running locally to avoid internal Docker network resolution issues.

---

## 2. Database Tables (PostgREST API)

The extension synchronizes local IndexedDB data with Supabase Cloud using direct PostgREST table operations (exposed by `@supabase/supabase-js`).

### 2.1 Synchronization Common Structure
Every syncable table shares the following common columns to handle soft-deletion and synchronization conflict resolution (Last-Write-Wins):
- `is_deleted` (boolean, default `false`): Mark `true` to flag deletion (no hard-deletes on cloud).
- `client_updated_at` (timestamptz): The timestamp when the record was modified by the client.
- `updated_at` (timestamptz): The database-generated modification timestamp (used for delta filtering).

### 2.2 Table Definitions

| Table Name | Keys | Sync Operations | Schema Details |
|---|---|---|---|
| **`workflows`** | `id` (text/PK) | `select` (delta), `upsert`, `update` (delete) | `data` (jsonb - workflow drawflow, trigger, and settings payload) |
| **`folders`** | `id` (text/PK) | `select` (delta), `upsert`, `update` (delete) | `name` (text) |
| **`packages`** | `id` (text/PK) | `select` (delta), `upsert`, `update` (delete) | `data` (jsonb - package drawflow and blocks metadata), `is_shared` (boolean) |
| **`variables`** | `name` (text/PK) | `select` (delta), `upsert`, `update` (delete) | `value` (text - JSON string or raw string values) |
| **`credentials`** | `id` (text/PK) | `select` (delta), `upsert`, `update` (delete) | `name` (text), `value` (text - **CRITICAL:** Encrypted on client side before sync using extension passphrase) |
| **`tables`** | `id` (text/PK) | `select` (delta), `upsert`, `update` (delete) | `name` (text), `columns` (jsonb - table column metadata) |
| **`table_rows`** | `id` (text/PK) | `select` (delta), `upsert`, `update` (delete) | `table_id` (text/FK), `data` (jsonb - row items and index references) |

---

## 3. Storage Buckets

### 3.1 `release` (Public Bucket)
- **Purpose:** Stores the compiled `.zip` releases of the Chrome Extension (e.g. `automa-chrome-v1.32.5.zip`).
- **Permissions:** Read-only publicly, read/write via service role key for automated build and release scripts.

---

## 4. Realtime Subscription (WebSockets)

The Automa Extension subscribes to real-time broadcasts via Supabase WebSockets to keep local browser state in sync instantly across tabs:
- **Subscription Channel:** `public:<table_name>`
- **Monitored Tables:** `workflows`, `folders`, `packages`, `variables`, `credentials`, `tables`, `table_rows`.
- **Event Handler:** When a remote broadcast is received, the background sync engine merges it into IndexedDB and commits changes to Pinia stores.
