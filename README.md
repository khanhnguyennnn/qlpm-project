# QLPH - Hệ Thống Quản Lý Mượn Phòng Học (SEEE · HUST SINCE 1956)

Ứng dụng web toàn diện dành cho trường học và trung tâm đào tạo giúp số hóa quy trình mượn phòng học, ngăn chặn triệt để tình trạng trùng lặp lịch, cung cấp lịch tuần trực quan, hệ thống tiếp đón điểm danh bằng mã PIN và nhật ký kiểm toán hệ thống.

---

## 🚀 Tính Năng Chính Được Nâng Cấp Toàn Diện

### 1. Đăng ký & Đăng nhập & Khôi phục mật khẩu (Production-Ready)
- **Tạo tài khoản sinh viên**: Nhập trực tiếp **Mã số sinh viên (MSSV)**, Họ tên, Email, Số điện thoại và Mật khẩu. Hệ thống tự động kiểm tra trùng lặp và đăng nhập ngay khi tạo thành công.
- **Đăng nhập linh hoạt**: Hỗ trợ đăng nhập bằng **Mã số sinh viên (MSSV)** (VD: `SV2024001`) hoặc **Tên đăng nhập** (VD: `user1`, `admin`) cùng mật khẩu.
- **Khôi phục mật khẩu OTP 6 số**: Cơ chế quên mật khẩu bảo mật gửi mã OTP 6 số (hết hạn sau 15 phút) qua email sinh viên để đặt lại mật khẩu mới an toàn.
- **Đăng nhập một chạm qua Google & Facebook**: Tự động tạo và liên kết tài khoản sinh viên khi xác thực qua tài khoản Google hoặc Facebook.

### 2. Thông báo Email Tự Động (Email Notifications)
- Tích hợp dịch vụ email thông báo HTML chuẩn giao diện Bách Khoa:
  - 📩 Gửi email xác nhận ngay khi sinh viên nộp đơn mượn phòng.
  - 📩 Gửi email phê duyệt kèm **Mã PIN Tiếp đón (HUST-XXXX)** khi hội đồng duyệt.
  - 📩 Gửi email giải thích lý do cụ thể khi yêu cầu bị từ chối.
  - 📩 Gửi mã OTP xác minh khôi phục mật khẩu.
  - *Chế độ DEV: Tự động ghi log mô phỏng email trực tiếp tại terminal nếu chưa cấu hình SMTP.*

### 3. Tiếp Đón & Điểm Danh Nhận Phòng (Check-in Verification)
- Mỗi đơn mượn khi được duyệt sẽ được cấp một **Mã PIN Tiếp đón độc nhất** dạng `HUST-XXXX`.
- Sinh viên có thể xuất trình mã PIN này trên trang **Lịch sử của tôi**.
- Quản trị viên / Nhân viên trực phòng có tab **Điểm danh & Tiếp đón** để tra cứu mã PIN/MSSV và bấm **Xác nhận Check-in** lưu vết thời gian thực.

### 4. Hạn Ngạch Chống Spam & Tải Văn Bản Đính Kèm
- **Hạn ngạch sinh viên**: Mỗi sinh viên chỉ được gửi tối đa **3 đơn mượn phòng chờ duyệt** cùng lúc nhằm ngăn chặn hành vi giữ chỗ ảo.
- **Đính kèm tài liệu**: Hỗ trợ đính kèm liên kết đề xuất (Google Drive, OneDrive, PDF) cho các buổi báo cáo, hội thảo cần phê duyệt đặc biệt.

### 5. Nhật Ký Kiểm Toán Hệ Thống (Audit Trail)
- Lưu vết toàn bộ các thao tác trọng yếu vào bảng `audit_logs`: ai đã duyệt, từ chối, hủy đơn, điểm danh nhận phòng, hoặc khôi phục mật khẩu.
- Giao diện Admin có tab **Nhật ký hệ thống** trực quan, minh bạch.

### 6. An Toàn & Bảo Mật Chuẩn Doanh Nghiệp
- **Helmet**: Tăng cường bảo mật HTTP headers, chống clickjacking và sniffing.
- **Rate Limiting**: Giới hạn tần suất gọi API đăng nhập và khôi phục mật khẩu chống brute-force.
- **Health Check Probes**: Cung cấp `/health` và `/api/health` sẵn sàng cho Render/Railway/Kubernetes monitoring.

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
- **Backend**: Node.js, Express, Helmet, Express-Rate-Limit, Nodemailer, sql.js / PostgreSQL.
- **Deploy**: Sẵn sàng deploy PaaS với cấu hình `render.yaml`, `vercel.json`, `.env.example`.

---

## 💻 Hướng Dẫn Khởi Chạy

```powershell
# Chạy cả Backend và Frontend dev server cùng lúc:
npm run dev

# Build mã nguồn cho môi trường production:
npm run build

# Khởi chạy server production (Node serving dist):
npm start
```

---

## ☁️ Triển Khai Lên Cloud PaaS (Render / Vercel)

1. Sao chép `.env.example` thành `.env` và điền cấu hình (hoặc nhập vào Environment Variables của PaaS).
2. Khi deploy lên **Render**: Chọn *Web Service*, kết nối repo GitHub, chọn cấu hình từ file `render.yaml`.
3. Khi deploy frontend lên **Vercel**: Vercel sẽ tự động đọc `vercel.json` và build Vite dist.
