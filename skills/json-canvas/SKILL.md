---
name: json-canvas
description: Create and edit JSON Canvas files (.canvas) with nodes, edges, groups, and connections. Use when working with .canvas files, creating visual canvases, mind maps, flowcharts, or when the user mentions Canvas files in Obsidian.
---

# Kỹ năng JSON Canvas

## Cấu trúc File

Một file `.canvas` BẮT BUỘC phải chứa hai mảng cấp cao nhất:

```json
{
  "nodes": [],
  "edges": []
}
```

- `nodes` (Tùy chọn): Mảng chứa các đối tượng node.
- `edges` (Tùy chọn): Mảng chứa các đối tượng edge kết nối các nodes.

## Quy trình Làm việc Chung

### 1. Tạo một Canvas mới

1. BẮT BUỘC TẠO một file `.canvas` với cấu trúc khởi tạo: `{"nodes": [], "edges": []}`.
2. BẮT BUỘC TẠO `id` định dạng hex 16 ký tự, đảm bảo tính duy nhất tuyệt đối cho mỗi node (ví dụ: `"6f0ad84f44ce9c17"`).
3. BẮT BUỘC THÊM các nodes với đầy đủ các trường yêu cầu: `id`, `type`, `x`, `y`, `width`, `height`.
4. BẮT BUỘC THÊM các edges tham chiếu chính xác đến các `id` node đã tồn tại thông qua `fromNode` và `toNode`.
5. **KIỂM TRA HỢP LỆ**: BẮT BUỘC ĐẢM BẢO JSON hoàn toàn hợp lệ và tất cả các tham chiếu đều chính xác. TUYỆT ĐỐI KHÔNG để xảy ra lỗi cấu trúc.

### 2. Thêm một Node vào Canvas hiện có

1. BẮT BUỘC ĐỌC và phân tích cú pháp (parse) file `.canvas` hiện tại một cách cẩn thận.
2. BẮT BUỘC TẠO một `id` hoàn toàn mới và duy nhất.
3. BẮT BUỘC CHỌN vị trí tọa độ (`x`, `y`) sao cho TUYỆT ĐỐI KHÔNG chồng chéo lên các nodes hiện có.
4. BẮT BUỘC THÊM node mới vào mảng `nodes`.
5. BẮT BUỘC THÊM các edges kết nối node mới nếu cần thiết.
6. **KIỂM TRA HỢP LỆ**: BẮT BUỘC ĐẢM BẢO tính duy nhất của `id` và sự hợp lệ của toàn bộ tham chiếu edge.

### 3. Kết nối hai Nodes

1. BẮT BUỘC XÁC ĐỊNH chính xác `id` của node nguồn và node đích.
2. BẮT BUỘC TẠO một `id` duy nhất cho edge mới.
3. BẮT BUỘC THIẾT LẬP giá trị cho `fromNode` và `toNode`.
4. CÓ THỂ THIẾT LẬP `fromSide`/`toSide` và `label` nếu cần.
5. BẮT BUỘC THÊM edge vừa tạo vào mảng `edges`.
6. **KIỂM TRA HỢP LỆ**: BẮT BUỘC ĐẢM BẢO cả hai `id` node đều đang tồn tại trong Canvas.

### 4. Chỉnh sửa Canvas hiện có

1. BẮT BUỘC ĐỌC và phân tích cú pháp file `.canvas`.
2. BẮT BUỘC XÁC ĐỊNH VỊ TRÍ node hoặc edge cần sửa thông qua `id`.
3. BẮT BUỘC SỬA ĐỔI các thuộc tính theo yêu cầu.
4. BẮT BUỘC GHI lại chuỗi JSON đã cập nhật vào file.
5. **KIỂM TRA HỢP LỆ**: BẮT BUỘC KIỂM TRA LẠI tính duy nhất của `id` và tính toàn vẹn của tất cả các edges.

## Nodes

