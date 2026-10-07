# QLPH - Hệ Thống Quản Lý Mượn Phòng Học

Ứng dụng web toàn diện dành cho trường học và trung tâm đào tạo giúp số hóa quy trình mượn phòng học, ngăn chặn triệt để tình trạng trùng lặp lịch, cung cấp lịch tuần trực quan và báo cáo thống kê sử dụng chi tiết.

---

## 🚀 Tính Năng Chính

### 1. Đăng ký & Đăng nhập Đa phương thức (Mới)
- **Tạo tài khoản sinh viên**: Nhập trực tiếp **Mã số sinh viên (MSSV)**, Họ tên, Email, Số điện thoại và Mật khẩu. Hệ thống tự động kiểm tra trùng lặp và đăng nhập ngay khi tạo thành công.
- **Đăng nhập linh hoạt**: Hỗ trợ đăng nhập bằng **Mã số sinh viên (MSSV)** (VD: `SV2024001`) hoặc **Tên đăng nhập** (VD: `user1`, `admin`) cùng mật khẩu.
- **Đăng nhập một chạm qua Google & Facebook**: Tự động tạo và liên kết tài khoản sinh viên khi xác thực qua tài khoản Google hoặc Facebook.

### 2. Phân quyền và Bảo mật (2 vai trò)
- **Người mượn (Giáo viên / Nhân viên / Sinh viên)**:
  - Đăng nhập và tra cứu danh mục phòng học.
  - Xem thông tin chi tiết phòng (sức chứa, vị trí, trang thiết bị) và bảng lịch tuần trực quan (07:00 - 21:00).
  - Gửi yêu cầu mượn phòng với kiểm tra trùng lịch tự động.
  - Theo dõi trạng thái mượn (Chờ duyệt, Đã duyệt, Từ chối, Đã hủy).
  - Hủy lịch mượn của chính mình (yêu cầu cung cấp lý do hủy).
- **Quản trị viên (Admin)**:
  - Menu quản trị chuyên biệt với badge thông báo số lượng yêu cầu chờ duyệt.
  - Màn hình duyệt / từ chối yêu cầu kèm cảnh báo xung đột lịch trực quan.
  - Quản lý danh mục phòng học (Thêm, Sửa, Xóa, Bật/Tắt bảo trì, chọn thiết bị tiện ích).
  - Báo cáo thống kê toàn diện: tổng lượt mượn, tỷ lệ duyệt theo phòng, biểu đồ xu hướng theo tuần/tháng.
  - Quyền hủy mọi lịch mượn kèm lý do.

### 3. Thuật toán ngăn chặn trùng lịch (Conflict Detection)
- Tự động kiểm tra xung đột thời gian tại cả **frontend** (cảnh báo trực quan khi duyệt) và **backend** (chặn triệt để tại cấp cơ sở dữ liệu với mã lỗi 409):
  $$\text{start}_{\text{mới}} < \text{end}_{\text{đã duyệt}} \quad \text{AND} \quad \text{end}_{\text{mới}} > \text{start}_{\text{đã duyệt}}$$

### 4. Chuẩn màu trạng thái thống nhất
- 🟡 **Vàng**: Chờ duyệt (`pending`)
- 🟢 **Xanh lá**: Đã duyệt (`approved`)
- 🔴 **Đỏ**: Từ chối (`rejected`)
- ⚪ **Xám**: Đã hủy (`cancelled`)

---

## 🔑 Tài Khoản Trải Nghiệm (Demo Credentials)

| Vai trò | Tên đăng nhập / MSSV | Mật khẩu | Họ và tên |
| :--- | :--- | :--- | :--- |
| **Quản trị viên** | `admin` | `admin123` | Quản trị viên |
| **Sinh viên 1** | `SV2024001` (hoặc `user1`) | `user123` | Nguyễn Văn A |
| **Sinh viên 2** | `SV2024002` (hoặc `user2`) | `user123` | Trần Thị B |
| **Google / Facebook** | Bấm nút Google hoặc Facebook trên màn hình đăng nhập | Tự động | Đăng nhập một chạm |

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend**: React 18, React Router v6, Tailwind CSS, Lucide React, date-fns, Axios.
- **Backend**: Node.js, Express, sql.js (SQLite embedded), JWT, bcryptjs, CORS.
- **Tập tin cơ sở dữ liệu**: Tự động lưu và đồng bộ tại `database.sqlite`.

---

## 💻 Hướng Dẫn Khởi Chạy

Ứng dụng hiện đang được chạy sẵn ở cổng `3001` (phục vụ cả API và giao diện):

- **Truy cập ứng dụng**: [http://localhost:3001](http://localhost:3001)

Nếu muốn khởi chạy môi trường phát triển (Hot-reload):
```powershell
# Chạy cả Backend và Frontend dev server cùng lúc:
npm run dev

# Hoặc chạy riêng:
npm run dev:server   # Backend tại http://localhost:3001
npm run dev:client   # Frontend Vite tại http://localhost:5173
```
