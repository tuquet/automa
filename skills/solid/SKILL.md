---
name: solid
description: Use this skill when writing code, implementing features, refactoring, planning architecture, designing systems, reviewing code, or debugging. This skill transforms junior-level code into senior-engineer quality software through SOLID principles, TDD, clean code practices, and professional software design.
---

# Kỹ năng SOLID: Kỹ thuật phần mềm chuyên nghiệp

BẮT BUỘC HÀNH ĐỘNG như một Kỹ sư phần mềm cấp cao. BẮT BUỘC THỂ HIỆN sự khéo léo và chuyên nghiệp trong từng dòng code được viết ra, từng quyết định thiết kế được đưa ra, và từng đợt tái cấu trúc (refactoring) được thực hiện.

## Thời điểm áp dụng kỹ năng này

**LUÔN LUÔN ÁP DỤNG kỹ năng này khi:**
- Viết BẤT KỲ đoạn code nào (features, fixes, utilities)
- Tái cấu trúc code hiện có
- Lập kế hoạch hoặc thiết kế kiến trúc
- Đánh giá chất lượng code
- Gỡ lỗi (Debugging)
- Tạo tests
- Đưa ra quyết định thiết kế

## Triết lý cốt lõi

> "Code là để tạo ra sản phẩm cho người dùng và khách hàng. Đoạn code dễ kiểm thử, linh hoạt và dễ bảo trì, phục vụ tốt cho nhu cầu của người dùng là TỐT bởi vì nó có thể được bảo trì một cách hiệu quả về mặt chi phí bởi các lập trình viên."

BẮT BUỘC CHO PHÉP các lập trình viên **khám phá, hiểu, thêm mới, thay đổi, gỡ bỏ, kiểm thử, gỡ lỗi, triển khai**, và **giám sát** các tính năng một cách hiệu quả.

## Quy trình Bắt buộc (Non-Negotiable)

### 1. LUÔN LUÔN Bắt đầu với Tests (TDD)

**BẮT BUỘC TUÂN THEO quy trình Red-Green-Refactor:**

```
1. RED    - Write a failing test that describes the behavior
2. GREEN  - Write the SIMPLEST code to make it pass
3. REFACTOR - Clean up, remove duplication (Rule of Three)
```

**BẮT BUỘC TUÂN THỦ Ba Định luật của TDD:**
1. TUYỆT ĐỐI KHÔNG viết production code trừ khi nó làm cho một bài kiểm tra đang lỗi (failing test) vượt qua được.
2. TUYỆT ĐỐI KHÔNG viết test code nhiều hơn mức đủ để test đó bị lỗi.
3. TUYỆT ĐỐI KHÔNG viết production code nhiều hơn mức đủ để bài test đó pass.

**PHẢI THỰC HIỆN thiết kế trong quá trình REFACTORING, tuyệt đối không làm trong lúc code logic.**

BẮT BUỘC THAM KHẢO: [references/tdd.md](references/tdd.md)

### 2. Áp dụng nghiêm ngặt các nguyên tắc SOLID

BẮT BUỘC HỎI những câu sau cho mỗi lớp (class), mỗi module, mỗi hàm:

| Nguyên tắc | Câu hỏi cần đặt ra |
|-----------|-----------------|
| **S**RP - Single Responsibility | "Cái này có DUY NHẤT MỘT lý do để thay đổi không?" |
| **O**CP - Open/Closed | "Tôi có thể mở rộng nó mà không cần sửa đổi nó không?" |
| **L**SP - Liskov Substitution | "Các kiểu con (subtypes) có thể thay thế các kiểu cơ sở (base types) một cách an toàn không?" |
| **I**SP - Interface Segregation | "Có phải các clients đang bị ép phụ thuộc vào các methods mà chúng không dùng đến không?" |
| **D**IP - Dependency Inversion | "Các modules cấp cao có phụ thuộc vào abstractions không?" |

BẮT BUỘC THAM KHẢO: [references/solid-principles.md](references/solid-principles.md)

### 3. Viết Clean Code rõ ràng cho con người đọc

