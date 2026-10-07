import express from 'express';
import db, { addAuditLog } from '../database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { 
  sendBookingCreatedEmail, 
  sendBookingApprovedEmail, 
  sendBookingRejectedEmail 
} from '../utils/mailer.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/', (req, res) => {
  const { status, room_id, user_id, my, from, to, date } = req.query;
  
  let query = `
    SELECT b.*, r.name as room_name, u.full_name as user_name 
    FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    JOIN users u ON b.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ` AND b.status = ?`;
    params.push(status);
  }
  if (room_id) {
    query += ` AND b.room_id = ?`;
    params.push(room_id);
  }
  if (user_id) {
    query += ` AND b.user_id = ?`;
    params.push(user_id);
  }
  if (my === 'true') {
    query += ` AND b.user_id = ?`;
    params.push(req.user.id);
  }
  if (date) {
    query += ` AND substr(b.start_time, 1, 10) = ?`;
    params.push(date);
  }
  if (from) {
    query += ` AND b.start_time >= ?`;
    params.push(from);
  }
  if (to) {
    query += ` AND b.end_time <= ?`;
    params.push(to);
  }

  query += ` ORDER BY b.start_time DESC`;

  const bookings = db.prepare(query).all(...params);
  res.json(bookings);
});

router.get('/calendar', (req, res) => {
  const { room_id, week_start } = req.query;
  
  let query = `
    SELECT b.*, r.name as room_name, u.full_name as user_name 
    FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    JOIN users u ON b.user_id = u.id
    WHERE b.status IN ('approved', 'pending')
  `;
  const params = [];

  if (room_id) {
    query += ` AND b.room_id = ?`;
    params.push(room_id);
  }
  
  if (week_start) {
    const startDate = new Date(week_start);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);
    const startStr = week_start.substring(0, 10);
    const endStr = endDate.toISOString().substring(0, 10);
    
    query += ` AND substr(b.start_time, 1, 10) >= ? AND substr(b.start_time, 1, 10) <= ?`;
    params.push(startStr, endStr);
  }

  query += ` ORDER BY b.start_time ASC`;

  const bookings = db.prepare(query).all(...params);
  res.json(bookings);
});

router.post('/', async (req, res) => {
  const { room_id, start_time, end_time, purpose, document_url } = req.body;
  
  if (!room_id || !start_time || !end_time || !purpose) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
  }

  // Quota check: tối đa 3 yêu cầu pending cho sinh viên
  if (req.user.role !== 'admin') {
    const pendingCountRes = db.prepare('SELECT count(*) as count FROM bookings WHERE user_id = ? AND status = "pending"').get(req.user.id);
    if (pendingCountRes && pendingCountRes.count >= 3) {
      return res.status(400).json({ 
        error: 'Bạn đang có 3 yêu cầu mượn phòng đang chờ duyệt. Vui lòng đợi quản trị viên thẩm định trước khi tạo thêm đơn mới.' 
      });
    }
  }

  // Conflict check
  const conflict = db.prepare(`
    SELECT * FROM bookings
    WHERE room_id = ? AND status = 'approved' AND start_time < ? AND end_time > ?
  `).get(room_id, end_time, start_time);

  if (conflict) {
    return res.status(409).json({ error: 'Phòng đã được đặt trong khoảng thời gian này' });
  }

  const stmt = db.prepare(`
    INSERT INTO bookings (room_id, user_id, start_time, end_time, purpose, document_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  try {
    const result = stmt.run(room_id, req.user.id, start_time, end_time, purpose, document_url || null);
    const newBookingId = result.lastInsertRowid;

    const room = db.prepare('SELECT name, location FROM rooms WHERE id = ?').get(room_id);
    const user = db.prepare('SELECT full_name, student_id, email, username FROM users WHERE id = ?').get(req.user.id);
    const borrowerDesc = user?.student_id ? `${user.full_name} (${user.student_id})` : (user?.full_name || 'Người dùng');
    const dateText = start_time.includes('T') ? start_time.split('T')[0] : start_time.substring(0, 10);

    // Gửi email biên nhận tiếp nhận đơn
    if (user?.email) {
      sendBookingCreatedEmail({ 
        user, 
        room: room || { name: 'Phòng học HUST' }, 
        booking: { start_time, end_time, purpose } 
      }).catch(err => console.error('[Mailer] Lỗi gửi email tạo đơn:', err));
    }

    // Ghi nhật ký Audit Log
    addAuditLog({
      userId: req.user.id,
      userName: user?.full_name || req.user.username,
      action: 'Tạo đơn mượn phòng mới',
      entityType: 'Booking',
      entityId: newBookingId,
      details: `Đăng ký mượn ${room?.name} từ ${start_time} đến ${end_time}. Mục đích: ${purpose}`
    });

    // Tạo thông báo cho Quản trị viên
    try {
      db.prepare(`
        INSERT INTO notifications (user_id, recipient_role, title, message, type, booking_id, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
      `).run(
        null,
        'admin',
        'Yêu cầu mượn phòng mới chờ duyệt',
        `${borrowerDesc} vừa gửi yêu cầu mượn ${room?.name || 'phòng'} vào ngày ${dateText}. Mục đích: "${purpose}". Vui lòng xem xét phê duyệt.`,
        'new_booking',
        newBookingId
      );
    } catch (notifErr) {
      console.error('Lỗi khi tạo thông báo đặt phòng:', notifErr);
    }

    res.status(201).json({ message: 'Tạo yêu cầu đặt phòng thành công', id: newBookingId });
  } catch (error) {
    console.error('Lỗi tạo booking:', error);
    res.status(500).json({ error: 'Lỗi khi tạo đặt phòng' });
  }
});

