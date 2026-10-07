import express from 'express';
import db from '../database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

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

router.post('/', (req, res) => {
  const { room_id, start_time, end_time, purpose } = req.body;
  
  if (!room_id || !start_time || !end_time || !purpose) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
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
    INSERT INTO bookings (room_id, user_id, start_time, end_time, purpose)
    VALUES (?, ?, ?, ?, ?)
  `);

  try {
    const result = stmt.run(room_id, req.user.id, start_time, end_time, purpose);
    const newBookingId = result.lastInsertRowid;

    // Tạo thông báo cho Quản trị viên về yêu cầu mượn phòng mới
    try {
      const room = db.prepare('SELECT name FROM rooms WHERE id = ?').get(room_id);
      const user = db.prepare('SELECT full_name, student_id FROM users WHERE id = ?').get(req.user.id);
      const borrowerDesc = user?.student_id ? `${user.full_name} (${user.student_id})` : (user?.full_name || 'Người dùng');
      const dateText = start_time.includes('T') ? start_time.split('T')[0] : start_time.substring(0, 10);
      
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
    res.status(500).json({ error: 'Lỗi khi tạo đặt phòng' });
  }
});

router.put('/:id/approve', requireAdmin, (req, res) => {
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

  db.prepare(`
    UPDATE bookings 
    SET status = 'approved', reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.user.id, bookingId);

  // Tạo thông báo cho người mượn phòng
  try {
    const room = db.prepare('SELECT name FROM rooms WHERE id = ?').get(booking.room_id);
    db.prepare(`
      INSERT INTO notifications (user_id, recipient_role, title, message, type, booking_id, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
    `).run(
      booking.user_id,
      'user',
      'Yêu cầu mượn phòng đã được phê duyệt',
      `Yêu cầu mượn ${room?.name || 'phòng'} của bạn đã được quản trị viên phê duyệt thành công. Phòng đã được giữ cho bạn.`,
      'approved',
      bookingId
    );
  } catch (e) {
    console.error('Lỗi tạo thông báo duyệt:', e);
  }

  res.json({ message: 'Đã duyệt yêu cầu đặt phòng' });
});

router.put('/:id/reject', requireAdmin, (req, res) => {
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

  // Tạo thông báo cho người mượn phòng kèm lý do từ chối
  try {
    const room = db.prepare('SELECT name FROM rooms WHERE id = ?').get(booking.room_id);
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

  // Tạo thông báo hủy phòng
  try {
    const room = db.prepare('SELECT name FROM rooms WHERE id = ?').get(booking.room_id);
    if (req.user.role !== 'admin') {
      // Người mượn hủy -> Báo cho Admin
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
      // Admin hủy -> Báo cho Người mượn
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

  res.json({ message: 'Đã hủy lịch đặt phòng' });
});

export default router;