**BẮT BUỘC TUÂN THEO Thứ tự Ưu tiên khi Đặt tên:**
1. **Tính nhất quán** - Cùng một khái niệm = cùng một tên ở mọi nơi
2. **Tính dễ hiểu** - Dùng ngôn ngữ miền (domain language), tuyệt đối không dùng thuật ngữ chuyên môn gây khó hiểu
3. **Tính cụ thể** - Chính xác, không mơ hồ (tránh `data`, `info`, `manager`)
4. **Tính ngắn gọn** - Ngắn gọn nhưng tuyệt đối không khó hiểu
5. **Tính dễ tìm kiếm** - Các tên độc nhất, dễ tìm bằng grep

**BẮT BUỘC TUÂN THỦ Cấu trúc:**
- BẮT BUỘC SỬ DỤNG một mức độ thụt lề (indentation) cho mỗi method
- TUYỆT ĐỐI TRÁNH từ khóa `else` khi có thể (áp dụng early returns)
- BẮT BUỘC SỬ DỤNG `Object.hasOwn(...)` (hoặc `Object.prototype.hasOwnProperty.call(...)`) khi xác thực các chuỗi không đáng tin cậy đối với object/map. TUYỆT ĐỐI KHÔNG DÙNG toán tử `in`, vì nó sẽ khớp cả các keys trong prototype
- **LUÔN LUÔN bọc các kiểu nguyên thủy (primitives) trong các domain objects** - IDs, emails, số tiền, v.v.
- BẮT BUỘC SỬ DỤNG First-class collections (bọc mảng trong các lớp class)
- BẮT BUỘC SỬ DỤNG một dấu chấm trên mỗi dòng (Luật Demeter)
- BẮT BUỘC GIỮ các entities nhỏ gọn (< 50 dòng cho các lớp class, < 10 dòng cho các methods)
- TUYỆT ĐỐI KHÔNG CHO PHÉP vượt quá hai biến instance trên mỗi lớp class

**BẮT BUỘC SỬ DỤNG Value Objects cho:**
```typescript
// ALWAYS create value objects for:
class UserId { constructor(private readonly value: string) {} }
class Email { constructor(private readonly value: string) { /* validate */ } }
class Money { constructor(private readonly amount: number, private readonly currency: string) {} }
class OrderId { constructor(private readonly value: string) {} }

// NEVER use raw primitives for domain concepts:
// BAD: function createOrder(userId: string, email: string)
// GOOD: function createOrder(userId: UserId, email: Email)
```

BẮT BUỘC THAM KHẢO: [references/clean-code.md](references/clean-code.md)

### 4. Thiết kế đi kèm với Trách nhiệm

**BẮT BUỘC PHẢI HỎI cho mọi class:**
1. "Đây là pattern gì?" (Entity, Service, Repository, Factory, v.v.)
2. "Nó có đang ôm đồm quá nhiều việc không?" (Kiểm tra Object calisthenics)

**Các khuôn mẫu Đối tượng (Object Stereotypes):**
- **Information Holder** - Lưu giữ dữ liệu, hành vi tối giản
- **Structurer** - Quản lý mối quan hệ giữa các objects
- **Service Provider** - Thực hiện công việc, các thao tác phi trạng thái (stateless)
- **Coordinator** - Điều phối đa dịch vụ (services)
- **Controller** - Đưa ra các quyết định, ủy quyền công việc
- **Interfacer** - Biến đổi dữ liệu giữa các hệ thống

BẮT BUỘC THAM KHẢO: [references/object-design.md](references/object-design.md)

### 5. Quản lý Độ phức tạp một cách triệt để

**Độ phức tạp cốt lõi (Essential complexity)** = vốn có trong domain của bài toán
**Độ phức tạp ngẫu nhiên (Accidental complexity)** = do các giải pháp của chúng ta sinh ra

**PHÁT HIỆN độ phức tạp thông qua:**
- Sự khuếch đại thay đổi (một thay đổi nhỏ = sửa rất nhiều file)
- Tải trọng nhận thức (khó để hiểu)
- Những điều chưa biết vô hình (hành vi gây bất ngờ)

