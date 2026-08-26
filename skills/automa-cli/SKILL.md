---
name: automa-cli
description: CLI execution protocols, Thin Client architecture, and headless command dispatching for Automa CLI. Activate when working on terminal commands, CLI batch execution, or headless CI/CD workflow triggers.
---

# Automa CLI (`automa-cli`)

CLI execution protocol and command dispatching guide.

---

## 1. 🎯 Scope & Thin Client Invariant

The Automa CLI operates as a **Thin Client** communicating with the local Automa Core Rust Daemon (`http://127.0.0.1:8765`).

- **Zero Heavy Computation**: The CLI NEVER spawns raw browser instances directly using `child_process`.
- **API-Driven**: All commands (`automa run`, `automa lint`, `automa browsers`) submit jobs or query state via Daemon REST APIs and stream real-time logs via SSE (`/api/events`).

---

## 2. 🛡️ CLI Commands Reference

- `automa run <workflow-path> [--browser <id>] [--keep-open]`: Submits workflow execution job to daemon.
- `automa lint <workflow-path>`: Runs AST validation against daemon `/api/lint` endpoint.
- `automa browsers list`: Queries registered virtual browser profiles.
- `automa serve`: Starts local background Rust daemon if not already running.
