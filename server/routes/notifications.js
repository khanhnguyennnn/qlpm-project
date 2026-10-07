import express from 'express';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

// Lấy danh sách thông báo
router.get('/', (req, res) => {
  const isAdmin = req.user.role === 'admin';

  let query = '';
  let params = [];

  if (isAdmin) {
    query = `
      SELECT * FROM notifications 
      WHERE recipient_role = 'admin' OR user_id = ?
      ORDER BY created_at DESC 
      LIMIT 40
    `;
    params = [req.user.id];
  } else {
    query = `
      SELECT * FROM notifications 
      WHERE user_id = ?
      ORDER BY created_at DESC 
      LIMIT 40
    `;
    params = [req.user.id];
  }

  const notifications = db.prepare(query).all(...params);

  // Đếm số thông báo chưa đọc
  let unreadQuery = '';
  let unreadParams = [];
  if (isAdmin) {
    unreadQuery = `
      SELECT COUNT(*) as count FROM notifications 
      WHERE (recipient_role = 'admin' OR user_id = ?) AND is_read = 0
    `;
    unreadParams = [req.user.id];
  } else {
    unreadQuery = `
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ? AND is_read = 0
    `;
    unreadParams = [req.user.id];
  }

  const unreadRes = db.prepare(unreadQuery).get(...unreadParams);
  const unreadCount = unreadRes ? unreadRes.count : 0;

  res.json({
    notifications,
    unreadCount
  });
});

// Đánh dấu 1 thông báo đã đọc
router.put('/:id/read', (req, res) => {
  db.prepare(`UPDATE notifications SET is_read = 1 WHERE id = ?`).run(req.params.id);
  res.json({ success: true });
});

// Đánh dấu tất cả thông báo đã đọc
router.put('/read-all', (req, res) => {
  if (req.user.role === 'admin') {
    db.prepare(`UPDATE notifications SET is_read = 1 WHERE recipient_role = 'admin' OR user_id = ?`).run(req.user.id);
  } else {
    db.prepare(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`).run(req.user.id);
  }
  res.json({ success: true });
});

export default router;