router.put('/:id/approve', requireAdmin, async (req, res) => {
  const bookingId = req.params.id;
  
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
  if (!booking) return res.status(404).json({ error: 'Không tìm thấy đặt phòng' });

  // Re-check conflict
  const conflict = db.prepare(`
    SELECT * FROM bookings
    WHERE room_id = ? AND status = 'approved' AND id != ? AND start_time < ? AND end_time > ?
  `).get(booking.room_id, bookingId, booking.end_time, booking.start_time);

  if (conflict) {
    return res.status(409).json({ error: 'Phòng đã được đặt trong khoảng thời gian này bởi một yêu cầu khác' });
  }

  // Sinh mã Check-in 6 ký tự ngẫu nhiên (Ví dụ: HUST-5832)
  const checkinCode = 'HUST-' + Math.floor(1000 + Math.random() * 9000);

  db.prepare(`
    UPDATE bookings 
    SET status = 'approved', checkin_code = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(checkinCode, req.user.id, bookingId);

  const room = db.prepare('SELECT name, location FROM rooms WHERE id = ?').get(booking.room_id);
  const borrower = db.prepare('SELECT full_name, email, student_id FROM users WHERE id = ?').get(booking.user_id);

  // Ghi nhật ký Audit Log
  addAuditLog({
    userId: req.user.id,
    userName: req.user.username,
    action: 'Phê duyệt đơn mượn phòng',
    entityType: 'Booking',
    entityId: bookingId,
    details: `Duyệt đơn cho ${borrower?.full_name}. Cấp mã Check-in: ${checkinCode}`
  });

  // Gửi email phê duyệt kèm mã check-in
  if (borrower?.email) {
    sendBookingApprovedEmail({
      user: borrower,
      room: room || { name: 'Phòng học HUST' },
      booking,
      checkinCode
    }).catch(err => console.error('[Mailer] Lỗi gửi email phê duyệt:', err));
  }

  // Tạo thông báo cho người mượn phòng
  try {
    db.prepare(`
      INSERT INTO notifications (user_id, recipient_role, title, message, type, booking_id, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
    `).run(
      booking.user_id,
      'user',
      'Yêu cầu mượn phòng đã được phê duyệt',
      `Yêu cầu mượn ${room?.name || 'phòng'} của bạn đã được phê duyệt thành công. Mã Check-in nhận phòng của bạn là: ${checkinCode}.`,
      'approved',
      bookingId
    );
  } catch (e) {
    console.error('Lỗi tạo thông báo duyệt:', e);
  }

  res.json({ message: 'Đã duyệt yêu cầu đặt phòng', checkin_code: checkinCode });
});

router.put('/:id/reject', requireAdmin, async (req, res) => {
  const { admin_note } = req.body;
  if (!admin_note) {
    return res.status(400).json({ error: 'Vui lòng cung cấp lý do từ chối' });
  }

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Không tìm thấy đặt phòng' });

  const result = db.prepare(`
    UPDATE bookings 
    SET status = 'rejected', admin_note = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(admin_note, req.user.id, req.params.id);

  if (result.changes === 0) return res.status(404).json({ error: 'Không tìm thấy đặt phòng' });

  const room = db.prepare('SELECT name FROM rooms WHERE id = ?').get(booking.room_id);
  const borrower = db.prepare('SELECT full_name, email FROM users WHERE id = ?').get(booking.user_id);

  // Ghi nhật ký Audit Log
  addAuditLog({
    userId: req.user.id,
    userName: req.user.username,
    action: 'Từ chối đơn mượn phòng',
    entityType: 'Booking',
    entityId: booking.id,
    details: `Từ chối đơn của ${borrower?.full_name}. Lý do: "${admin_note}"`
  });

  // Gửi email từ chối kèm lý do
  if (borrower?.email) {
    sendBookingRejectedEmail({
      user: borrower,
      room: room || { name: 'Phòng học HUST' },
      booking,
      reason: admin_note
    }).catch(err => console.error('[Mailer] Lỗi gửi email từ chối:', err));
  }

  // Tạo thông báo cho người mượn phòng
  try {
    db.prepare(`
      INSERT INTO notifications (user_id, recipient_role, title, message, type, booking_id, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
    `).run(
      booking.user_id,
      'user',
      'Yêu cầu mượn phòng bị từ chối',
      `Yêu cầu mượn ${room?.name || 'phòng'} của bạn đã bị từ chối. Lý do: "${admin_note}".`,
      'rejected',
      booking.id
    );
  } catch (e) {
    console.error('Lỗi tạo thông báo từ chối:', e);
  }

  res.json({ message: 'Đã từ chối yêu cầu đặt phòng' });
});

// Xác nhận nhận phòng học (Check-in)
router.put('/:id/checkin', async (req, res) => {
  const { code } = req.body;
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Không tìm thấy đặt phòng' });

  if (booking.status !== 'approved') {
    return res.status(400).json({ error: 'Chỉ có thể check-in đơn mượn đã được phê duyệt' });
  }

  // Nếu người check-in là sinh viên, bắt buộc mã khớp
  if (req.user.role !== 'admin' && booking.checkin_code && code?.trim() !== booking.checkin_code) {
    return res.status(400).json({ error: 'Mã check-in không chính xác' });
  }

  db.prepare(`
    UPDATE bookings 
    SET checked_in_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);

  addAuditLog({
    userId: req.user.id,
    userName: req.user.username,
    action: 'Xác nhận Check-in nhận phòng',
    entityType: 'Booking',
    entityId: booking.id,
    details: `Xác nhận nhận phòng thành công lúc ${new Date().toLocaleTimeString('vi-VN')}`
  });

  res.json({ message: 'Check-in nhận phòng thành công!', checked_in_at: new Date().toISOString() });
});

router.put('/:id/cancel', (req, res) => {
  const { cancel_reason } = req.body;
  if (!cancel_reason) {
    return res.status(400).json({ error: 'Vui lòng cung cấp lý do hủy' });
  }

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Không tìm thấy đặt phòng' });

  if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Không có quyền hủy lịch đặt của người khác' });
  }

  db.prepare(`
    UPDATE bookings 
    SET status = 'cancelled', cancel_reason = ?, cancelled_by = ?, cancelled_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(cancel_reason, req.user.id, req.params.id);

  addAuditLog({
    userId: req.user.id,
    userName: req.user.username,
    action: 'Hủy đơn mượn phòng',
    entityType: 'Booking',
    entityId: booking.id,
    details: `Hủy lịch mượn phòng. Lý do: "${cancel_reason}"`
  });

  // Tạo thông báo hủy phòng
  try {
    const room = db.prepare('SELECT name FROM rooms WHERE id = ?').get(booking.room_id);
    if (req.user.role !== 'admin') {
      const user = db.prepare('SELECT full_name FROM users WHERE id = ?').get(req.user.id);
      db.prepare(`
        INSERT INTO notifications (user_id, recipient_role, title, message, type, booking_id, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
      `).run(
        null,
        'admin',
        'Lịch mượn phòng đã bị hủy',
        `${user?.full_name || 'Người mượn'} đã hủy lịch mượn ${room?.name || 'phòng'}. Lý do: "${cancel_reason}". Phòng đã trở lại trạng thái trống.`,
        'cancelled',
        booking.id
      );
    } else {
      db.prepare(`
        INSERT INTO notifications (user_id, recipient_role, title, message, type, booking_id, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
      `).run(
        booking.user_id,
        'user',
        'Lịch mượn phòng đã bị hủy bởi quản trị viên',
        `Quản trị viên đã hủy lịch mượn ${room?.name || 'phòng'} của bạn. Lý do: "${cancel_reason}".`,
        'cancelled',
        booking.id
      );
    }
  } catch (e) {
    console.error('Lỗi tạo thông báo hủy:', e);
  }

  res.json({ message: 'Đã hủy lịch đặt phòng thành công' });
});

// Lấy danh sách nhật ký kiểm toán hệ thống (Audit Logs cho Admin)
router.get('/audit/logs', requireAdmin, (req, res) => {
  try {
    const logs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100').all();
    res.json(logs);
  } catch (err) {
    console.error('Lỗi lấy audit logs:', err);
    res.status(500).json({ error: 'Không thể lấy dữ liệu nhật ký kiểm toán' });
  }
});

export default router;
