# Automated Deployment Guide for Automa Studio on Vercel (Pure Monorepo)

This document details the configuration and automated deployment pipeline for **Automa Visual Studio (`apps/webe/src/studio`)** to the Vercel Edge Network using **Pure Monorepo Native Git Integration**.

---

## 1. Deployment Architecture Overview

Automa Studio is a Single Page Application (SPA) built with Vue 3, Vite, Tailwind CSS, Pinia, and Vue Flow.

- **Static Build Output**: Located at `apps/webe/dist/studio/` (`index.html` and `assets/*`).
- **Internal Monorepo Dependencies**: 
  - `@automa/types` (`packages/types`)
  - `@automa/ui` (`packages/ui`)
- **Source Code Management**:
  - Monorepo repository: `tuquet/automa` (Houses all `apps/` and `packages/` directly without Git submodules).
- **Vercel Project**: `automa-studio` (Team: `tuquets-projects`)
- **Live URL**: `https://studio-lyart-one-86.vercel.app` (or `automa-studio.vercel.app`)

---

## 2. Configuration Files

### A. `vercel.json` (Monorepo Root)
Configures Vercel build command, output directory, and SPA routing rules:
- **Framework**: `vite`
- **Build Command**: `pnpm run vercel:build`
- **Output Directory**: `apps/webe/dist/studio`
- **Rewrites**: `/(.*) -> /index.html` (Ensures browser refresh and deep linking resolve cleanly without 404s).
- **Headers**: 1-year Cache-Control for `/assets/*` and enabled CORS `Access-Control-Allow-Origin: *`.

### B. `scripts/vercel-install.sh`
Automated install script executed by Vercel prior to build:
1. Prepares `pnpm` environment compatible with Node 24.x on Vercel infrastructure.
2. Installs all monorepo dependencies (`pnpm install --frozen-lockfile=false`).
3. Eliminates any need for git submodules or `GH_PAT` token downloads because all source files reside directly in the monorepo.

### C. `package.json` Deployment Scripts
- `"vercel:install"`: Executes `bash scripts/vercel-install.sh`.
- `"vercel:build"`: Executes `pnpm -F @automa/types build && pnpm -F @automa/ui build && turbo run build:studio`.
- `"vercel:ignore"`: Checks commit diff (`git diff --quiet HEAD^ HEAD apps/webe/ packages/ui/ packages/types/ scripts/vercel-install.sh vercel.json pnpm-workspace.yaml package.json`). Returns exit code `0` to cancel unnecessary builds when relevant files are untouched, conserving build minutes.
- `"deploy:studio"`: One-click manual CLI deploy (`pnpm run build:studio && vercel deploy apps/webe/dist/studio --prod`).

---

## 3. Vercel Dashboard Settings

The project is linked to `automa-studio` under the `tuquets-projects` team. To verify automated Git integration triggers on GitHub push:

1. **Access Project Settings on Vercel**:
   - URL: `https://vercel.com/tuquets-projects/automa-studio/settings`
2. **Environment Variables**:
   - No special environment variables are required for public builds.
3. **Build & Development Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `.` (Root)
   - **Build Command**: Enable Override $\rightarrow$ `pnpm run vercel:build`
   - **Output Directory**: Enable Override $\rightarrow$ `apps/webe/dist/studio`
   - **Install Command**: Enable Override $\rightarrow$ `bash scripts/vercel-install.sh`
   - **Node.js Version**: `24.x`
4. **Git $\rightarrow$ Ignored Build Step**:
   - Select **Custom**:
     ```bash
     git diff --quiet HEAD^ HEAD apps/webe packages/ui packages/types pnpm-workspace.yaml package.json
     ```

---

## 4. Daily Developer Workflow

### Scenario A: Automated Deployment via Git (Recommended)
1. Make changes to Studio source files under `apps/webe/`.
2. Commit & Push to the monorepo repository:
   ```bash
   git add apps/webe/
   git commit -m "feat(studio): update studio workflow editor"
   git push origin main
   ```
3. Vercel receives the webhook, checks the diff, runs `vercel-install.sh`, builds Studio, and deploys the latest version to Vercel Edge.

### Scenario B: One-Click Deploy from Local Workstation
When an immediate deployment is needed without awaiting Git webhooks:
```bash
pnpm run deploy:studio
```
This command builds the studio artifacts to `apps/webe/dist/studio` and deploys directly to Vercel production in ~10 seconds.
