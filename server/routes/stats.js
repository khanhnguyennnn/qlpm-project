import express from 'express';
import db from '../database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken, requireAdmin);

router.get('/overview', (req, res) => {
  const { from, to } = req.query;

  const totalRoomsRes = db.prepare('SELECT COUNT(*) as count FROM rooms').get();
  const totalRooms = totalRoomsRes ? totalRoomsRes.count : 0;
  
  const totalBookingsThisMonthRes = db.prepare(`
    SELECT COUNT(*) as count FROM bookings 
    WHERE strftime('%Y-%m', start_time) = strftime('%Y-%m', 'now')
  `).get();
  const totalBookingsThisMonth = totalBookingsThisMonthRes ? totalBookingsThisMonthRes.count : 0;

  const pendingBookingsRes = db.prepare(`
    SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'
  `).get();
  const pendingBookings = pendingBookingsRes ? pendingBookingsRes.count : 0;

  const approvedTodayRes = db.prepare(`
    SELECT COUNT(*) as count FROM bookings 
    WHERE status = 'approved' AND date(start_time) = date('now')
  `).get();
  const approvedToday = approvedTodayRes ? approvedTodayRes.count : 0;

  // If date range is provided for stats cards:
  let rangeQuery = "SELECT status, COUNT(*) as count FROM bookings WHERE 1=1";
  const params = [];
  if (from) {
    rangeQuery += " AND substr(start_time, 1, 10) >= ?";
    params.push(from);
  }
  if (to) {
    rangeQuery += " AND substr(start_time, 1, 10) <= ?";
    params.push(to);
  }
  rangeQuery += " GROUP BY status";
  const rangeStats = db.prepare(rangeQuery).all(...params);

  let approvedCount = 0;
  let rejectedCount = 0;
  let cancelledCount = 0;
  let pendingCount = 0;
  let totalCount = 0;

  rangeStats.forEach(r => {
    totalCount += r.count;
    if (r.status === 'approved') approvedCount = r.count;
    if (r.status === 'rejected') rejectedCount = r.count;
    if (r.status === 'cancelled') cancelledCount = r.count;
    if (r.status === 'pending') pendingCount = r.count;
  });

  res.json({
    total_rooms: totalRooms,
    totalRooms: totalRooms,
    total_bookings_this_month: totalBookingsThisMonth,
    pending_bookings: pendingBookings,
    pendingCount: pendingBookings,
    approved_today: approvedToday,
    todayApproved: approvedToday,
    total: totalCount,
    approved: approvedCount,
    rejected: rejectedCount,
    cancelled: cancelledCount,
    pending: pendingCount
  });
});

router.get('/by-room', (req, res) => {
  const { from, to } = req.query;
  
  let query = `
    SELECT 
      r.name as room_name,
      COUNT(b.id) as total_count,
      COUNT(b.id) as total,
      SUM(CASE WHEN b.status = 'approved' THEN 1 ELSE 0 END) as approved_count,
      SUM(CASE WHEN b.status = 'approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN b.status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
      SUM(CASE WHEN b.status = 'rejected' THEN 1 ELSE 0 END) as rejected,
      SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count,
      SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
    FROM rooms r
    LEFT JOIN bookings b ON r.id = b.room_id
  `;
  const params = [];
  
  if (from && to) {
    query += ` AND substr(b.start_time, 1, 10) >= ? AND substr(b.start_time, 1, 10) <= ?`;
    params.push(from, to);
  } else if (from) {
    query += ` AND substr(b.start_time, 1, 10) >= ?`;
    params.push(from);
  } else if (to) {
    query += ` AND substr(b.start_time, 1, 10) <= ?`;
    params.push(to);
  }

  query += ` GROUP BY r.id ORDER BY total DESC`;

  const stats = db.prepare(query).all(...params);
  res.json(stats);
});

router.get('/by-period', (req, res) => {
  const { group, from, to } = req.query;
  
  let dateFormat = '%Y-W%W';
  if (group === 'month') {
    dateFormat = '%Y-%m';
  }

  let query = `
    SELECT 
      strftime(?, start_time) as period,
      COUNT(*) as count
    FROM bookings
    WHERE 1=1
  `;
  const params = [dateFormat];

  if (from) {
    query += ` AND substr(start_time, 1, 10) >= ?`;
    params.push(from);
  }
  if (to) {
    query += ` AND substr(start_time, 1, 10) <= ?`;
    params.push(to);
  }

  query += ` GROUP BY period ORDER BY period ASC`;

  const stats = db.prepare(query).all(...params);
  res.json(stats);
});

router.get('/summary', (req, res) => {
  const { from, to } = req.query;
  
  let query = `
    SELECT status, COUNT(*) as count
    FROM bookings
    WHERE 1=1
  `;
  const params = [];

  if (from) {
    query += ` AND substr(start_time, 1, 10) >= ?`;
    params.push(from);
  }
  if (to) {
    query += ` AND substr(start_time, 1, 10) <= ?`;
    params.push(to);
  }

  query += ` GROUP BY status`;
  
  const stats = db.prepare(query).all(...params);
  const result = {
    total: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    pending: 0
  };
  
  stats.forEach(row => {
    if (result[row.status] !== undefined) {
      result[row.status] = row.count;
      result.total += row.count;
    }
  });

  res.json(result);
});

export default router;
