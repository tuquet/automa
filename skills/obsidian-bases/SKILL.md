---
name: obsidian-bases
description: Create and edit Obsidian Bases (.base files) with views, filters, formulas, and summaries. Use when working with .base files, creating database-like views of notes, or when the user mentions Bases, table views, card views, filters, or formulas in Obsidian.
---

# Kỹ năng Obsidian Bases

## Quy trình Làm việc

BẮT BUỘC THỰC THI nghiêm ngặt các bước sau đây:
1. **Tạo File**: BẮT BUỘC TẠO file `.base` trong vault, đảm bảo nội dung YAML cấu trúc hoàn toàn hợp lệ.
2. **Xác định Phạm vi**: BẮT BUỘC THÊM `filters` để khoanh vùng các notes sẽ xuất hiện (theo tag, folder, property, hoặc ngày tháng).
3. **Thêm Công thức** (Tùy chọn): BẮT BUỘC ĐỊNH NGHĨA các thuộc tính tính toán bên trong block `formulas` nếu cần.
4. **Cấu hình Hiển thị**: BẮT BUỘC THÊM ít nhất một hoặc nhiều views (`table`, `cards`, `list`, hoặc `map`) và sử dụng `order` để chỉ định chính xác các thuộc tính cần hiển thị.
5. **Kiểm tra Hợp lệ**: BẮT BUỘC XÁC MINH cấu trúc YAML không có bất kỳ lỗi cú pháp nào. BẮT BUỘC KIỂM TRA tất cả các tham chiếu thuộc tính và công thức đều tồn tại.
6. **Kiểm thử trong Obsidian**: BẮT BUỘC MỞ file `.base` trong Obsidian để xác nhận kết quả hiển thị. NẾU phát hiện lỗi YAML, BẮT BUỘC ĐỐI CHIẾU VÀ SỬA THEO các quy tắc đóng ngoặc kép được liệt kê bên dưới.

## Schema

BẮT BUỘC SỬ DỤNG đuôi mở rộng `.base` và đảm bảo tính hợp lệ tuyệt đối của YAML.

```yaml
# Các bộ lọc toàn cục (global filters) BẮT BUỘC áp dụng cho TẤT CẢ các views trong Base.
filters:
  # Có thể là một chuỗi bộ lọc đơn,
  # HOẶC một đối tượng bộ lọc đệ quy với CHÍNH XÁC MỘT khóa duy nhất: and, or, hoặc not.
  and:
    - 'status == "active"'
    - not:
        - 'file.hasTag("archived")'

# BẮT BUỘC định nghĩa các thuộc tính tính toán tại đây để dùng chung cho mọi views.
formulas:
  formula_name: 'expression'

# Cấu hình tên hiển thị và các thiết lập cho thuộc tính.
properties:
  property_name:
    displayName: "Display Name"
  formula.formula_name:
    displayName: "Formula Display Name"
  file.ext:
    displayName: "Extension"

# Định nghĩa các công thức tính tổng tùy chỉnh.
summaries:
  custom_summary_name: 'values.mean().round(3)'

# BẮT BUỘC định nghĩa MỘT hoặc NHIỀU views.
views:
  - type: table | cards | list | map
    name: "View Name"
    limit: 10                    # Tùy chọn: Giới hạn số lượng kết quả
    groupBy:                     # Tùy chọn: Nhóm kết quả
      property: property_name
      direction: ASC | DESC
    filters:                     # Bộ lọc riêng cho view này BẮT BUỘC tuân theo cùng quy tắc
      and:
        - 'status == "active"'
    order:                       # BẮT BUỘC khai báo danh sách thuộc tính cần hiển thị theo thứ tự
      - file.name
      - property_name
      - formula.formula_name
    summaries:                   # Ánh xạ thuộc tính với các công thức tổng hợp
      property_name: Average
```

## Cú pháp Bộ lọc

BẮT BUỘC SỬ DỤNG các bộ lọc (filters) để tinh chỉnh kết quả truy vấn. BẮT BUỘC ÁP DỤNG chúng ở cấp độ toàn cục (global) hoặc chi tiết cho từng view.

### Cấu trúc Bộ lọc

