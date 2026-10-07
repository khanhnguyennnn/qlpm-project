import express from 'express';
import db from '../database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', (req, res) => {
  const { status } = req.query;
  let rooms;
  
  if (status === 'active') {
    rooms = db.prepare("SELECT * FROM rooms WHERE status = 'active' ORDER BY name").all();
  } else {
    rooms = db.prepare("SELECT * FROM rooms ORDER BY name").all();
  }
  
  // Parse JSON equipment
  rooms.forEach(room => {
    try {
      room.equipment = JSON.parse(room.equipment);
    } catch {
      room.equipment = [];
    }
  });
  
  res.json(rooms);
});

router.get('/:id', (req, res) => {
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);
  if (!room) return res.status(404).json({ error: 'Không tìm thấy phòng' });
  
  try {
    room.equipment = JSON.parse(room.equipment);
  } catch {
    room.equipment = [];
  }

  const upcomingBookings = db.prepare(`
    SELECT b.*, u.full_name as user_name 
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    WHERE b.room_id = ? AND b.end_time >= datetime('now') AND b.status IN ('approved', 'pending')
    ORDER BY b.start_time ASC
  `).all(req.params.id);

  room.upcoming_bookings = upcomingBookings;
  res.json(room);
});

router.post('/', requireAdmin, (req, res) => {
  const { name, capacity, location, equipment, status, description } = req.body;
  if (!name || !capacity) {
    return res.status(400).json({ error: 'Tên phòng và sức chứa là bắt buộc' });
  }

  const equipmentStr = typeof equipment === 'string' ? equipment : JSON.stringify(equipment || []);

  const stmt = db.prepare(`
    INSERT INTO rooms (name, capacity, location, equipment, status, description)
    VALUES (?, ?, ?, ?, COALESCE(?, 'active'), ?)
  `);

  try {
    const result = stmt.run(name, capacity, location, equipmentStr, status, description);
    res.status(201).json({ message: 'Tạo phòng thành công', id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi tạo phòng' });
  }
});

router.put('/:id', requireAdmin, (req, res) => {
  const { name, capacity, location, equipment, status, description } = req.body;
  const equipmentStr = typeof equipment === 'string' ? equipment : JSON.stringify(equipment || []);

  const stmt = db.prepare(`
    UPDATE rooms 
    SET name = ?, capacity = ?, location = ?, equipment = ?, status = ?, description = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  const result = stmt.run(name, capacity, location, equipmentStr, status, description, req.params.id);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Không tìm thấy phòng' });
  }
  
  res.json({ message: 'Cập nhật phòng thành công' });
});

router.delete('/:id', requireAdmin, (req, res) => {
  // Check for future bookings
  const futureBookings = db.prepare(`
    SELECT COUNT(*) as count FROM bookings 
    WHERE room_id = ? AND end_time >= datetime('now') AND status IN ('pending', 'approved')
  `).get(req.params.id);

  if (futureBookings.count > 0) {
    return res.status(400).json({ error: 'Không thể xóa phòng vì có lịch đặt sắp tới' });
  }

  const result = db.prepare('DELETE FROM rooms WHERE id = ?').run(req.params.id);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Không tìm thấy phòng' });
  }
  
  res.json({ message: 'Xóa phòng thành công' });
});

export default router;
