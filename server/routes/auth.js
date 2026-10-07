import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'qlpm-secret-key-2024';

// 1. Đăng nhập bằng Tên đăng nhập, Mã số sinh viên (MSSV) hoặc Email
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Vui lòng cung cấp mã số sinh viên / tên đăng nhập và mật khẩu' });
  }

  const trimmedIdentifier = username.trim();

  // Tìm theo username, student_id (MSSV) hoặc email
  const user = db.prepare(`
    SELECT * FROM users 
    WHERE username = ? 
       OR student_id = ? 
       OR (email = ? AND email IS NOT NULL AND email != '')
  `).get(trimmedIdentifier, trimmedIdentifier, trimmedIdentifier);

  if (!user || !user.password || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Mã số sinh viên/tài khoản hoặc mật khẩu không chính xác' });
  }

  const payload = { id: user.id, username: user.username, role: user.role };
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '24h' });

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      student_id: user.student_id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      provider: user.provider || 'local'
    }
  });
});

// 2. Đăng ký tài khoản (bằng Mã số sinh viên + Mật khẩu)
router.post('/register', (req, res) => {
  const { student_id, username, password, full_name, email, phone } = req.body;

  if (!password || !full_name) {
    return res.status(400).json({ error: 'Vui lòng cung cấp họ tên và mật khẩu' });
  }

  const actualStudentId = (student_id || '').trim();
  const actualUsername = (username || actualStudentId).trim();

  if (!actualUsername) {
    return res.status(400).json({ error: 'Vui lòng cung cấp mã số sinh viên hoặc tên đăng nhập' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
  }

  try {
    // Kiểm tra trùng username
    const existingUsername = db.prepare('SELECT id FROM users WHERE username = ?').get(actualUsername);
    if (existingUsername) {
      return res.status(409).json({ error: 'Mã số sinh viên hoặc tên đăng nhập này đã được sử dụng' });
    }

    // Kiểm tra trùng student_id nếu có nhập
    if (actualStudentId) {
      const existingStudentId = db.prepare('SELECT id FROM users WHERE student_id = ?').get(actualStudentId);
      if (existingStudentId) {
        return res.status(409).json({ error: 'Mã số sinh viên này đã được đăng ký tài khoản' });
      }
    }

    // Kiểm tra trùng email nếu có nhập
    if (email && email.trim()) {
      const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim());
      if (existingEmail) {
        return res.status(409).json({ error: 'Email này đã được sử dụng bởi tài khoản khác' });
      }
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare(`
      INSERT INTO users (username, student_id, password, full_name, email, phone, role, provider)
      VALUES (?, ?, ?, ?, ?, ?, 'user', 'local')
    `).run(
      actualUsername,
      actualStudentId || actualUsername,
      hashedPassword,
      full_name.trim(),
      email ? email.trim() : null,
      phone ? phone.trim() : null
    );

    const newUserId = result.lastInsertRowid;
    const payload = { id: newUserId, username: actualUsername, role: 'user' };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '24h' });

    res.status(201).json({
      message: 'Đăng ký tài khoản thành công',
      token,
      user: {
        id: newUserId,
        username: actualUsername,
        student_id: actualStudentId || actualUsername,
        full_name: full_name.trim(),
        email: email ? email.trim() : null,
        phone: phone ? phone.trim() : null,
        role: 'user',
        provider: 'local'
      }
    });
  } catch (error) {
    console.error('Lỗi khi đăng ký:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi tạo tài khoản' });
  }
});

// 3. Đăng nhập / Đăng ký qua Mạng xã hội (Google, Facebook)
router.post('/social', (req, res) => {
  const { provider, provider_id, email, full_name, avatar, student_id } = req.body;

  if (!provider || !['google', 'facebook'].includes(provider)) {
    return res.status(400).json({ error: 'Nhà cung cấp xác thực không hợp lệ' });
  }

  if (!email && !provider_id) {
    return res.status(400).json({ error: 'Thiếu thông tin tài khoản mạng xã hội' });
  }

  try {
    // Tìm kiếm xem tài khoản đã tồn tại chưa (qua provider_id hoặc email)
    let user = null;
    if (provider_id) {
      user = db.prepare('SELECT * FROM users WHERE provider = ? AND provider_id = ?').get(provider, String(provider_id));
    }
    if (!user && email) {
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    }

    if (user) {
      // Đã có tài khoản: Cập nhật thông tin provider & avatar nếu cần
      if ((!user.provider_id && provider_id) || (!user.avatar && avatar)) {
        db.prepare(`
          UPDATE users 
          SET provider = COALESCE(provider, ?), 
              provider_id = COALESCE(provider_id, ?),
              avatar = COALESCE(avatar, ?)
          WHERE id = ?
        `).run(provider, String(provider_id || ''), avatar || null, user.id);
      }
    } else {
      // Chưa có tài khoản: Tạo tài khoản mới tự động
      const baseName = email ? email.split('@')[0] : `${provider}_${provider_id}`;
      let usernameCandidate = baseName.replace(/[^a-zA-Z0-9_]/g, '_');
      let counter = 1;
      while (db.prepare('SELECT id FROM users WHERE username = ?').get(usernameCandidate)) {
        usernameCandidate = `${baseName}_${counter++}`;
      }

      const generatedPassword = bcrypt.hashSync(Math.random().toString(36), 10);
      const displayName = full_name || (email ? email.split('@')[0] : `Người dùng ${provider}`);

      const result = db.prepare(`
        INSERT INTO users (username, student_id, password, full_name, email, role, provider, provider_id, avatar)
        VALUES (?, ?, ?, ?, ?, 'user', ?, ?, ?)
      `).run(
        usernameCandidate,
        student_id || null,
        generatedPassword,
        displayName,
        email || null,
        provider,
        String(provider_id || ''),
        avatar || null
      );

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    }

    const payload = { id: user.id, username: user.username, role: user.role };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '24h' });

    res.json({
      message: `Đăng nhập thành công với ${provider === 'google' ? 'Google' : 'Facebook'}`,
      token,
      user: {
        id: user.id,
        username: user.username,
        student_id: user.student_id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        provider: user.provider
      }
    });
  } catch (error) {
    console.error('Lỗi khi đăng nhập mạng xã hội:', error);
    res.status(500).json({ error: 'Không thể xử lý đăng nhập mạng xã hội' });
  }
});

// 4. Lấy thông tin tài khoản hiện tại
router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, username, student_id, full_name, email, phone, role, provider, avatar FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'Không tìm thấy người dùng' });
  }
  res.json(user);
});

export default router;
