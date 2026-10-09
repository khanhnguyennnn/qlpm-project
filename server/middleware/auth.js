import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'qlpm-secret-key-2024';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Không tìm thấy token xác thực' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    req.user = user;
    next();
  });
};

export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Không có quyền truy cập (yêu cầu quyền Admin)' });
  }
};
