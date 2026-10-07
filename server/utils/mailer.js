import nodemailer from 'nodemailer';

// Cấu hình transporter (nếu có biến môi trường SMTP)
let transporter = null;

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('[Mailer] Đã kích hoạt hệ thống gửi email qua SMTP:', process.env.SMTP_HOST);
  } catch (err) {
    console.error('[Mailer] Không thể khởi tạo SMTP transporter:', err);
  }
} else {
  console.log('[Mailer] Chế độ DEV: Email sẽ được mô phỏng và hiển thị tại console');
}

/**
 * Gửi email chung
 */
export async function sendEmail({ to, subject, html, text }) {
  if (!to) return false;

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Hệ thống QLPH SEEE - ĐH Bách Khoa Hà Nội" <qlph@hust.edu.vn>',
    to,
    subject,
    html,
    text: text || subject
  };

  if (transporter) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`[Mailer] Đã gửi email tới ${to} (MessageId: ${info.messageId})`);
      return true;
    } catch (error) {
      console.error(`[Mailer] Lỗi gửi email tới ${to}:`, error.message);
      return false;
    }
  } else {
    // Chế độ mô phỏng hiển thị trên log
    console.log('\n================== ✉️ MÔ PHỎNG EMAIL GỬI ĐI ==================');
    console.log(`Gửi tới: ${to}`);
    console.log(`Tiêu đề: ${subject}`);
    console.log(`Nội dung tóm tắt:\n${text || html.replace(/<[^>]+>/g, '').slice(0, 300)}...`);
    console.log('===============================================================\n');
    return true;
  }
}

/**
 * Gửi email xác nhận đã nộp đơn đăng ký mượn phòng
 */
export async function sendBookingCreatedEmail({ user, room, booking }) {
  if (!user.email) return;

  const subject = `[QLPH HUST] Xác nhận tiếp nhận đơn mượn phòng ${room.name}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="text-align: center; padding-bottom: 15px; border-bottom: 2px solid #990000;">
        <h2 style="color: #990000; margin: 0;">TRƯỜNG ĐIỆN - ĐIỆN TỬ · ĐH BÁCH KHOA HÀ NỘI</h2>
        <p style="color: #64748b; font-size: 13px; margin: 5px 0 0 0;">HỆ THỐNG QUẢN LÝ PHÒNG HỌC QLPH</p>
      </div>

      <div style="padding: 20px 0;">
        <p>Xin chào <strong>${user.full_name}</strong> (${user.student_id ? 'MSSV: ' + user.student_id : user.username}),</p>
        <p>Hệ thống đã tiếp nhận yêu cầu đăng ký mượn phòng học của bạn với thông tin chi tiết như sau:</p>

        <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0; background: #f8fafc; width: 140px;"><strong>Phòng học:</strong></td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">${room.name} (${room.location || 'Khuôn viên Bách Khoa'})</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0; background: #f8fafc;"><strong>Thời gian:</strong></td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">${booking.start_time} đến ${booking.end_time}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0; background: #f8fafc;"><strong>Mục đích:</strong></td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">${booking.purpose}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0; background: #f8fafc;"><strong>Trạng thái:</strong></td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; color: #d97706; font-weight: bold;">Đang chờ hội đồng thẩm định</td>
          </tr>
        </table>

        <p style="font-size: 13px; color: #64748b;">
          Đơn của bạn đang được ban quản lý cơ sở vật chất xét duyệt. Kết quả sẽ được gửi tự động qua email này.
        </p>
      </div>

      <div style="font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center;">
        Văn phòng Trường Điện - Điện Tử: Nhà C9, Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội · Hotline: (024) 3869 2463
      </div>
    </div>
  `;

  return sendEmail({ to: user.email, subject, html });
}

/**
 * Gửi email khi đơn mượn phòng ĐƯỢC DUYỆT (Kèm mã Check-in)
 */
