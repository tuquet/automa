---
name: automa-be-release
description: Deploy and release protocols for the Automa Backend (Supabase Local & Cloud).
---

# Automa Backend Release & Deploy Protocol

This protocol guides the deployment and release process for the Automa Backend (`automa-be` Supabase project), covering both Local and Cloud environments.

## 1. Local Database Development & Seeding

For local testing and verification:
1. **Start Supabase Local:**
   ```bash
   supabase start
   ```
2. **Reset & Seed Local Database:**
   This command resets the local database and runs the seeding scripts (inserting workflows, packages, variables, etc. from files):
   ```bash
   npm run db:reset
   ```
3. **Verify Schemas (Linting):**
   Always run the linter to verify that seeded workflows and packages comply with the strict Automa schemas:
   ```bash
   npm run lint
   ```

---

## 2. Deploying to Supabase Cloud (Production)

> [!IMPORTANT]
> **Production Safety Rule (AGENTS.md):** 
> - **NEVER** deploy, push, or seed data to Production environments (e.g., Supabase Cloud, live servers) unless the user explicitly requests it in this turn.
> - Always ask for permission and wait for explicit confirmation from the user before executing any commands that modify production state.

To deploy backend changes to the production Supabase cloud:

1. **Link to the Production Project:**
   Before pushing, link the local CLI to the remote project. Ask the user for the Project Reference ID if not already linked:
   ```bash
   supabase link --project-ref <PROJECT_REF>
   ```

2. **Database Push & Functions Deploy:**
   - **Standard Deploy (Non-destructive):**
     Push migrations and deploy edge functions:
     ```bash
     supabase db push
     supabase functions deploy
     ```
   - **Hard Reset Deploy (Destructive):**
     *Warning: This clears all data in the production database.*
     If there are major breaking schema modifications and the user requests a clean reset:
     ```bash
     supabase db reset --linked --yes
     supabase functions deploy
     ```
     *Note: If seed.sql fails on remote reset due to auth/sequences permissions, temporarily clean the inserts to schema `supabase_functions` and `auth` in `supabase/seed.sql` before running.*
