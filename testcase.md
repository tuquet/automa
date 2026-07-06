# Bộ Testcase: Add 1 Member vào Team (Role GL)

Danh sách này bao gồm các kịch bản kiểm thử (Testcases) dành riêng cho Role **GL (Group Lead / Division Lead)** đối với tính năng Add Single Member. 

*(Lưu ý: Thể theo yêu cầu, các kịch bản test liên quan đến việc hệ thống chặn GL nhập ngày trong quá khứ - Backdate Block - đã được lược bỏ khỏi danh sách này để người khác test tập trung vào các luồng hiển thị, phần quyền và validation cơ bản).*

## 1. Giới hạn Phạm vi và Phân quyền (Scope & RBAC)

| TC ID | Tiêu đề | Điều kiện (Given) | Hành động (When) | Kết quả mong đợi (Then) |
| --- | --- | --- | --- | --- |
| **GL_TC_01** | Giới hạn Scope tìm kiếm ECQS | GL đã đăng nhập, ở màn hình Team Detail (team thuộc Division của GL). | Click "Add Member", nhập tên/LDAP vào ô search. | - Kết quả search **chỉ** chứa nhân sự thuộc Division của GL.<br>- Nhân sự từ Division khác **không xuất hiện** trong danh sách dropdown. |
| **GL_TC_02** | E2E: Luồng thêm thành viên cơ bản | GL đăng nhập, đang ở danh sách Team. | - Vào màn hình Edit Team<br>- Click Add member<br>- Tìm employee, điền form và Submit. | - Quá trình hoàn tất suôn sẻ trong scope Division.<br>- Các thay đổi ghi nhận đúng vào tab History. |
| **GL_TC_03** | E2E: Add Member kết hợp Promote Lead | GL ở màn hình Team Detail. | - Add Member A vào team.<br>- Promote A lên làm Team Lead.<br>- Remove Lead cũ khỏi team. | - Luồng thao tác Add -> Promote -> Remove diễn ra không lỗi.<br>- Member count cập nhật đúng (tăng/giảm) sau mỗi thao tác.<br>- History ghi nhận đầy đủ chuỗi sự kiện. |

## 2. Giao diện, Nhập liệu & Hủy thao tác

| TC ID | Tiêu đề | Điều kiện (Given) | Hành động (When) | Kết quả mong đợi (Then) |
| --- | --- | --- | --- | --- |
| **GL_TC_04** | Hủy đóng Slide-over bằng Icon X | GL mở Slide-over Add Member (có hoặc chưa nhập dữ liệu). | Click icon X (Close) ở góc panel. | - Panel đóng, quay về màn hình cũ.<br>- Không có thành viên nào được add.<br>- Không lưu lại dữ liệu thừa. |
| **GL_TC_05** | Hủy Form bằng nút Cancel | GL mở Slide-over Add Member (có hoặc chưa nhập dữ liệu). | Click nút "Cancel" ở footer. | - Panel đóng, quay về màn hình cũ.<br>- Dữ liệu đã nhập không được lưu (Discard changes). |
| **GL_TC_06** | Clear nhanh trường Join Date | Form đang mở, Join Date đã có dữ liệu. | Click icon X (Clear) ngay trong ô input Join Date. | - Giá trị Join Date bị xóa trắng.<br>- Trường trở về trạng thái chưa chọn. |
| **GL_TC_07** | Clear nhanh trường Expected Leave Date | Form đang mở, Leave Date đã có dữ liệu. | Click icon X (Clear) ngay trong ô input Leave Date. | - Giá trị Expected Leave Date bị xóa trắng.<br>- Trường trở về trạng thái chưa chọn. |
| **GL_TC_08** | Search ECQS: Ký tự đặc biệt & Trim khoảng trắng | Form đang mở, trỏ chuột vào thanh search Employee. | Nhập ký tự đặc biệt (`@#$%`) hoặc khoảng trắng (` pthung `). | - Ký tự đặc biệt: Dropdown hiện "No employees found...".<br>- Khoảng trắng: Khoảng trắng đầu/cuối tự động được trim và trả kết quả search đúng. |
| **GL_TC_09** | Search ECQS: Max length input | Form đang mở, thanh search đang focus. | Cố tình nhập chuỗi quá dài (> 255 ký tự). | Payload (Request) gửi đi Server bị cắt (truncate) để tối đa 255 ký tự, hệ thống không bị crash. |
| **GL_TC_10** | Search ECQS: Xóa trắng input (Empty) | Form đang mở, thanh search đang có chữ. | Xóa toàn bộ input (trở về 0 chars). | Dropdown hiển thị lại danh sách default employee lúc ban đầu thay vì báo lỗi. |

## 3. Kiểm tra Hợp lệ Ngày tháng (Validation Dates cơ bản)

| TC ID | Tiêu đề | Điều kiện (Given) | Hành động (When) | Kết quả mong đợi (Then) |
| --- | --- | --- | --- | --- |
| **GL_TC_11** | Bỏ trống Join Date | Form đang mở, xóa trắng Join Date, Expected Leave Date = null. | Click nút "Add to Team". | - Chặn hành động Add.<br>- Hiển thị validation error/toast message: "Please select a Join Date". |
| **GL_TC_12** | Ngăn chặn nhập Format sai vào ô Date | Đang focus vào ô Join Date hoặc Expected Leave Date. | Gõ trực tiếp chữ text, khoảng trắng, ký tự đặc biệt vào picker. | Form không ghi nhận input, giữ nguyên giá trị hợp lệ đã chọn trước đó. |
| **GL_TC_13** | Hợp lệ: Join Date = Ngày hiện tại (Today) | Chọn Join Date = Today (Mặc định). | Click "Add to Team". | Add thành công, Status của member trong team = `ACTIVE`. |
| **GL_TC_14** | Hợp lệ: Join Date = Ngày tương lai (Future) | Chọn Join Date = Tương lai, Leave Date = null. | Click "Add to Team". | Add thành công, Status của member trong team = `PLANNED`. |
| **GL_TC_15** | Lỗi mâu thuẫn: Join Date bằng Leave Date | Chọn Join Date = Today, Expected Leave Date = Today. | Click "Add to Team". | - Chặn Add.<br>- Hiển thị lỗi validation: "Leave Date must be after Join Date". |
| **GL_TC_16** | Lỗi mâu thuẫn thời gian ngược | Chọn Join Date = Future, Leave Date = Today. | Click "Add to Team". | - Chặn Add.<br>- Hiển thị lỗi validation: "Leave Date must be after Join Date". |
| **GL_TC_17** | Hợp lệ: Join = Today, Leave = Future | Chọn Join Date = Today, Leave Date = Ngày trong tương lai. | Click "Add to Team". | Add thành công, Status của member trong team = `ACTIVE`. |
| **GL_TC_18** | Hợp lệ: Join = Future, Leave = Future | Cả 2 đều ở tương lai (Và Join < Leave). | Click "Add to Team". | Add thành công, Status của member trong team = `PLANNED`. |