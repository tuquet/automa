# Contributing to Tuquet Automa

First off, thank you for considering contributing to **Tuquet Automa**! It's contributors like you that make this open-source automation engine awesome.

This document provides guidelines and instructions for contributing to the repository.

---

## 🧭 System Architecture Overview

`tuquet-automa` is organized as a streamlined monorepo with two core applications:

1. **`apps/core` (Rust Core Backend Engine & Daemon)**:
   - High-performance Rust engine (Axum, Tokio, SQLite, CDP).
   - Manages local SQLite & Supabase Remote storage adapters.
   - Provides native OS execution outside the browser sandbox.
2. **`apps/webe` (Chrome Extension & Web Studio SPA)**:
   - **Vue 3 + Vue Flow Visual Canvas Studio**: Drag-and-drop workflow editor.
   - **Manifest V3 Chrome Extension**: Content scripts and background runner for DOM automation.

---

## 🛠️ Local Development Setup

### Prerequisites
- **Node.js**: `>= 18.0.0`
- **pnpm**: `>= 9.0.0`
- **Rust Toolchain**: `stable` (`cargo`, `rustc`)
- **Scoop** (Recommended for Windows tool management):
  ```powershell
  scoop install nodejs pnpm rustup
  ```

### 1. Clone & Install
```bash
# Clone repository
git clone https://github.com/tuquet/tuquet-automa.git
cd tuquet-automa

# Install all pnpm monorepo dependencies
pnpm install
```

### 2. Build All Workspace Packages
```bash
pnpm run build
```

### 3. Run Development Servers
```bash
# Launch full dev environment (Core Daemon + Web Studio)
pnpm run dev

# Or run Rust Core individually with hot-reload (cargo-watch)
pnpm run dev:core
```

---

## 📐 Git & Commit Conventions

We follow the **Conventional Commits** specification to ensure clear git history and automated release notes:

### Commit Format
```text
<type>(<scope>): <short description>
```

### Allowed Types
- **`feat`**: A new feature or capability.
- **`fix`**: A bug fix.
- **`docs`**: Documentation only changes.
- **`refactor`**: Code change that neither fixes a bug nor adds a feature.
- **`perf`**: A code change that improves performance.
- **`test`**: Adding missing tests or correcting existing tests.
- **`ci`**: Changes to CI/CD workflows (`.github/workflows/`).
- **`chore`**: Maintenance tasks, dependency updates.

### Examples
- `feat(core): add Supabase Remote storage adapter`
- `fix(webe): resolve DOM selector timeout in runner script`
- `docs: update CONTRIBUTING.md setup guide`

---

## 🧪 Code Quality & Testing Standards

Before submitting a Pull Request, please ensure all linter and format checks pass:

```bash
# Run Biome & ESLint checks
pnpm run lint

# Auto-fix linting formatting
pnpm run lint:fix

# Run Rust Core tests
pnpm run test:core
```

---

## 🚀 How to Submit a Pull Request (PR)

1. **Fork & Branch**: Create a feature branch off `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. **Commit Changes**: Make atomic commits following Conventional Commits format.
3. **Verify Locally**: Ensure `pnpm run lint` and `pnpm run build` succeed cleanly.
4. **Push & Open PR**: Push to your fork and open a PR targeting `main`.
5. **PR Review**: Maintainers will review your PR and provide constructive feedback!

---

Thank you for building the future of open-source automation with Tuquet! 🚀
