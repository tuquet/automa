---
name: automa-vault
description: Hướng dẫn cấu trúc thư mục và file cấu hình mẫu cho tính năng Fleets trong automa-vault.
---

# Automa Vault Fleets Convention

Khi làm việc với tính năng Fleets trong dự án `automa-vault`, luôn tuân thủ các quy tắc cấu trúc sau:

## 1. Cấu trúc thư mục
Tất cả các tệp liên quan đến cấu hình của fleets phải được đặt trong thư mục `fleets/` nằm bên trong từng project cụ thể.
Ví dụ: `automa-vault/{project}/fleets/`

## 2. File mẫu (demo.fleets.json)
Mỗi dự án cần đi kèm một file mẫu `demo.fleets.json` để minh họa cấu trúc của một fleet. 

**Nội dung mẫu của `demo.fleets.json`:**
```json
{
  "name": "Demo Fleet",
  "version": "1.0.0",
  "description": "Cấu trúc mẫu cho một Automa Fleet",
  "workflows": [
    {
      "id": "wf-1",
      "name": "Sample Workflow"
    }
  ]
}
```