```yaml
# Bộ lọc đơn lẻ
filters: 'status == "done"'

# AND - BẮT BUỘC TẤT CẢ điều kiện đều phải đúng
filters:
  and:
    - 'status == "done"'
    - 'priority > 3'

# OR - CHỈ CẦN MỘT TRONG CÁC điều kiện đúng
filters:
  or:
    - 'file.hasTag("book")'
    - 'file.hasTag("article")'

# NOT - TUYỆT ĐỐI LOẠI BỎ các mục thỏa mãn điều kiện
filters:
  not:
    - 'file.hasTag("archived")'

# Bộ lọc lồng nhau
filters:
  or:
    - file.hasTag("tag")
    - and:
        - file.hasTag("book")
        - file.hasLink("Textbook")
    - not:
        - file.hasTag("book")
        - file.inFolder("Required Reading")
```

### Toán tử Bộ lọc

| Toán tử | Mô tả |
|---------|-------|
| `==` | Bằng |
| `!=` | Khác |
| `>` | Lớn hơn |
| `<` | Nhỏ hơn |
| `>=` | Lớn hơn hoặc bằng |
| `<=` | Nhỏ hơn hoặc bằng |
| `&&` | Logic AND |
| `\|\|` | Logic OR |
| `!` | Logic NOT |

## Thuộc tính (Properties)

### Ba Loại Thuộc tính Cơ bản

1. **Thuộc tính Note** - Bắt nguồn từ frontmatter: `note.author` hoặc gọi tắt là `author`.
2. **Thuộc tính File** - Metadata nội tại của file: `file.name`, `file.mtime`, v.v.
3. **Thuộc tính Công thức** - Các giá trị được tính toán từ block formulas: `formula.my_formula`.

### Bảng Tham khảo Thuộc tính File

| Thuộc tính | Kiểu dữ liệu | Mô tả |
|------------|--------------|-------|
| `file.name` | String | Tên file đầy đủ. |
| `file.basename` | String | Tên file không bao gồm phần đuôi mở rộng. |
| `file.path` | String | Đường dẫn tuyệt đối đến file. |
| `file.folder` | String | Đường dẫn đến thư mục cha chứa file. |
| `file.ext` | String | Đuôi mở rộng của file. |
| `file.size` | Number | Kích thước file (tính bằng bytes). |
| `file.ctime` | Date | Thời điểm khởi tạo file. |
| `file.mtime` | Date | Thời điểm sửa đổi file gần nhất. |
| `file.tags` | List | Danh sách toàn bộ tags xuất hiện trong file. |
| `file.links` | List | Danh sách toàn bộ các liên kết nội bộ trong file. |
| `file.backlinks` | List | Danh sách toàn bộ các file khác đang trỏ liên kết đến file này. |
| `file.embeds` | List | Danh sách các thành phần được nhúng trong note. |
| `file.properties`| Object | Khối chứa toàn bộ thuộc tính frontmatter. |

### Từ khóa `this`

- Khi ở khu vực nội dung chính: BẮT BUỘC ĐƯỢC HIỂU LÀ tham chiếu đến chính file Base hiện tại.
- Khi được nhúng: BẮT BUỘC ĐƯỢC HIỂU LÀ tham chiếu đến file đang chứa lệnh nhúng Base.
- Khi ở sidebar: BẮT BUỘC ĐƯỢC HIỂU LÀ tham chiếu đến file đang được mở trong khu vực nội dung chính.

## Cú pháp Công thức

BẮT BUỘC ĐỊNH NGHĨA tất cả công thức tính toán bên trong khối `formulas`.

```yaml
formulas:
  # Các phép toán số học cơ bản
  total: "price * quantity"

  # Biểu thức điều kiện logic
  status_icon: 'if(done, "✅", "⏳")'

  # Định dạng chuỗi văn bản
  formatted_price: 'if(price, price.toFixed(2) + " dollars")'

  # Định dạng ngày tháng
  created: 'file.ctime.format("YYYY-MM-DD")'

  # Tính số ngày trôi qua từ khi tạo file (BẮT BUỘC SỬ DỤNG thuộc tính .days cho kiểu Duration)
  days_old: '(now() - file.ctime).days'

  # Tính số ngày còn lại cho đến hạn chót (due_date)
  days_until_due: 'if(due_date, (date(due_date) - today()).days, "")'
```

