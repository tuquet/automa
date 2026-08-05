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

- `*.automa.json`: Workflow
- `*.fleets.json`: Cấu hình thực thi song song
- `*.profile.json`: Browser Profile (Proxy, UserAgent, Fingerprint)

## Cấu trúc đề xuất

```
my-vault/
  ├── workflows/
  ├── fleets/
  ├── profiles/
  └── .vscode/
      └── settings.json
```
