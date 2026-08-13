---
name: defuddle
description: Extract clean markdown content from web pages using Defuddle CLI, removing clutter and navigation to save tokens. Use instead of WebFetch when the user provides a URL to read or analyze, for online documentation, articles, blog posts, or any standard web page. Do NOT use for URLs ending in .md — those are already markdown, use WebFetch directly.
---

# Kỹ năng Defuddle

BẮT BUỘC SỬ DỤNG Defuddle CLI để trích xuất nội dung từ các trang web. BẮT BUỘC ƯU TIÊN sử dụng công cụ này thay vì WebFetch đối với các trang web tiêu chuẩn.
TUYỆT ĐỐI KHÔNG sử dụng cho các URL có đuôi `.md`.

BẮT BUỘC THỰC THI lệnh thông qua công cụ `run_command` của kiến trúc Daemon. TUYỆT ĐỐI KHÔNG sử dụng `child_process` hoặc các phương thức gọi thực thi cục bộ lỗi thời. KHÔNG YÊU CẦU cài đặt thủ công qua `npm install -g`.

## Cú pháp Sử dụng

BẮT BUỘC SỬ DỤNG tham số `--md` để xuất ra định dạng Markdown:

```bash
defuddle parse <url> --md
```

BẮT BUỘC SỬ DỤNG tham số `-o` để lưu kết quả vào file:

```bash
defuddle parse <url> --md -o content.md
```

BẮT BUỘC SỬ DỤNG tham số `-p` để trích xuất metadata cụ thể khi cần:

```bash
defuddle parse <url> -p title
defuddle parse <url> -p description
defuddle parse <url> -p domain
```

## Định dạng Đầu ra

| Tham số | Định dạng |
|---------|-----------|
| `--md` | Markdown (Lựa chọn mặc định và BẮT BUỘC DÙNG) |
| `--json` | JSON chứa cả HTML và Markdown |
| (Trống) | HTML |
| `-p <name>` | Thuộc tính metadata cụ thể |