## Các Hàm Cốt lõi

BẮT BUỘC SỬ DỤNG các hàm tiêu chuẩn sau đây. BẮT BUỘC THAM KHẢO [FUNCTIONS_REFERENCE.md](references/FUNCTIONS_REFERENCE.md) để nắm rõ chi tiết toàn bộ các hàm hỗ trợ.

| Hàm | Cú pháp | Mô tả |
|-----|---------|-------|
| `date()` | `date(string): date` | Phân tích chuỗi thành kiểu Date (định dạng `YYYY-MM-DD HH:mm:ss`). |
| `now()` | `now(): date` | Lấy chính xác thời điểm ngày và giờ hiện tại. |
| `today()` | `today(): date` | Lấy ngày hiện tại (mặc định gán thời gian là `00:00:00`). |
| `if()` | `if(condition, trueResult, falseResult?)` | Hàm xử lý điều kiện rẽ nhánh. |
| `duration()`| `duration(string): duration`| Phân tích chuỗi thành kiểu Thời lượng. |
| `file()` | `file(path): file` | Lấy đối tượng file tương ứng với đường dẫn. |
| `link()` | `link(path, display?): Link` | Khởi tạo đối tượng liên kết. |

### Kiểu Dữ liệu Duration (Thời lượng)

CẢNH BÁO TUYỆT ĐỐI QUAN TRỌNG: Phép trừ giữa hai giá trị ngày tháng SẼ LUÔN TRẢ VỀ kiểu **Duration**, TUYỆT ĐỐI KHÔNG PHẢI LÀ MỘT CON SỐ (Number).

**Các trường dữ liệu của Duration bao gồm:** `duration.days`, `duration.hours`, `duration.minutes`, `duration.seconds`, `duration.milliseconds`.

**QUY TẮC CẤM KỴ:** Kiểu Duration TUYỆT ĐỐI KHÔNG hỗ trợ các hàm `.round()`, `.floor()`, `.ceil()` một cách trực tiếp. BẮT BUỘC PHẢI TRUY CẬP vào một trường dạng số trước (ví dụ: `.days`), SAU ĐÓ mới được quyền áp dụng các hàm toán học.

```yaml
# CHUẨN XÁC: Tính số ngày chênh lệch giữa hai thời điểm
"(date(due_date) - today()).days"                    # Trả về số lượng ngày
"(now() - file.ctime).days"                          # Số ngày kể từ khi tạo
"(date(due_date) - today()).days.round(0)"           # Số ngày đã làm tròn

# SAI LẦM NGHIÊM TRỌNG - BẮT BUỘC SẼ GÂY LỖI:
# "((date(due) - today()) / 86400000).round(0)"      # Kiểu Duration tuyệt đối không hỗ trợ phép chia trực tiếp rồi làm tròn
```

### Tính toán Ngày tháng

```yaml
# Các đơn vị hỗ trợ cho Duration: y/year/years, M/month/months, d/day/days,
# w/week/weeks, h/hour/hours, m/minute/minutes, s/second/seconds
"now() + \"1 day\""          # Ngày mai
"today() + \"7d\""           # 7 ngày tính từ hôm nay
"now() - file.ctime"         # KẾT QUẢ TRẢ VỀ LÀ KIỂU DURATION
"(now() - file.ctime).days"  # KẾT QUẢ TRẢ VỀ LÀ SỐ LƯỢNG NGÀY
```

## Các Kiểu View

### Table View (Dạng Bảng)

```yaml
views:
  - type: table
    name: "My Table"
    order:
      - file.name
      - status
      - due_date
    summaries:
      price: Sum
      count: Average
```

### Cards View (Dạng Thẻ)

```yaml
views:
  - type: cards
    name: "Gallery"
    order:
      - file.name
      - cover_image
      - description
```

### List View (Dạng Danh sách)

```yaml
views:
  - type: list
    name: "Simple List"
    order:
      - file.name
      - status
```

### Map View (Dạng Bản đồ)

BẮT BUỘC PHẢI CÓ các thuộc tính lưu trữ vĩ độ/kinh độ và ĐÒI HỎI PHẢI CÀI ĐẶT plugin cộng đồng Maps.