Thứ tự xuất hiện của các phần tử trong mảng sẽ quyết định `z-index`: node đầu tiên nằm ở lớp dưới cùng, node cuối cùng nằm ở lớp trên cùng. BẮT BUỘC SẮP XẾP hợp lý.

### Thuộc tính Node Chung

| Thuộc tính | Bắt buộc | Kiểu dữ liệu | Mô tả |
|------------|----------|--------------|-------|
| `id` | Có | string | Định danh hex 16 ký tự, TUYỆT ĐỐI DUY NHẤT. |
| `type` | Có | string | BẮT BUỘC LÀ một trong: `text`, `file`, `link`, hoặc `group`. |
| `x` | Có | integer | Vị trí trục X (tính bằng pixel). |
| `y` | Có | integer | Vị trí trục Y (tính bằng pixel). |
| `width` | Có | integer | Chiều rộng (tính bằng pixel). |
| `height` | Có | integer | Chiều cao (tính bằng pixel). |
| `color` | Không | canvasColor | Giá trị preset từ `"1"` đến `"6"` hoặc mã hex (ví dụ: `"#FF0000"`). |

### Text Nodes

| Thuộc tính | Bắt buộc | Kiểu dữ liệu | Mô tả |
|------------|----------|--------------|-------|
| `text` | Có | string | Văn bản thuần túy, hỗ trợ cú pháp Markdown. |

```json
{
  "id": "6f0ad84f44ce9c17",
  "type": "text",
  "x": 0,
  "y": 0,
  "width": 400,
  "height": 200,
  "text": "# Hello World\n\nThis is **Markdown** content."
}
```

**QUY TẮC NGẮT DÒNG CỰC KỲ QUAN TRỌNG**: BẮT BUỘC SỬ DỤNG `\n` để ngắt dòng bên trong chuỗi JSON. TUYỆT ĐỐI KHÔNG SỬ DỤNG `\\n`.

### File Nodes

| Thuộc tính | Bắt buộc | Kiểu dữ liệu | Mô tả |
|------------|----------|--------------|-------|
| `file` | Có | string | Đường dẫn tương đối đến file trong hệ thống vault. |
| `subpath` | Không | string | Liên kết trỏ đến heading hoặc block cụ thể (bắt đầu bằng dấu `#`). |

```json
{
  "id": "a1b2c3d4e5f67890",
  "type": "file",
  "x": 500,
  "y": 0,
  "width": 400,
  "height": 300,
  "file": "Attachments/diagram.png"
}
```

### Link Nodes

| Thuộc tính | Bắt buộc | Kiểu dữ liệu | Mô tả |
|------------|----------|--------------|-------|
| `url` | Có | string | URL liên kết ra bên ngoài. |

```json
{
  "id": "c3d4e5f678901234",
  "type": "link",
  "x": 1000,
  "y": 0,
  "width": 400,
  "height": 200,
  "url": "https://obsidian.md"
}
```

### Group Nodes

BẮT BUỘC ĐỊNH VỊ tọa độ và kích thước các node con sao cho chúng nằm trọn vẹn bên trong ranh giới của group node.

| Thuộc tính | Bắt buộc | Kiểu dữ liệu | Mô tả |
|------------|----------|--------------|-------|
| `label` | Không | string | Nhãn văn bản hiển thị cho group. |
| `background` | Không | string | Đường dẫn đến ảnh nền. |
| `backgroundStyle` | Không | string | BẮT BUỘC LÀ một trong: `cover`, `ratio`, hoặc `repeat`. |

```json
{
  "id": "d4e5f6789012345a",
  "type": "group",
  "x": -50,
  "y": -50,
  "width": 1000,
  "height": 600,
  "label": "Project Overview",
  "color": "4"
}
```

## Edges

