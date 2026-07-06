---
name: test-cases
description: Phân tích yêu cầu để tạo test case chuẩn, giúp Agent tự sinh test case từ mô tả nghiệp vụ. Trigger: test case, viết test case, tạo test case, test plan, phân tích yêu cầu.
crossSkills: [automa]
---

# Test Cases — Từ yêu cầu đến Test Case

> **tl;dr** — Mỗi yêu cầu → ít nhất 3 test case (happy path + error path + edge case). Frontmatter YAML có `id`, `module`, `priority`. Bảng bước thực hiện: hành động cụ thể, kết quả quantifiable. Đặt tên `TC-XXX-description.md`. Folder có `index.md`. Sau đó convert sang workflow Automa: mỗi bước test = 1+ block, pre-condition → trigger params, expected → conditions, report → webhook.

Khi được đưa một yêu cầu nghiệp vụ (user story, mô tả tính năng, ticket...), phải tuân thủ quy trình sau để tạo bộ test case.

## 1. Phân tích yêu cầu → Danh sách scenario

Với mỗi yêu cầu, luôn tạo **tối thiểu 3** loại test case:

| Loại | Mô tả | Bắt buộc |
|------|-------|----------|
| **Happy path** | Luồng chính, input hợp lệ, kết quả thành công | Luôn có |
| **Error path** | Input sai, hệ thống từ chối, message lỗi | Luôn có |
| **Edge case** | Boundary, input rỗng, input cực lớn, trạng thái bất thường | Có nếu áp dụng được |

**Ví dụ phân tích từ yêu cầu "Chức năng đăng nhập":**
- Happy: nhập đúng email/pass → vào dashboard
- Error: nhập sai pass → báo lỗi, không redirect
- Edge: để trống field, nhập toàn khoảng trắng, SQL injection, XSS

## 2. Tổ chức thư mục theo module

```
/test-cases
  /<module>
    /<feature>
      TC-001-<mô-tả-ngắn>.md
      TC-002-<mô-tả-ngắn>.md
      index.md
```

Mỗi folder feature có `index.md` liệt kê tất cả test case trong đó. File index giúp Agent hiểu cấu trúc bộ test khi bạn chỉ đưa 1 file.

## 3. Format file Test Case

### Frontmatter YAML (bắt buộc, giữa 2 dấu `---`)

```yaml
---
id: TC-001
module: auth/login
type: functional          # functional | integration | e2e | performance
priority: critical        # critical | high | medium | low
referer: <link Jira/Spec>
---
```

**Quy tắc gán priority:**

| Priority | Khi nào dùng |
|----------|-------------|
| `critical` | Happy path, chặn user nếu fail |
| `high` | Error path quan trọng, validate input |
| `medium` | Edge case ít gặp |
| `low` | UI/cosmetic, nice-to-have |

### Body (bắt buộc theo thứ tự)

| Section | Cách viết |
|---------|-----------|
| `# TC-XXX: <Tiêu đề>` | Tóm tắt mục đích trong 1 câu |
| `## Mục tiêu` | 1-2 câu: luồng cần kiểm tra, tại sao quan trọng |
| `## Tiền điều kiện` | Data cần có, account, môi trường, trạng thái hệ thống |
| `## Các bước thực hiện` | Bảng 3 cột: **Bước, Hành động, Kết quả mong đợi**. Mỗi bước 1 dòng, hành động cụ thể, kết quả quantifiable |
| `## Ghi chú` | SLA, edge case liên quan, link, giả định |

### Nguyên tắc viết bảng bước thực hiện

- **Table, không bullet list** — Agent đọc bảng chính xác hơn
- **Hành động cụ thể**: "Nhập email `user@example.com`" thay vì "Nhập email hợp lệ"
- **Kết quả quantifiable**: "URL chuyển thành `/dashboard`" thay vì "Chuyển hướng"
- **Mỗi bước 1 hành động**: Không gộp 2 action vào 1 dòng

## 4. Đặt tên file

```
TC-<XXX>-<mô-tả-ngắn>.md
```

- `XXX`: số thứ tự 3 chữ số (001, 002...)
- `mô-tả-ngắn`: kebab-case, không dấu, tối đa 5 từ
- Đúng: `TC-001-login-success.md`, `TC-002-login-wrong-password.md`
- Sai: `Test_case_1.md`, `TC001.md`, `Đăng nhập thành công.md`

## 5. Common Mistakes / Anti-patterns

| Sai | Tại sao sai | Đúng |
|-----|-------------|------|
| Chỉ tạo 1 happy path test case | Bỏ sót lỗi và edge case | Luôn 3 loại: happy + error + edge |
| Bảng dùng bullet list | Agent khó parse hơn table | Dùng table 3 cột: Bước, Hành động, Kết quả |
| Hành động chung chung: "Nhập email" | Không biết input cụ thể | "Nhập email `test@example.com`" |
| Kết quả mơ hồ: "Hiển thị đúng" | Không quantifiable | "Hiển thị message 'Đăng nhập thành công' màu xanh" |
| Pre-condition thiếu data cụ thể | Không reproducibility | "Account: user@example.com / Pass1234 đã tồn tại" |
| Thiếu frontmatter YAML | Agent không lọc được theo priority | Luôn có `id`, `module`, `type`, `priority`, `referer` |
| Thiếu index.md trong folder | Agent không biết có bao nhiêu test case | Mỗi folder feature có `index.md` liệt kê link |
| File đặt tên tiếng Việt có dấu | Cross-platform issue | Dùng kebab-case: `tc-001-login-success.md` |

## 6. Chuyển Test Case thành Automa Workflow