```yaml
views:
  - type: map
    name: "Locations"
    # Các thiết lập riêng biệt của Map dành cho thuộc tính lat/lng
```

## Các Công thức Tóm tắt (Summaries) Mặc định

| Tên | Đầu vào | Mô tả |
|-----|---------|-------|
| `Average` | Number | Tính trung bình cộng. |
| `Min` | Number | Tìm giá trị nhỏ nhất. |
| `Max` | Number | Tìm giá trị lớn nhất. |
| `Sum` | Number | Tính tổng cộng dồn của tất cả các số. |
| `Range` | Number | Bằng Max trừ đi Min. |
| `Median` | Number | Tìm trung vị toán học. |
| `Stddev` | Number | Tính độ lệch chuẩn. |
| `Earliest` | Date | Tìm ngày sớm nhất. |
| `Latest` | Date | Tìm ngày muộn nhất. |
| `Range` | Date | Bằng Latest trừ đi Earliest. |
| `Checked` | Boolean | Đếm số lượng các giá trị bằng `true`. |
| `Unchecked` | Boolean | Đếm số lượng các giá trị bằng `false`. |
| `Empty` | Any | Đếm số lượng các ô trống (không có giá trị). |
| `Filled` | Any | Đếm số lượng các ô đã được điền (có giá trị). |
| `Unique` | Any | Đếm số lượng các giá trị không trùng lặp (duy nhất). |

## Các Ví dụ Hoàn chỉnh

### Task Tracker Base

```yaml
filters:
  and:
    - file.hasTag("task")
    - 'file.ext == "md"'

formulas:
  days_until_due: 'if(due, (date(due) - today()).days, "")'
  is_overdue: 'if(due, date(due) < today() && status != "done", false)'
  priority_label: 'if(priority == 1, "🔴 High", if(priority == 2, "🟡 Medium", "🟢 Low"))'

properties:
  status:
    displayName: Status
  formula.days_until_due:
    displayName: "Days Until Due"
  formula.priority_label:
    displayName: Priority

views:
  - type: table
    name: "Active Tasks"
    filters:
      and:
        - 'status != "done"'
    order:
      - file.name
      - status
      - formula.priority_label
      - due
      - formula.days_until_due
    groupBy:
      property: status
      direction: ASC
    summaries:
      formula.days_until_due: Average

  - type: table
    name: "Completed"
    filters:
      and:
        - 'status == "done"'
    order:
      - file.name
      - completed_date
```

### Reading List Base

```yaml
filters:
  or:
    - file.hasTag("book")
    - file.hasTag("article")

formulas:
  reading_time: 'if(pages, (pages * 2).toString() + " min", "")'
  status_icon: 'if(status == "reading", "📖", if(status == "done", "✅", "📚"))'
  year_read: 'if(finished_date, date(finished_date).year, "")'

properties:
  author:
    displayName: Author
  formula.status_icon:
    displayName: ""
  formula.reading_time:
    displayName: "Est. Time"

views:
  - type: cards
    name: "Library"
    order:
      - cover
      - file.name
      - author
      - formula.status_icon
    filters:
      not:
        - 'status == "dropped"'

  - type: table
    name: "Reading List"
    filters:
      and:
        - 'status == "to-read"'
    order:
      - file.name
      - author
      - pages
      - formula.reading_time
```

### Daily Notes Index

```yaml
filters:
  and:
    - file.inFolder("Daily Notes")
    - '/^\d{4}-\d{2}-\d{2}$/.matches(file.basename)'

formulas:
  word_estimate: '(file.size / 5).round(0)'
  day_of_week: 'date(file.basename).format("dddd")'

properties:
  formula.day_of_week:
    displayName: "Day"
  formula.word_estimate:
    displayName: "~Words"

views:
  - type: table
    name: "Recent Notes"
    limit: 30
    order:
      - file.name
      - formula.day_of_week
      - formula.word_estimate
      - file.mtime
```

## Nhúng Bases

BẮT BUỘC PHẢI NHÚNG Base vào các file Markdown bằng cú pháp vô cùng chuẩn xác sau đây:

```markdown
![[MyBase.base]]

<!-- Nhúng một view cụ thể -->
![[MyBase.base#View Name]]
```

## Các Quy tắc Đóng Ngoặc YAML Cực kỳ Quan trọng

