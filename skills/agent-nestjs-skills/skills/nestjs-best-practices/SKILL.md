---
name: nestjs-best-practices
description: Các thực hành tốt nhất và mẫu kiến trúc (architecture patterns) của NestJS để xây dựng ứng dụng production-ready. Kỹ năng này BẮT BUỘC dùng khi viết, đánh giá, hoặc tái cấu trúc (refactor) mã NestJS để đảm bảo tuân thủ đúng các pattern cho modules, dependency injection, security, và performance.
license: MIT
metadata:
  author: Kadajett
  version: "1.2.0"
---

# NestJS Best Practices

**BẮT BUỘC TUÂN THỦ** hướng dẫn toàn diện về các thực hành tốt nhất này dành cho ứng dụng NestJS. Nó bao gồm 40 quy tắc trải dài trên 10 danh mục, được ưu tiên theo mức độ tác động để hướng dẫn quá trình tái cấu trúc (refactoring) tự động và sinh mã (code generation).

## When to Apply

**BẮT BUỘC ÁP DỤNG** các nguyên tắc này khi:

- Viết các modules, controllers, hoặc services NestJS mới
- Triển khai xác thực (authentication) và phân quyền (authorization)
- Đánh giá mã nguồn (code review) về vấn đề kiến trúc và bảo mật
- Tái cấu trúc (refactor) mã nguồn NestJS hiện có
- Tối ưu hóa hiệu năng (performance) hoặc truy vấn cơ sở dữ liệu
- Xây dựng kiến trúc microservices

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Architecture | CRITICAL | `arch-` |
| 2 | Dependency Injection | CRITICAL | `di-` |
| 3 | Error Handling | HIGH | `error-` |
| 4 | Security | HIGH | `security-` |
| 5 | Performance | HIGH | `perf-` |
| 6 | Testing | MEDIUM-HIGH | `test-` |
| 7 | Database & ORM | MEDIUM-HIGH | `db-` |
| 8 | API Design | MEDIUM | `api-` |
| 9 | Microservices | MEDIUM | `micro-` |
| 10 | DevOps & Deployment | LOW-MEDIUM | `devops-` |

## Quick Reference

### 1. Architecture (CRITICAL)

- `arch-avoid-circular-deps` - **TUYỆT ĐỐI TRÁNH** phụ thuộc vòng (circular dependencies) giữa các module
- `arch-feature-modules` - **BẮT BUỘC TỔ CHỨC** theo tính năng (feature), không theo tầng kỹ thuật (technical layer)
- `arch-module-sharing` - **PHẢI DÙNG** xuất/nhập (exports/imports) module chuẩn, **TUYỆT ĐỐI TRÁNH** các providers bị lặp lại (duplicate)
- `arch-single-responsibility` - **PHẢI DÙNG** các dịch vụ tập trung (focused services) thay cho "god services" (dịch vụ làm mọi thứ)
- `arch-use-repository-pattern` - **BẮT BUỘC TRỪU TƯỢNG HÓA** logic cơ sở dữ liệu để dễ kiểm thử
- `arch-use-events` - **PHẢI DÙNG** kiến trúc hướng sự kiện (event-driven architecture) để giảm sự kết dính (decoupling)

### 2. Dependency Injection (CRITICAL)

- `di-avoid-service-locator` - **TUYỆT ĐỐI TRÁNH** sử dụng service locator anti-pattern
- `di-interface-segregation` - **BẮT BUỘC TRIỂN KHAI** Nguyên lý phân tách Interface (Interface Segregation Principle - ISP)
- `di-liskov-substitution` - **BẮT BUỘC TRIỂN KHAI** Nguyên lý thay thế Liskov (Liskov Substitution Principle - LSP)
- `di-prefer-constructor-injection` - **ƯU TIÊN DÙNG** tiêm qua constructor thay vì tiêm qua property (property injection)
- `di-scope-awareness` - **BẮT BUỘC HIỂU RÕ** các scopes: singleton/request/transient
- `di-use-interfaces-tokens` - **PHẢI DÙNG** các injection tokens cho interfaces

### 3. Error Handling (HIGH)

- `error-use-exception-filters` - **BẮT BUỘC TRIỂN KHAI** xử lý ngoại lệ tập trung (centralized exception handling)
- `error-throw-http-exceptions` - **PHẢI NÉM RA (THROW)** các NestJS HTTP exceptions
- `error-handle-async-errors` - **BẮT BUỘC XỬ LÝ** lỗi bất đồng bộ (async errors) một cách chuẩn xác