**CHỐNG LẠI độ phức tạp bằng:**
- YAGNI - TUYỆT ĐỐI KHÔNG xây dựng những gì bạn chưa cần NGAY BÂY GIỜ
- KISS - BẮT BUỘC SỬ DỤNG giải pháp đơn giản nhất có thể chạy được
- DRY - BẮT BUỘC CHỈ THỰC HIỆN sau Quy tắc số Ba (Rule of Three) (đợi đến khi có 3 sự trùng lặp)

BẮT BUỘC THAM KHẢO: [references/complexity.md](references/complexity.md)

### 6. Kiến trúc hướng đến Sự thay đổi

**Cắt dọc (Vertical Slicing):**
- BẮT BUỘC XÂY DỰNG các tính năng theo các lát cắt end-to-end
- BẮT BUỘC GIỮ cho mỗi tính năng độc lập, tự chứa (self-contained)

**Tách rời ngang (Horizontal Decoupling):**
- NGĂN CHẶN việc các tầng (layers) biết về cấu trúc bên trong của nhau
- BẮT BUỘC HƯỚNG các dependencies vào bên trong (hướng tới domain)

**Quy tắc Phụ thuộc (The Dependency Rule):**
- BẮT BUỘC HƯỚNG các dependencies của source code về phía các high-level policies
- BẮT BUỘC ĐẢM BẢO infrastructure phụ thuộc vào domain, TUYỆT ĐỐI KHÔNG làm ngược lại

BẮT BUỘC THAM KHẢO: [references/architecture.md](references/architecture.md)

## Bốn Yếu tố của Thiết kế Đơn giản (XP)

BẮT BUỘC THỎA MÃN theo thứ tự ưu tiên:
1. **Pass toàn bộ bài test** - Bắt buộc phải hoạt động chính xác
2. **Thể hiện được ý định** - Dễ đọc, bộc lộ rõ mục đích
3. **Không trùng lặp** - DRY (nhưng phải tuân theo Rule of Three)
4. **Tối giản** - Ít số lượng class, method nhất có thể

## Phát hiện Code Smell (Mùi code)

**BẮT BUỘC DỪNG LẠI và REFACTOR khi bạn thấy:**

| Smell (Mùi) | Giải pháp |
|-------|----------|
| Long Method | Extract methods, compose method pattern |
| Large Class | Extract class, single responsibility |
| Long Parameter List | Introduce parameter object |
| Divergent Change | Split into focused classes |
| Shotgun Surgery | Move related code together |
| Feature Envy | Move method to the envied class |
| Data Clumps | Extract class for grouped data |
| Primitive Obsession | Wrap in value objects |
| Switch Statements | Replace with polymorphism |
| Parallel Inheritance | Merge hierarchies |
| Speculative Generality | YAGNI - remove unused abstractions |

BẮT BUỘC THAM KHẢO: [references/code-smells.md](references/code-smells.md)

## Nhận thức về Design Patterns

**Nhóm Khởi tạo (Creational):** Singleton, Factory, Builder, Prototype
**Nhóm Cấu trúc (Structural):** Adapter, Bridge, Decorator, Composite, Proxy
**Nhóm Hành vi (Behavioral):** Strategy, Observer, Template Method, Command

**CẢNH BÁO:** TUYỆT ĐỐI KHÔNG ép buộc sử dụng patterns. BẮT BUỘC ĐỂ chúng tự xuất hiện tự nhiên từ quá trình refactoring.

BẮT BUỘC THAM KHẢO: [references/design-patterns.md](references/design-patterns.md)

## Chiến lược Kiểm thử (Testing Strategy)

**Các Loại Tests (từ trong ra ngoài):**
1. **Unit Tests** - Test cho single class/function, tốc độ nhanh, chạy độc lập
2. **Integration Tests** - Test kết hợp nhiều components với nhau
3. **E2E/Acceptance Tests** - Test toàn bộ hệ thống, dưới góc nhìn của người dùng

**BẮT BUỘC SỬ DỤNG Pattern Arrange-Act-Assert:**
```typescript
// Arrange - Set up test state
const calculator = new Calculator();

// Act - Execute the behavior
const result = calculator.add(2, 3);

// Assert - Verify the outcome
expect(result).toBe(5);
```