Sau khi tạo test case, có thể chuyển trực tiếp thành workflow Automa để tự động hóa kiểm thử. Nguyên tắc: **mỗi bước trong test case = 1+ block Automa**.

### Mapping: Hành động → Block

| Hành động trong Test Case | Block Automa | Ví dụ `data` |
|---|---|---|
| Nhập text vào ô input | `forms` | `{ "selector":"#email", "value":"{{$params.email}}" }` |
| Nhập password | `forms` | `{ "selector":"#password", "value":"{{$params.password}}" }` |
| Click button / link | `event-click` | `{ "selector":"button[type='submit']", "waitForSelector":true }` |
| Kiểm tra URL thay đổi | `conditions` | `{ "variable":"$tabUrl", "comparison":"contains", "value":"dashboard" }` |
| Kiểm tra text xuất hiện | `get-text` + `conditions` | Lấy text → conditions so sánh với expected |
| Kiểm tra element tồn tại | `element-exists` | `{ "selector":".error-msg", "timeout":5000 }` |
| Kiểm tra element KHÔNG tồn tại | `element-exists` → output-2 | Nối output-2 vào nhánh success |
| Chờ API response | `wait-connections` | `{ "timeout":10000, "idleTime":2000 }` |
| Đo thời gian < N giây | `javascript-code` | `Date.now()` trước/sau, so sánh |
| Mở trang | `new-tab` | `{ "url":"{{$params.url}}", "waitTabLoaded":true }` |

### Mapping: Cấu trúc Test Case → Cấu trúc Workflow

| Test Case | → | Workflow Automa |
|-----------|-----|-----------------|
| `## Tiền điều kiện` | → | `trigger.parameters` (account, URL, data test) |
| `## Các bước thực hiện` | → | Chuỗi blocks: forms → event-click → wait → conditions |
| `Kết quả mong đợi` ở mỗi bước | → | `conditions` check hoặc `get-text` + verify |
| Nhiều test case cùng module | → | 1 workflow gọi `execute-workflow` cho từng TC |

### Pattern workflow cho 1 Test Case

```text
trigger(params) → new-tab → [steps: forms → event-click → wait]
    → conditions(verify) → webhook(pass log)
    └── output-2: webhook(fail log) → notification
```

**Quy tắc:**
- Kết quả mỗi test step: pass → next step, fail → ghi log lỗi + skip các step sau
- Kết quả cuối cùng gửi về server qua `webhook`: `{ "testCase":"TC-001", "status":"pass", "steps":[{...}] }`
- Biến test data luôn khai báo trong `trigger.parameters` — không hardcode
- Selector trong block phải inspect DOM thực tế, ưu tiên XPath. **Xem skill `automa`** để biết chi tiết.

## 7. Cross-Skill Golden Example

Dưới đây là flow hoàn chỉnh từ yêu cầu → test case → workflow Automa:

### Input: Yêu cầu "Chức năng đăng nhập"
> Người dùng có thể đăng nhập bằng email và password. Hệ thống kiểm tra thông tin, nếu đúng redirect về dashboard, nếu sai hiển thị message lỗi.

### Output 1: Phân tích → 3 test case

| TC | Loại | Mô tả |
|----|------|-------|
| TC-001 | Happy path | Nhập đúng email/pass → vào dashboard |
| TC-002 | Error path | Nhập sai pass → message lỗi |
| TC-003 | Edge case | Để trống field → validation |

### Output 2: TC-001 file test case

File: `/test-cases/auth/login/TC-001-login-success.md`
```yaml
---
id: TC-001
module: auth/login
type: functional
priority: critical
referer: https://jira.example.com/LOGIN-101
---
# TC-001: Đăng nhập thành công

## Mục tiêu
Kiểm tra người dùng đăng nhập đúng email/password, redirect về dashboard.

## Tiền điều kiện
- Account: admin@test.com / Pass1234 đã tồn tại
- Trang login https://example.com/login đã load

## Các bước thực hiện

| Bước | Hành động | Kết quả mong đợi |
|:---|:---|:---|
| 1 | Nhập email `admin@test.com` | Ô hiển thị đúng giá trị |
| 2 | Nhập password `Pass1234` | Hiển thị ký tự ẩn |
| 3 | Click nút "Đăng nhập" | Chuyển hướng tới `/dashboard` |
| 4 | Kiểm tra URL | URL chứa `dashboard` |

```

### Output 3: Convert → Workflow Automa JSON (tối giản)

```
trigger(params: url, email, password, logUrl)
  → new-tab(wait) → forms(#email) → forms(#password)
  → event-click(button[type=submit]) → wait-connections(10s)
  → conditions($tabUrl contains "dashboard")
    → webhook({testCase:"TC-001", status:"pass"})
    → webhook({testCase:"TC-001", status:"fail"})
```

Xem full JSON pattern tại skill `automa` → `qa_knowledge.md` → "Pattern test automation".

## 8. Demo tham khảo

Xem bộ test case mẫu cho module Auth Login tại [examples/auth/login/](./examples/auth/login/).

## Quick Reference

| Rule | Ghi nhớ |
|------|---------|
| 3 loại | Happy + Error + Edge — luôn có ít nhất 2 loại đầu |
| Frontmatter | `id`, `module`, `type`, `priority`, `referer` — không thiếu field |
| Table | 3 cột: Bước, Hành động, Kết quả — không bullet list |
| Đặt tên | `TC-XXX-description.md` — kebab-case |
| index.md | Mỗi folder feature phải có |
| Convert | Bước TC → block Automa, pre-condition → trigger params, expected → conditions |
| Report | Webhook POST kết quả pass/fail về server |