import initSqlJs from 'sql.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '..', 'database.sqlite');

const SQL = await initSqlJs();
let rawDb;

if (fs.existsSync(DB_PATH)) {
  try {
    const fileBuffer = fs.readFileSync(DB_PATH);
    rawDb = new SQL.Database(fileBuffer);
  } catch (err) {
    console.error('Error loading existing database, creating fresh one:', err);
    rawDb = new SQL.Database();
  }
} else {
  rawDb = new SQL.Database();
}

function save() {
  try {
    const data = rawDb.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch (err) {
    console.error('Error saving database to file:', err);
  }
}

const db = {
  exec(sql) {
    rawDb.run(sql);
    save();
  },
  prepare(sql) {
    return {
      all(...args) {
        const sanitized = args.map(v => (v === undefined ? null : v));
        const stmt = rawDb.prepare(sql);
        if (sanitized.length > 0) stmt.bind(sanitized);
        const rows = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();
        return rows;
      },
      get(...args) {
        const sanitized = args.map(v => (v === undefined ? null : v));
        const stmt = rawDb.prepare(sql);
        if (sanitized.length > 0) stmt.bind(sanitized);
        let row = undefined;
        if (stmt.step()) {
          row = stmt.getAsObject();
        }
        stmt.free();
        return row;
      },
      run(...args) {
        const sanitized = args.map(v => (v === undefined ? null : v));
        rawDb.run(sql, sanitized);
        const changes = rawDb.getRowsModified();
        const lastIdRes = rawDb.exec('SELECT last_insert_rowid()');
        const lastInsertRowid = lastIdRes?.[0]?.values?.[0]?.[0] || null;
        save();
        return {
          changes,
          lastInsertRowid
        };
      }
    };
  }
};

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    student_id TEXT UNIQUE,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
    provider TEXT DEFAULT 'local',
    provider_id TEXT,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 30,
    location TEXT,
    equipment TEXT DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'maintenance')),
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    purpose TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'cancelled')),
    admin_note TEXT,
    reviewed_by INTEGER,
    reviewed_at DATETIME,
    cancelled_by INTEGER,
    cancelled_at DATETIME,
    cancel_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id),
    FOREIGN KEY (cancelled_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    recipient_role TEXT DEFAULT 'admin',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    booking_id INTEGER,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_name TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migrations for existing databases
try { db.exec("ALTER TABLE users ADD COLUMN student_id TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE users ADD COLUMN provider TEXT DEFAULT 'local';"); } catch (e) {}
try { db.exec("ALTER TABLE users ADD COLUMN provider_id TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE users ADD COLUMN avatar TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE users ADD COLUMN reset_token TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME;"); } catch (e) {}

try { db.exec("ALTER TABLE bookings ADD COLUMN checkin_code TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE bookings ADD COLUMN checked_in_at DATETIME;"); } catch (e) {}
try { db.exec("ALTER TABLE bookings ADD COLUMN document_url TEXT;"); } catch (e) {}

try {
  db.prepare("UPDATE users SET student_id = 'SV2024001' WHERE username = 'user1' AND (student_id IS NULL OR student_id = '')").run();
  db.prepare("UPDATE users SET student_id = 'SV2024002' WHERE username = 'user2' AND (student_id IS NULL OR student_id = '')").run();
  db.prepare("UPDATE users SET student_id = 'ADMIN001' WHERE username = 'admin' AND (student_id IS NULL OR student_id = '')").run();
} catch (e) {}

// Migration: cập nhật danh sách phòng theo bản đồ Đại học Bách Khoa Hà Nội
try {
  const hustRooms = [
    { id: 1, name: 'Hội trường C1 - Đại Cồ Việt', capacity: 150, location: 'Tòa C1 - Tầng 2 (Mặt đường Đại Cồ Việt - Cổng Bắc)', equipment: JSON.stringify(['Máy chiếu', 'Bảng thông minh', 'Điều hòa', 'Loa', 'Micro']), status: 'active', description: 'Hội trường trung tâm C1 quy mô lớn phục vụ giảng dạy, đại hội và hội thảo khoa học' },
    { id: 2, name: 'Hội trường C2', capacity: 120, location: 'Tòa C2 - Tầng 1 (Trục đường Giải Phóng)', equipment: JSON.stringify(['Máy chiếu', 'Bảng thông minh', 'Điều hòa', 'Loa', 'Micro', 'Webcam']), status: 'active', description: 'Hội trường C2 trang bị âm thanh vòm kỹ thuật số và màn chiếu đại sảnh' },
    { id: 3, name: 'Phòng C3-201', capacity: 60, location: 'Tòa C3 - Tầng 2', equipment: JSON.stringify(['Máy tính', 'Máy chiếu', 'Bảng thông minh', 'Điều hòa', 'Loa']), status: 'active', description: 'Phòng thực hành máy tính & lập trình đồ họa chuyên sâu tòa C3' },
    { id: 4, name: 'Phòng C5-102', capacity: 45, location: 'Tòa C5 - Tầng 1', equipment: JSON.stringify(['Bảng thông minh', 'Điều hòa', 'Webcam', 'Màn hình TV']), status: 'maintenance', description: 'Phòng học đa phương tiện đang bảo trì hệ thống điều hòa và kiểm tra thiết bị' },
    { id: 5, name: 'Hội trường Thư viện Tạ Quang Bửu', capacity: 200, location: 'Thư viện Tạ Quang Bửu - Tầng 4 (Trung tâm khuôn viên)', equipment: JSON.stringify(['Máy chiếu', 'Bảng thông minh', 'Điều hòa', 'Loa', 'Micro', 'Webcam', 'Màn hình TV']), status: 'active', description: 'Hội trường danh dự Thư viện Tạ Quang Bửu - Không gian hội thảo và học thuật tiêu chuẩn quốc tế' },
    { id: 6, name: 'Phòng D3-201', capacity: 55, location: 'Tòa D3 - Tầng 2 (Khuôn viên D)', equipment: JSON.stringify(['Máy chiếu', 'Máy tính', 'Điều hòa', 'Webcam', 'Loa']), status: 'active', description: 'Phòng hội thảo chuyên đề trực tuyến và bảo vệ đồ án tốt nghiệp' },
    { id: 7, name: 'Phòng D5-301', capacity: 40, location: 'Tòa D5 - Tầng 3 (Khu D)', equipment: JSON.stringify(['Bảng thông minh', 'Điều hòa', 'Bảng trắng', 'Micro']), status: 'active', description: 'Phòng học nhóm chuyên đề và nghiên cứu khoa học sinh viên' },
    { id: 8, name: 'Giảng đường B1', capacity: 90, location: 'Tòa B1 - Tầng 1 (Khu V - Cổng B8 Trần Đại Nghĩa)', equipment: JSON.stringify(['Máy chiếu', 'Bảng thông minh', 'Điều hòa', 'Loa', 'Micro']), status: 'active', description: 'Giảng đường bậc thang công nghệ cao tòa nhà B1 hình cánh cung biểu tượng' }
  ];

  const updateRoomStmt = db.prepare(`
    UPDATE rooms SET name = ?, capacity = ?, location = ?, equipment = ?, status = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `);
  for (const r of hustRooms) {
    updateRoomStmt.run(r.name, r.capacity, r.location, r.equipment, r.status, r.description, r.id);
  }

  const additionalHustRooms = [
    { name: 'Phòng C4-101', capacity: 50, location: 'Tòa C4 - Tầng 1', equipment: JSON.stringify(['Máy chiếu', 'Điều hòa', 'Loa', 'Bảng trắng']), status: 'active', description: 'Giảng đường tiêu chuẩn sinh viên các ngành kỹ thuật điện - điện tử' },
    { name: 'Phòng LAB C6 (Thí nghiệm Đa ngành)', capacity: 35, location: 'Tòa C6 - Tầng 2 (Gần đường Trần Đại Nghĩa)', equipment: JSON.stringify(['Máy tính', 'Điều hòa', 'Máy chiếu', 'Webcam']), status: 'active', description: 'Phòng thí nghiệm đo lường và phát triển hệ thống nhúng tòa C6' },
    { name: 'Phòng C7-201', capacity: 45, location: 'Tòa C7 - Tầng 2', equipment: JSON.stringify(['Bảng thông minh', 'Điều hòa', 'Máy chiếu', 'Loa']), status: 'active', description: 'Phòng học lý thuyết và thuyết trình đồ án' },
    { name: 'Phòng C8-101', capacity: 55, location: 'Tòa C8 - Tầng 1', equipment: JSON.stringify(['Máy chiếu', 'Điều hòa', 'Loa', 'Bảng trắng']), status: 'active', description: 'Giảng đường học phần cơ sở ngành kỹ thuật' },
    { name: 'Phòng C9-201 (Cổng Parabol)', capacity: 70, location: 'Tòa C9 - Tầng 2 (Mặt đường Giải Phóng - Cạnh Cổng Parabol)', equipment: JSON.stringify(['Máy chiếu', 'Bảng thông minh', 'Điều hòa', 'Loa', 'Micro']), status: 'active', description: 'Phòng học đa phương tiện gần cổng Parabol lịch sử' },
    { name: 'Phòng C10-101', capacity: 40, location: 'Tòa C10 - Tầng 1', equipment: JSON.stringify(['Máy chiếu', 'Điều hòa', 'Bảng trắng']), status: 'active', description: 'Phòng học nhóm và thảo luận chuyên đề sinh viên' },
    { name: 'Hội trường HT', capacity: 110, location: 'Tòa HT (Nối liền giữa C1 và C3)', equipment: JSON.stringify(['Máy chiếu', 'Bảng thông minh', 'Điều hòa', 'Loa', 'Micro']), status: 'active', description: 'Hội trường biểu diễn văn nghệ và sự kiện sinh viên Bách Khoa' },
    { name: 'Viện Nghiên cứu ITIMS - Phòng Seminar', capacity: 35, location: 'Tòa ITIMS (Viện Khoa học & Công nghệ Quốc tế)', equipment: JSON.stringify(['Bảng thông minh', 'Máy chiếu', 'Điều hòa', 'Webcam', 'Màn hình TV']), status: 'active', description: 'Phòng hội thảo chuyên gia Viện ITIMS chuẩn nghiên cứu quốc tế' },
    { name: 'Trung tâm Đào tạo CFC', capacity: 40, location: 'Tòa CFC (Mặt đường Trần Đại Nghĩa)', equipment: JSON.stringify(['Máy tính', 'Máy chiếu', 'Điều hòa', 'Loa']), status: 'active', description: 'Trung tâm đào tạo chứng chỉ công nghệ và nghề nghiệp CFC' },
    { name: 'Tòa D2 - Phòng D2-101', capacity: 50, location: 'Tòa D2 (Gần đường Giải Phóng)', equipment: JSON.stringify(['Máy chiếu', 'Điều hòa', 'Loa', 'Bảng trắng']), status: 'active', description: 'Giảng đường học phần khoa học cơ bản' },
    { name: 'Tòa D4 - Phòng D4-201', capacity: 60, location: 'Tòa D4 (Mặt đường Giải Phóng)', equipment: JSON.stringify(['Máy chiếu', 'Bảng thông minh', 'Điều hòa', 'Loa']), status: 'active', description: 'Phòng học lý thuyết kỹ thuật công nghệ' },
    { name: 'Tòa D6 - Phòng D6-101', capacity: 45, location: 'Tòa D6 (Phía tây Hồ Tiền)', equipment: JSON.stringify(['Máy chiếu', 'Điều hòa', 'Bảng trắng']), status: 'active', description: 'Phòng học và trao đổi học thuật' },
    { name: 'Tòa D7-ITP (Phòng 201)', capacity: 55, location: 'Tòa D7-ITP (Đường Trần Đại Nghĩa)', equipment: JSON.stringify(['Máy chiếu', 'Bảng thông minh', 'Điều hòa', 'Loa', 'Micro']), status: 'active', description: 'Khu liên hợp ươm tạo công nghệ sáng tạo D7-ITP' },
    { name: 'Tòa D8 - Phòng D8-201', capacity: 50, location: 'Tòa D8 (Phía nam khuôn viên D)', equipment: JSON.stringify(['Máy chiếu', 'Điều hòa', 'Bảng trắng', 'Loa']), status: 'active', description: 'Phòng học chuyên ngành kỹ thuật hóa học & môi trường' },
    { name: 'Tòa D9 - Phòng D9-201 (View Hồ Tiền)', capacity: 75, location: 'Tòa D9 - Tầng 2 (Trực diện Hồ Tiền)', equipment: JSON.stringify(['Máy chiếu', 'Bảng thông minh', 'Điều hòa', 'Loa', 'Micro']), status: 'active', description: 'Giảng đường hiện đại view hồ Tiền thoáng đãng và truyền cảm hứng' },
    { name: 'Trung tâm Ngoại ngữ CFL - Phòng Lab', capacity: 35, location: 'Tòa CFL (Cạnh Hồ Tiền)', equipment: JSON.stringify(['Máy tính', 'Điều hòa', 'Máy chiếu', 'Webcam', 'Loa']), status: 'active', description: 'Phòng thực hành khảo thí ngoại ngữ chuẩn quốc tế' },
    { name: 'Viện Đào tạo Quốc tế Việt - Đức VDZ', capacity: 40, location: 'Tòa VDZ (Khu D)', equipment: JSON.stringify(['Bảng thông minh', 'Máy chiếu', 'Điều hòa', 'Loa', 'Webcam']), status: 'active', description: 'Phòng hợp tác đào tạo và giao lưu văn hóa Việt - Đức' },
    { name: 'Tòa PC - Trung tâm Máy tính Thực hành', capacity: 60, location: 'Tòa PC (Khu D)', equipment: JSON.stringify(['Máy tính', 'Máy chiếu', 'Điều hòa', 'Bảng trắng']), status: 'active', description: 'Phòng máy tính cấu hình cao phục vụ đồ án công nghệ thông tin' },
    { name: 'Phòng B6 - B6-101', capacity: 45, location: 'Tòa B6 (Khu B - Đường Trần Đại Nghĩa)', equipment: JSON.stringify(['Máy chiếu', 'Điều hòa', 'Loa', 'Bảng trắng']), status: 'active', description: 'Phòng học lý thuyết khu giảng đường B' },
    { name: 'Phòng B7 - B7-201', capacity: 50, location: 'Tòa B7 (Khu B - Cổng B8)', equipment: JSON.stringify(['Máy chiếu', 'Bảng thông minh', 'Điều hòa', 'Loa']), status: 'active', description: 'Phòng học chuyên ngành kỹ thuật cơ khí' },
    { name: 'Phòng B9 - B9-101', capacity: 40, location: 'Tòa B9 (Khu B)', equipment: JSON.stringify(['Máy chiếu', 'Điều hòa', 'Bảng trắng']), status: 'active', description: 'Phòng học môn kỹ năng và sinh hoạt học thuật' },
    { name: 'Phòng Tư vấn Tuyển sinh Bách Khoa', capacity: 30, location: 'Góc Tuyển sinh - Cổng B8 (Đường Trần Đại Nghĩa)', equipment: JSON.stringify(['Màn hình TV', 'Điều hòa', 'Máy tính', 'Webcam']), status: 'active', description: 'Không gian tiếp đón và tư vấn định hướng tuyển sinh Bách Khoa' },
    { name: 'Phòng Thí nghiệm Trọng điểm PTN', capacity: 30, location: 'Khu PTN (Cuối đường Trần Đại Nghĩa)', equipment: JSON.stringify(['Máy tính', 'Máy chiếu', 'Điều hòa', 'Bảng thông minh']), status: 'active', description: 'Phòng thí nghiệm nghiên cứu phát triển trọng điểm' }
  ];

  const insertRoomStmt = db.prepare(`
    INSERT INTO rooms (name, capacity, location, equipment, status, description) VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const r of additionalHustRooms) {
    const existing = db.prepare('SELECT id FROM rooms WHERE name = ?').get(r.name);
    if (!existing) {
      insertRoomStmt.run(r.name, r.capacity, r.location, r.equipment, r.status, r.description);
    }
  }
} catch (e) {
  console.error("Migration HUST rooms error:", e);
}

// Seed notifications if empty
try {
  const notifCount = db.prepare('SELECT COUNT(*) as count FROM notifications').get()?.count || 0;
  if (notifCount === 0) {
    db.prepare(`
      INSERT INTO notifications (user_id, recipient_role, title, message, type, booking_id, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
    `).run(
      null,
      'admin',
      'Yêu cầu mượn phòng mới chờ duyệt',
      'Sinh viên Trần Thị B vừa gửi yêu cầu mượn Hội trường C2 vào ngày 06/10/2026 (13:30 - 15:30). Vui lòng phê duyệt.',
      'new_booking',
      2
    );
    db.prepare(`
      INSERT INTO notifications (user_id, recipient_role, title, message, type, booking_id, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
    `).run(
      null,
      'admin',
      'Yêu cầu mượn phòng mới chờ duyệt',
      'Sinh viên Trần Thị B vừa gửi yêu cầu mượn Phòng D3-201 vào ngày 09/10/2026 (09:00 - 11:30). Vui lòng phê duyệt.',
      'new_booking',
      7
    );
  }
} catch (e) {
  console.error("Seed notifications error:", e);
}

// Seed data if empty
const userCountRes = db.prepare('SELECT COUNT(*) as count FROM users').get();
const userCount = userCountRes ? userCountRes.count : 0;

if (userCount === 0) {
  const hashPassword = (pw) => bcrypt.hashSync(pw, 10);

  const insertUser = db.prepare(`
    INSERT INTO users (username, student_id, password, full_name, email, role, provider)
    VALUES (?, ?, ?, ?, ?, ?, 'local')
  `);

  insertUser.run('admin', 'ADMIN001', hashPassword('admin123'), 'Quản trị viên', 'admin@example.com', 'admin');
  insertUser.run('user1', 'SV2024001', hashPassword('user123'), 'Nguyễn Văn A', 'usera@example.com', 'user');
  insertUser.run('user2', 'SV2024002', hashPassword('user123'), 'Trần Thị B', 'userb@example.com', 'user');

  const insertRoom = db.prepare(`
    INSERT INTO rooms (name, capacity, location, equipment, status, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertRoom.run('Hội trường C1 - Đại Cồ Việt', 150, 'Tòa C1 - Tầng 2 (Mặt đường Đại Cồ Việt - Cổng Bắc)', JSON.stringify(['Máy chiếu', 'Bảng thông minh', 'Điều hòa', 'Loa', 'Micro']), 'active', 'Hội trường trung tâm C1 quy mô lớn');
  insertRoom.run('Hội trường C2', 120, 'Tòa C2 - Tầng 1 (Trục đường Giải Phóng)', JSON.stringify(['Máy chiếu', 'Bảng thông minh', 'Điều hòa', 'Loa', 'Micro', 'Webcam']), 'active', 'Hội trường C2 trang bị âm thanh vòm kỹ thuật số');
  insertRoom.run('Phòng C3-201', 60, 'Tòa C3 - Tầng 2', JSON.stringify(['Máy tính', 'Máy chiếu', 'Bảng thông minh', 'Điều hòa', 'Loa']), 'active', 'Phòng thực hành máy tính & lập trình đồ họa');
  insertRoom.run('Phòng C5-102', 45, 'Tòa C5 - Tầng 1', JSON.stringify(['Bảng thông minh', 'Điều hòa', 'Webcam', 'Màn hình TV']), 'maintenance', 'Đang bảo trì hệ thống điều hòa');
  insertRoom.run('Hội trường Thư viện Tạ Quang Bửu', 200, 'Thư viện Tạ Quang Bửu - Tầng 4', JSON.stringify(['Máy chiếu', 'Bảng thông minh', 'Điều hòa', 'Loa', 'Micro', 'Webcam', 'Màn hình TV']), 'active', 'Hội trường danh dự Thư viện Tạ Quang Bửu');
  insertRoom.run('Phòng D3-201', 55, 'Tòa D3 - Tầng 2 (Khu D)', JSON.stringify(['Máy chiếu', 'Máy tính', 'Điều hòa', 'Webcam', 'Loa']), 'active', 'Phòng hội thảo chuyên đề trực tuyến');

  const insertBooking = db.prepare(`
    INSERT INTO bookings (room_id, user_id, start_time, end_time, purpose, status, admin_note, cancel_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Current dates around October 2026
  insertBooking.run(1, 2, '2026-10-06T08:00:00', '2026-10-06T10:00:00', 'Giảng dạy môn Đại số tuyến tính', 'approved', 'Đã duyệt theo kế hoạch khoa', null);
  insertBooking.run(2, 3, '2026-10-06T13:30:00', '2026-10-06T15:30:00', 'Học nhóm ôn thi Vật lý đại cương', 'pending', null, null);
  insertBooking.run(3, 2, '2026-10-07T08:30:00', '2026-10-07T11:30:00', 'Thực hành Lập trình Web nâng cao', 'approved', 'Đã xếp lịch phòng máy tính', null);
  insertBooking.run(1, 3, '2026-10-07T14:00:00', '2026-10-07T16:00:00', 'Sinh hoạt câu lạc bộ Tiếng Anh', 'rejected', 'Trùng kế hoạch hội nghị của bộ môn', null);
  insertBooking.run(5, 2, '2026-10-08T08:00:00', '2026-10-08T11:00:00', 'Tập huấn kỹ năng mềm cho tân sinh viên', 'approved', 'Đồng ý', null);
  insertBooking.run(1, 2, '2026-10-08T13:00:00', '2026-10-08T15:00:00', 'Họp ban chủ nhiệm khoa', 'cancelled', null, 'Dời sang tuần sau do trưởng khoa bận công tác');
  insertBooking.run(6, 3, '2026-10-09T09:00:00', '2026-10-09T11:30:00', 'Hội thảo trực tuyến với đối tác doanh nghiệp', 'pending', null, null);
  insertBooking.run(2, 2, '2026-10-06T08:00:00', '2026-10-06T10:30:00', 'Lớp Triết học Mác - Lênin', 'approved', 'Đã duyệt', null);

  save();
  console.log('Khởi tạo dữ liệu mẫu SQLite thành công!');
}

export function addAuditLog({ userId, userName, action, entityType, entityId, details }) {
  try {
    db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId || null, userName || 'Hệ thống', action, entityType, entityId || null, details || '');
  } catch (err) {
    console.error('Lỗi ghi audit log:', err);
  }
}

export default db;