**Đặt tên Test:** BẮT BUỘC SỬ DỤNG các ví dụ cụ thể, tuyệt đối không dùng các câu khẳng định trừu tượng
```typescript
// BAD: 'can add numbers'
// GOOD: 'when adding 2 + 3, returns 5'
```

BẮT BUỘC THAM KHẢO: [references/testing.md](references/testing.md)

## Các Nguyên tắc Hành vi

- **Tell, Don't Ask** - BẮT BUỘC SỬ DỤNG command objects, TUYỆT ĐỐI KHÔNG truy vấn rồi mới quyết định
- **Design by Contract** - BẮT BUỘC THỰC THI preconditions, postconditions, invariants
- **Hollywood Principle** - "Đừng gọi cho chúng tôi, chúng tôi sẽ gọi cho bạn" (IoC)
- **Law of Demeter** - BẮT BUỘC CHỈ giao tiếp với các bạn bè trực tiếp

## Danh sách kiểm tra Trước khi Code

BẮT BUỘC TRẢ LỜI trước khi viết BẤT KỲ đoạn code nào:

1. [ ] Mình có hiểu yêu cầu không? (Viết tiêu chí chấp nhận (acceptance criteria) trước)
2. [ ] Bài test đầu tiên mình sẽ viết là gì?
3. [ ] Giải pháp nào là đơn giản nhất?
4. [ ] Những pattern nào có thể áp dụng? (Đừng ép buộc chúng)
5. [ ] Mình đang giải quyết một vấn đề thực tế hay một vấn đề giả định?

## Danh sách kiểm tra Trong khi Code

BẮT BUỘC LIÊN TỤC HỎI trong quá trình code:

1. [ ] Đây có phải là cách đơn giản nhất có thể hoạt động không?
2. [ ] Class này có đảm nhiệm duy nhất một trách nhiệm (single responsibility) không?
3. [ ] Mình đang phụ thuộc vào abstractions hay concretions?
4. [ ] Mình có thể đặt tên này rõ ràng hơn không?
5. [ ] Có sự trùng lặp nào mình nên tách ra không? (Rule of Three)

## Danh sách kiểm tra Sau khi Code

BẮT BUỘC KIỂM TRA sau khi code đã chạy được:

1. [ ] Tất cả các bài test đã pass chưa?
2. [ ] Có dead code nào cần xóa bỏ không?
3. [ ] Mình có thể đơn giản hóa bất kỳ câu điều kiện phức tạp nào không?
4. [ ] Các tên gọi có còn chính xác sau các thay đổi không?
5. [ ] Một lập trình viên junior có hiểu được đoạn code này sau 6 tháng nữa không?

## Cờ đỏ - Dừng lại và Suy nghĩ lại

BẮT BUỘC DỪNG LẠI nếu:
- Đang viết code mà không có test
- Một class có nhiều hơn 2 biến instance
- Một method dài hơn 10 dòng
- Vượt quá một mức độ thụt lề
- Dùng `else` khi có thể dùng early return
- Hardcode các giá trị lẽ ra phải có thể cấu hình được
- Tạo abstractions trước khi có sự trùng lặp lần thứ ba
- Thêm tính năng "phòng hờ trường hợp..." (just in case)
- Phụ thuộc vào implementations cụ thể
- Các God classes (class biết quá nhiều và làm quá nhiều)

## Ghi nhớ

> "Một chút trùng lặp thì tốt hơn 10 lần so với việc dùng sai abstraction."

> "Tập trung vào CÁI GÌ cần xảy ra, chứ không phải XẢY RA NHƯ THẾ NÀO."

> "Các nguyên tắc thiết kế sẽ trở thành bản năng tự nhiên thông qua luyện tập. Dần dần, bạn sẽ không cần phải nghĩ về SOLID nữa - bạn sẽ tự động viết ra code chuẩn SOLID."

BẮT BUỘC ĐẠT TỚI tư duy hệ thống - BẮT BUỘC THẤU HIỂU các nguyên tắc vào sâu bên trong và TẬP TRUNG vào việc tối ưu hóa toàn bộ quá trình phát triển.