export async function sendBookingApprovedEmail({ user, room, booking, checkinCode }) {
  if (!user.email) return;

  const subject = `[QLPH HUST] Chúc mừng! Đơn mượn phòng ${room.name} ĐÃ ĐƯỢC DUYỆT`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="text-align: center; padding-bottom: 15px; border-bottom: 2px solid #16a34a;">
        <h2 style="color: #990000; margin: 0;">TRƯỜNG ĐIỆN - ĐIỆN TỬ · ĐH BÁCH KHOA HÀ NỘI</h2>
        <p style="color: #16a34a; font-size: 14px; font-weight: bold; margin: 5px 0 0 0;">✓ THÔNG BÁO PHÊ DUYỆT LỊCH MƯỢN PHÒNG</p>
      </div>

      <div style="padding: 20px 0;">
        <p>Xin chào <strong>${user.full_name}</strong>,</p>
        <p>Yêu cầu mượn giảng đường của bạn đã được <strong>PHÊ DUYỆT THÀNH CÔNG</strong>.</p>

        <!-- Khung Mã Check-in -->
        <div style="background: #f0fdf4; border: 2px dashed #16a34a; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <div style="font-size: 12px; font-weight: bold; color: #166534; text-transform: uppercase; letter-spacing: 1px;">MÃ CHECK-IN NHẬN PHÒNG HỌC</div>
          <div style="font-size: 28px; font-weight: bold; color: #15803d; letter-spacing: 4px; margin: 8px 0; font-family: monospace;">${checkinCode || 'HUST-OK'}</div>
          <p style="font-size: 12px; color: #166534; margin: 0;">Xuất trình mã này cho cán bộ quản trị hoặc trực phòng để nhận chìa khóa/thiết bị</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0; background: #f8fafc; width: 140px;"><strong>Phòng học:</strong></td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">${room.name} (${room.location || 'Khuôn viên Bách Khoa'})</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0; background: #f8fafc;"><strong>Thời gian:</strong></td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">${booking.start_time} đến ${booking.end_time}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0; background: #f8fafc;"><strong>Mục đích:</strong></td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">${booking.purpose}</td>
          </tr>
        </table>

        <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 10px; font-size: 13px; color: #b45309; margin-top: 15px;">
          <strong>Lưu ý:</strong> Vui lòng có mặt đúng giờ và giữ gìn vệ sinh, cơ sở vật chất phòng học theo đúng nội quy của ĐH Bách Khoa Hà Nội.
        </div>
      </div>

      <div style="font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center;">
        Văn phòng Trường Điện - Điện Tử: Nhà C9, Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội · Hotline: (024) 3869 2463
      </div>
    </div>
  `;

  return sendEmail({ to: user.email, subject, html });
}

/**
 * Gửi email khi đơn mượn phòng BỊ TỪ CHỐI
 */
export async function sendBookingRejectedEmail({ user, room, booking, reason }) {
  if (!user.email) return;

  const subject = `[QLPH HUST] Thông báo từ chối đơn mượn phòng ${room.name}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="text-align: center; padding-bottom: 15px; border-bottom: 2px solid #dc2626;">
        <h2 style="color: #990000; margin: 0;">TRƯỜNG ĐIỆN - ĐIỆN TỬ · ĐH BÁCH KHOA HÀ NỘI</h2>
        <p style="color: #dc2626; font-size: 14px; font-weight: bold; margin: 5px 0 0 0;">THÔNG BÁO TỪ CHỐI YÊU CẦU MƯỢN PHÒNG</p>
      </div>

      <div style="padding: 20px 0;">
        <p>Xin chào <strong>${user.full_name}</strong>,</p>
        <p>Rất tiếc, yêu cầu mượn phòng <strong>${room.name}</strong> (${booking.start_time}) chưa thể phê duyệt với lý do sau:</p>

        <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; color: #991b1b; font-size: 14px; margin: 15px 0;">
          <strong>Lý do từ chối từ Ban Quản Trị:</strong><br />
          ${reason || 'Phòng học có lịch hoạt động đột xuất của nhà trường hoặc trùng lịch ưu tiên.'}
        </div>

        <p style="font-size: 13px; color: #475569;">
          Bạn có thể truy cập hệ thống để tra cứu các phòng học trống khác hoặc liên hệ văn phòng C9 để được hỗ trợ sắp xếp.
        </p>
      </div>

      <div style="font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center;">
        Văn phòng Trường Điện - Điện Tử: Nhà C9, Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội · Hotline: (024) 3869 2463
      </div>
    </div>
  `;

  return sendEmail({ to: user.email, subject, html });
}

/**
 * Gửi email đặt lại mật khẩu (OTP / Link)
 */
export async function sendPasswordResetEmail({ user, resetToken, resetCode }) {
  if (!user.email) return;

  const subject = `[QLPH HUST] Mã OTP khôi phục mật khẩu tài khoản`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="text-align: center; padding-bottom: 15px; border-bottom: 2px solid #990000;">
        <h2 style="color: #990000; margin: 0;">TRƯỜNG ĐIỆN - ĐIỆN TỬ · ĐH BÁCH KHOA HÀ NỘI</h2>
        <p style="color: #64748b; font-size: 13px; margin: 5px 0 0 0;">YÊU CẦU ĐẶT LẠI MẬT KHẨU TÀI KHOẢN</p>
      </div>

      <div style="padding: 20px 0; text-align: center;">
        <p style="text-align: left;">Xin chào <strong>${user.full_name}</strong>,</p>
        <p style="text-align: left;">Hệ thống nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với email này. Sử dụng mã OTP dưới đây để hoàn tất:</p>

        <div style="background: #f8fafc; border: 1px solid #cbd5e1; display: inline-block; padding: 12px 30px; border-radius: 8px; margin: 15px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; font-family: monospace; color: #0f172a;">${resetCode}</span>
        </div>

        <p style="font-size: 12px; color: #64748b; margin-top: 10px;">
          Mã OTP có hiệu lực trong vòng <strong>15 phút</strong>. Nếu bạn không yêu cầu hành động này, vui lòng bỏ qua email.
        </p>
      </div>

      <div style="font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center;">
        Văn phòng Trường Điện - Điện Tử · ĐH Bách Khoa Hà Nội
      </div>
    </div>
  `;

  return sendEmail({ to: user.email, subject, html });
}
