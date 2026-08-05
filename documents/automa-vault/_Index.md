---
title: Automa Vault Specification
date: 2026-08-05
tags:
  - vault
  - spec
---

# 🗃️ Automa Vault Specification

Vault là thư mục trung tâm để quản lý mọi dữ liệu liên quan đến tự động hóa trong Automa Ecosystem.

## Các định dạng file

- `*.automa.json` / `*.workflow.json`: Workflow
- `*.fleets.json`: Cấu hình thực thi song song
- `*.profile.json`: Browser Profile (Proxy, UserAgent, Fingerprint)
- `variables.json` / `credentials.json` / `tables.json`: Dữ liệu dùng chung toàn cục (Globals)

> [!info] Chi tiết cấu trúc
> Bạn có thể xem tài liệu chi tiết tại [[Vault_Structure]].

## Cấu trúc đề xuất

```tree
my-vault/
  ├── workflows/
  ├── fleets/
  ├── profiles/
  ├── globals/
  └── .vscode/
      └── settings.json
```