| Thuộc tính | Bắt buộc | Kiểu dữ liệu | Mặc định | Mô tả |
|------------|----------|--------------|----------|-------|
| `id` | Có | string | - | Định danh duy nhất. |
| `fromNode` | Có | string | - | ID của node nguồn (BẮT BUỘC TỒN TẠI). |
| `fromSide` | Không | string | - | `top`, `right`, `bottom`, hoặc `left`. |
| `fromEnd` | Không | string | `none` | `none` hoặc `arrow`. |
| `toNode` | Có | string | - | ID của node đích (BẮT BUỘC TỒN TẠI). |
| `toSide` | Không | string | - | `top`, `right`, `bottom`, hoặc `left`. |
| `toEnd` | Không | string | `arrow` | `none` hoặc `arrow`. |
| `color` | Không | canvasColor| - | Màu sắc đường nối. |
| `label` | Không | string | - | Nhãn văn bản đính kèm trên edge. |

```json
{
  "id": "0123456789abcdef",
  "fromNode": "6f0ad84f44ce9c17",
  "fromSide": "right",
  "toNode": "a1b2c3d4e5f67890",
  "toSide": "left",
  "toEnd": "arrow",
  "label": "leads to"
}
```

## Bảng Màu (Colors)

| Preset | Màu sắc |
|--------|---------|
| `"1"` | Đỏ |
| `"2"` | Cam |
| `"3"` | Vàng |
| `"4"` | Xanh lá |
| `"5"` | Xanh lơ |
| `"6"` | Tím |

## Tạo ID

BẮT BUỘC TẠO chuỗi hệ thập lục phân viết thường gồm chính xác 16 ký tự. TUYỆT ĐỐI KHÔNG sử dụng định dạng khác:

```text
"6f0ad84f44ce9c17"
"a3b2c1d0e9f8a7b6"
```

## Hướng dẫn Bố cục

- Tọa độ CÓ THỂ mang giá trị âm.
- BẮT BUỘC DUY TRÌ khoảng cách giữa các nodes từ 50px đến 100px. BẮT BUỘC CHỪA padding từ 20px đến 50px bên trong các groups.
- BẮT BUỘC CĂN CHỈNH tọa độ và kích thước theo lưới (phải là bội số của 10 hoặc 20).

| Kiểu Node | Chiều rộng đề xuất (px) | Chiều cao đề xuất (px) |
|-----------|-------------------------|------------------------|
| Small text | 200 - 300 | 80 - 150 |
| Medium text | 300 - 450 | 150 - 300 |
| Large text | 400 - 600 | 300 - 500 |
| File preview| 300 - 500 | 200 - 400 |
| Link preview| 250 - 400 | 100 - 200 |

## Danh sách Kiểm tra Bắt buộc

BẮT BUỘC XÁC MINH nghiêm ngặt các điều kiện sau trước khi hoàn tất:
1. Toàn bộ giá trị `id` BẮT BUỘC PHẢI DUY NHẤT trong toàn file.
2. Mọi trường `fromNode` và `toNode` BẮT BUỘC PHẢI THAM CHIẾU đến một `id` node đang tồn tại.
3. Các trường bắt buộc BẮT BUỘC PHẢI CÓ MẶT đầy đủ cho từng kiểu node tương ứng.
4. Trường `type` BẮT BUỘC PHẢI HỢP LỆ.
5. Trường `fromSide`/`toSide` và `fromEnd`/`toEnd` BẮT BUỘC PHẢI HỢP LỆ.
6. Các preset màu sắc BẮT BUỘC PHẢI HỢP LỆ.
7. Toàn bộ nội dung JSON BẮT BUỘC PHẢI HỢP LỆ và có thể parse được thành công.

## Ví dụ Hoàn chỉnh

BẮT BUỘC XEM [references/EXAMPLES.md](references/EXAMPLES.md) để tham khảo các ví dụ Canvas chuẩn mực nhất.

## Tài liệu Tham khảo

- [JSON Canvas Spec 1.0](https://jsoncanvas.org/spec/1.0/)
- [JSON Canvas GitHub](https://github.com/obsidianmd/jsoncanvas)
