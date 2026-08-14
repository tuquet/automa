---
title: Automa Core & Vault
date: 2026-08-05
tags:
  - vault
  - core
  - spec
---

# 🗃️ Automa Core & Vault Specification

Tài liệu này bao gồm các đặc tả lõi của hệ thống (Core Strategy, Agent QA) và thư mục Vault trung tâm để quản lý mọi dữ liệu liên quan đến tự động hóa trong Automa Ecosystem.

## 🧠 Core Strategy & QA
- [[product_strategy|Product Strategy]]
- [[QA_Agent_Interrogation|Agent Interrogation Q&A]]

## 🗃️ Vault Specification

Vault là thư mục trung tâm để quản lý mọi dữ liệu liên quan đến tự động hóa trong Automa Ecosystem.

## Các định dạng file

- `*.automa.json` / `*.workflow.json`: Workflow
- `*.Campaigns.json`: Cấu hình thực thi song song
- `*.profile.json`: Browser Profile (Proxy, UserAgent, Fingerprint)
- `variables.json` / `credentials.json` / `tables.json`: Dữ liệu dùng chung toàn cục (Globals)

> [!info] Chi tiết cấu trúc
> Bạn có thể xem tài liệu chi tiết tại [[Vault_Structure]].

## Cấu trúc đề xuất

```tree
my-vault/
  ├── workflows/
  ├── Campaigns/
  ├── profiles/
  ├── globals/
  └── .vscode/
      └── settings.json
```