- BẮT BUỘC SỬ DỤNG DẤU NHÁY ĐƠN (Single Quotes) để bao bọc các công thức có chứa dấu nháy kép bên trong: `'if(done, "Yes", "No")'`.
- BẮT BUỘC SỬ DỤNG DẤU NHÁY KÉP (Double Quotes) cho các chuỗi văn bản thông thường: `"My View Name"`.
- BẮT BUỘC PHẢI ESCAPE các dấu nháy lồng nhau một cách cực kỳ cẩn thận và chính xác trong các biểu thức phức tạp.

## Xử lý Sự cố (Troubleshooting)

### Lỗi Cú pháp YAML

**Ký tự đặc biệt không được đặt trong dấu ngoặc kép**: BẮT BUỘC PHẢI ĐẶT TRONG DẤU NGOẶC KÉP các chuỗi có chứa bất kỳ ký tự nào sau đây: `:`, `{`, `}`, `[`, `]`, `,`, `&`, `*`, `#`, `?`, `|`, `-`, `<`, `>`, `=`, `!`, `%`, `@`, `` ` ``.

```yaml
# SAI LẦM NGHIÊM TRỌNG - Chứa dấu hai chấm nhưng lại không được đóng ngoặc kép
displayName: Status: Active

# CHUẨN XÁC
displayName: "Status: Active"
```

**Lỗi không khớp dấu ngoặc trong công thức**: BẮT BUỘC BAO BỌC toàn bộ công thức bằng dấu nháy đơn khi công thức đó có chứa dấu nháy kép bên trong.

```yaml
# SAI LẦM NGHIÊM TRỌNG - Sử dụng dấu nháy kép lồng nhau
formulas:
  label: "if(done, "Yes", "No")"

# CHUẨN XÁC - Sử dụng dấu nháy đơn để bọc toàn bộ chuỗi chứa dấu nháy kép
formulas:
  label: 'if(done, "Yes", "No")'
```

### Các Lỗi Công thức Phổ biến Cần Tuyệt đối Tránh

**Thực hiện toán học trên Duration nhưng quên truy cập thuộc tính**: BẮT BUỘC PHẢI TRUY CẬP vào `.days`, `.hours`, v.v., TRƯỚC KHI tiến hành áp dụng các phép toán số học. BẮT BUỘC GHI NHỚ: Phép trừ ngày tháng trả về Duration.

```yaml
# SAI LẦM NGHIÊM TRỌNG - Duration không phải là một con số
"(now() - file.ctime).round(0)"

# CHUẨN XÁC - Bắt buộc truy cập .days trước, sau đó mới làm tròn
"(now() - file.ctime).days.round(0)"
```

**Thiếu cơ chế kiểm tra Null**: BẮT BUỘC SỬ DỤNG `if()` để bảo vệ an toàn biểu thức. Các thuộc tính hoàn toàn có thể không tồn tại trên tất cả các notes.

```yaml
# SAI LẦM NGHIÊM TRỌNG - Sẽ ngay lập tức crash nếu due_date bị trống (empty)
"(date(due_date) - today()).days"

# CHUẨN XÁC - Bắt buộc bảo vệ an toàn bằng if()
'if(due_date, (date(due_date) - today()).days, "")'
```

**Tham chiếu các công thức không xác định**: BẮT BUỘC ĐẢM BẢO CHẮC CHẮN RẰNG mỗi khai báo `formula.X` trong mục `order` hoặc `properties` BẮT BUỘC PHẢI CÓ một định nghĩa tương ứng hoàn toàn trùng khớp bên trong mục `formulas`.

```yaml
# Sẽ thất bại hoàn toàn và không báo lỗi trực tiếp nếu 'total' không được định nghĩa trong formulas
order:
  - formula.total

# CÁCH KHẮC PHỤC: Bắt buộc định nghĩa nó
formulas:
  total: "price * quantity"
```

## Tài liệu Tham khảo

- [Bases Syntax](https://help.obsidian.md/bases/syntax)
- [Functions](https://help.obsidian.md/bases/functions)
- [Views](https://help.obsidian.md/bases/views)
- [Formulas](https://help.obsidian.md/formulas)
- [Complete Functions Reference](references/FUNCTIONS_REFERENCE.md)