### 4. Security (HIGH)

- `security-auth-jwt` - **BẮT BUỘC TRIỂN KHAI** xác thực JWT (JWT authentication) bảo mật an toàn
- `security-validate-all-input` - **BẮT BUỘC KIỂM TRA TÍNH HỢP LỆ (VALIDATE)** bằng class-validator
- `security-use-guards` - **PHẢI DÙNG** các guards xác thực (authentication) và phân quyền (authorization)
- `security-sanitize-output` - **BẮT BUỘC NGĂN CHẶN** các cuộc tấn công XSS
- `security-rate-limiting` - **BẮT BUỘC TRIỂN KHAI** giới hạn tốc độ (rate limiting)

### 5. Performance (HIGH)

- `perf-async-hooks` - **PHẢI DÙNG** các async lifecycle hooks chuẩn
- `perf-use-caching` - **BẮT BUỘC TRIỂN KHAI** chiến lược bộ nhớ đệm (caching strategies)
- `perf-optimize-database` - **BẮT BUỘC TỐI ƯU HÓA** truy vấn cơ sở dữ liệu
- `perf-lazy-loading` - **PHẢI TẢI LƯỜI (LAZY LOAD)** các module để khởi động nhanh hơn

### 6. Testing (MEDIUM-HIGH)

- `test-use-testing-module` - **PHẢI DÙNG** các tiện ích kiểm thử (testing utilities) của NestJS
- `test-e2e-supertest` - **BẮT BUỘC TRIỂN KHAI** kiểm thử E2E bằng Supertest
- `test-mock-external-services` - **PHẢI GIẢ LẬP (MOCK)** các phụ thuộc bên ngoài (external dependencies)

### 7. Database & ORM (MEDIUM-HIGH)

- `db-use-transactions` - **BẮT BUỘC TRIỂN KHAI** quản lý giao dịch (transaction management)
- `db-avoid-n-plus-one` - **TUYỆT ĐỐI TRÁNH** các vấn đề truy vấn N+1
- `db-use-migrations` - **PHẢI DÙNG** migrations cho các thay đổi schema

### 8. API Design (MEDIUM)

- `api-use-dto-serialization` - **PHẢI DÙNG** quá trình tuần tự hóa DTO (DTO serialization) và tuần tự hóa response
- `api-use-interceptors` - **BẮT BUỘC TRIỂN KHAI** cross-cutting concerns với interceptors
- `api-versioning` - **BẮT BUỘC TRIỂN KHAI** chiến lược phân phiên bản API (API versioning strategies)
- `api-use-pipes` - **PHẢI DÙNG** các pipes để chuyển đổi dữ liệu đầu vào (input transformation)

### 9. Microservices (MEDIUM)

- `micro-use-patterns` - **BẮT BUỘC TRIỂN KHAI** các mô hình tin nhắn và sự kiện (message and event patterns)
- `micro-use-health-checks` - **BẮT BUỘC TRIỂN KHAI** health checks (kiểm tra trạng thái) cho việc điều phối (orchestration)
- `micro-use-queues` - **PHẢI DÙNG** hàng đợi (queues) cho xử lý công việc ngầm (background job processing)

### 10. DevOps & Deployment (LOW-MEDIUM)

- `devops-use-config-module` - **PHẢI DÙNG** cấu hình môi trường
- `devops-use-logging` - **BẮT BUỘC TRIỂN KHAI** hệ thống log có cấu trúc (structured logging)
- `devops-graceful-shutdown` - **BẮT BUỘC ĐẢM BẢO** triển khai không gián đoạn (zero-downtime deployments)

## How to Use

**BẮT BUỘC ĐỌC** các tệp quy tắc (rule files) riêng biệt để xem giải thích chi tiết và các ví dụ mã:

```
rules/arch-avoid-circular-deps.md
rules/security-validate-all-input.md
rules/_sections.md
```

Mỗi tệp quy tắc chứa:
- Giải thích ngắn gọn lý do tại sao quy tắc này lại quan trọng
- Ví dụ về mã nguồn sai kém cùng với lời giải thích
- Ví dụ về mã nguồn đúng chuẩn cùng với lời giải thích
- Ngữ cảnh bổ sung và tài liệu tham khảo

## Full Compiled Document

**BẮT BUỘC THAM KHẢO** hướng dẫn hoàn chỉnh với toàn bộ quy tắc được mở rộng trong một tài liệu duy nhất:
[AGENTS.md in the repository](https://github.com/Kadajett/agent-nestjs-skills/blob/main/AGENTS.md).
